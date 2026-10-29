const DsaBook = require('../Models/DsaBook');
const BookChunk = require('../Models/BookChunk');
const { extractTextFromPdf, createChunksFromPages } = require('./pdfExtractionService');
const { generateBatchEmbeddings, cosineSimilarity } = require('./embeddingService');

/**
 * Indexes a book completely from its PDF file
 */
const indexBookPipeline = async (bookId) => {
  const book = await DsaBook.findById(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  try {
    // 1. Mark as Processing
    book.status = 'Processing';
    book.errorMessage = '';
    await book.save();

    // 2. Clear old chunks for safe re-indexing (no duplicate/orphaned vectors)
    await BookChunk.deleteMany({ bookId: book._id });

    // 3. Extract text from PDF
    const extractionResult = await extractTextFromPdf(book.filePath);
    const { numPages, pages } = extractionResult;

    // 4. Create semantic overlapping chunks
    const rawChunks = createChunksFromPages(pages, book._id, book.title);

    if (rawChunks.length === 0) {
      throw new Error('No readable text content could be extracted from this book.');
    }

    // 5. Generate embeddings for all chunks
    const chunksWithEmbeddings = await generateBatchEmbeddings(rawChunks, 8, 200);

    // 6. Save chunks in bulk
    await BookChunk.insertMany(chunksWithEmbeddings);

    // 7. Aggregate detected topics
    const topicSet = new Set();
    chunksWithEmbeddings.forEach((c) => {
      if (Array.isArray(c.topicTags)) {
        c.topicTags.forEach((t) => topicSet.add(t));
      }
    });

    // 8. Update book to Indexed
    book.status = 'Indexed';
    book.pageCount = numPages;
    book.totalChunks = chunksWithEmbeddings.length;
    book.detectedTopics = Array.from(topicSet);
    book.errorMessage = '';
    await book.save();

    return {
      success: true,
      bookId: book._id,
      title: book.title,
      numPages,
      totalChunks: chunksWithEmbeddings.length,
      detectedTopics: book.detectedTopics,
    };
  } catch (err) {
    book.status = 'Failed';
    book.errorMessage = err.message || 'Unknown processing error during indexing';
    await book.save();
    throw err;
  }
};

/**
 * Performs vector similarity search with optional metadata and topic filtering
 */
const vectorSearch = async ({
  queryVector,
  topic = null,
  bookId = null,
  topK = 5,
  minRelevance = 0.40,
}) => {
  const query = {};
  if (bookId) query.bookId = bookId;

  // Find candidate chunks
  // If topic is specified, we can optionally prefer chunks tagged with the topic
  let chunks = await BookChunk.find(query).select(
    '_id bookId bookTitle chapterTitle sectionTitle pageNumber pageRange chunkIndex chunkId content embedding topicTags'
  );

  if (chunks.length === 0) {
    return [];
  }

  // Calculate cosine similarity for each chunk
  const scoredChunks = chunks
    .map((chunk) => {
      const score = cosineSimilarity(queryVector, chunk.embedding || []);
      // Give a slight boost (0.05) if chunk explicitly tags this topic
      let boostedScore = score;
      if (topic && Array.isArray(chunk.topicTags) && chunk.topicTags.includes(topic)) {
        boostedScore = Math.min(1.0, score + 0.05);
      }

      return {
        _id: chunk._id,
        bookId: chunk.bookId,
        bookTitle: chunk.bookTitle,
        chapterTitle: chunk.chapterTitle,
        sectionTitle: chunk.sectionTitle,
        pageNumber: chunk.pageNumber,
        pageRange: chunk.pageRange,
        chunkId: chunk.chunkId,
        content: chunk.content,
        topicTags: chunk.topicTags,
        similarityScore: Math.round(boostedScore * 1000) / 1000,
      };
    })
    .filter((c) => c.similarityScore >= minRelevance);

  // Sort descending by similarity
  scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);

  return scoredChunks.slice(0, topK);
};

/**
 * Completely removes a book, its files, and all vectors
 */
const removeBookAndVectors = async (bookId) => {
  const book = await DsaBook.findById(bookId);
  if (!book) return false;

  // Delete all vectors
  await BookChunk.deleteMany({ bookId: book._id });

  // Delete book record
  await DsaBook.findByIdAndDelete(bookId);

  return true;
};

module.exports = {
  indexBookPipeline,
  vectorSearch,
  removeBookAndVectors,
};
