const fs = require('fs');
const path = require('path');
const DsaBook = require('../Models/DsaBook');
const { indexBookPipeline, removeBookAndVectors } = require('../services/vectorStoreService');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/books');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Handles raw multipart/form-data upload when multer is not loaded
 */
const parseMultipartUpload = (req) => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error('Invalid Content-Type. Expected multipart/form-data.'));
    }

    const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/);
    if (!boundaryMatch) {
      return reject(new Error('Missing boundary in multipart request.'));
    }
    const boundary = boundaryMatch[1];
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = splitBuffer(buffer, `--${boundary}`);
        const fields = {};
        let fileData = null;

        for (const part of parts) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;
          const headerText = part.slice(0, headerEnd).toString('utf-8');
          const body = part.slice(headerEnd + 4, part.length - 2); // trim trailing \r\n

          const disposition = headerText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
          if (!disposition) continue;

          const fieldName = disposition[1];
          const filename = disposition[2];

          if (filename) {
            fileData = {
              filename,
              buffer: body,
              size: body.length,
            };
          } else {
            fields[fieldName] = body.toString('utf-8').trim();
          }
        }

        resolve({ fields, file: fileData });
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
};

const splitBuffer = (buf, delimiter) => {
  const delimBuf = Buffer.from(delimiter);
  const parts = [];
  let start = 0;
  let index;

  while ((index = buf.indexOf(delimBuf, start)) !== -1) {
    if (start > 0 || index > start) {
      parts.push(buf.slice(start, index));
    }
    start = index + delimBuf.length;
  }
  if (start < buf.length) {
    parts.push(buf.slice(start));
  }
  return parts;
};

/**
 * Upload a new DSA textbook PDF (Admin only)
 */
const uploadBook = async (req, res) => {
  try {
    let fields = {};
    let file = null;

    // Check if multer already parsed it or parse raw stream
    if (req.file) {
      file = {
        filename: req.file.originalname,
        buffer: fs.readFileSync(req.file.path),
        size: req.file.size,
        savedPath: req.file.path,
      };
      fields = req.body || {};
    } else {
      const parsed = await parseMultipartUpload(req);
      fields = parsed.fields;
      file = parsed.file;
    }

    if (!file || !file.buffer || file.size === 0) {
      return res.status(400).json({ message: 'No PDF file was uploaded.' });
    }

    // Validation: PDF extension / magic bytes
    const isPdfExt = file.filename.toLowerCase().endsWith('.pdf');
    const isPdfMagic = file.buffer.slice(0, 5).toString('utf-8') === '%PDF-';
    if (!isPdfExt && !isPdfMagic) {
      return res.status(400).json({ message: 'Only valid PDF documents are supported.' });
    }

    // File size limit: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ message: 'File size exceeds 50MB limit.' });
    }

    const title = fields.title || file.filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    const author = fields.author || 'Unknown Author';
    const source = fields.source || 'Admin Upload';

    // Save to disk
    const safeFilename = `${Date.now()}_${file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destinationPath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(destinationPath, file.buffer);

    // Create DB record
    const newBook = await DsaBook.create({
      title,
      author,
      source,
      filename: file.filename,
      filePath: destinationPath,
      fileSize: file.size,
      status: 'Uploaded',
      uploadedBy: req.result._id,
      version: 1,
    });

    // Start background ingestion pipeline
    indexBookPipeline(newBook._id).catch((err) => {
      console.error(`Background ingestion failed for book ${newBook._id}:`, err);
    });

    return res.status(201).json({
      message: 'Book uploaded successfully. Ingestion process started.',
      book: {
        _id: newBook._id,
        title: newBook.title,
        author: newBook.author,
        status: newBook.status,
        fileSize: newBook.fileSize,
      },
    });
  } catch (err) {
    console.error('Book upload error:', err);
    return res.status(500).json({ message: err.message || 'Failed to process book upload.' });
  }
};

/**
 * List all uploaded books
 */
const getBooksList = async (req, res) => {
  try {
    const books = await DsaBook.find({})
      .sort({ createdAt: -1 })
      .select('_id title author source status totalChunks pageCount fileSize createdAt updatedAt errorMessage detectedTopics');

    return res.status(200).json({ books });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch books list.' });
  }
};

/**
 * Get status of a specific book
 */
const getBookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await DsaBook.findById(id).select('_id title status totalChunks pageCount errorMessage detectedTopics');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.status(200).json({ book });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch book status' });
  }
};

/**
 * Re-index an existing book
 */
const reindexBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await DsaBook.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!fs.existsSync(book.filePath)) {
      return res.status(400).json({ message: 'Original PDF file is missing on server. Please re-upload.' });
    }

    book.status = 'Processing';
    book.version += 1;
    await book.save();

    indexBookPipeline(book._id).catch((err) => {
      console.error(`Re-indexing failed for book ${book._id}:`, err);
    });

    return res.status(200).json({
      message: 'Re-indexing initiated.',
      bookId: book._id,
      version: book.version,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to trigger re-index.' });
  }
};

/**
 * Delete a book and its vectors
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await DsaBook.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete file if exists
    if (fs.existsSync(book.filePath)) {
      try {
        fs.unlinkSync(book.filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }

    await removeBookAndVectors(id);

    return res.status(200).json({ message: 'Book and all associated vectors deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to delete book.' });
  }
};

module.exports = {
  uploadBook,
  getBooksList,
  getBookStatus,
  reindexBook,
  deleteBook,
};
