const fs = require('fs');
const zlib = require('zlib');

/**
 * Extracts text and page metadata from a PDF file.
 * Automatically tries pdf-parse if available, with built-in PDF stream decompression as a reliable fallback.
 */
const extractTextFromPdf = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  // 1. Try pdf-parse if installed
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY, text = '';
          for (const item of textContent.items) {
            if (lastY === item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return `---PAGE_BREAK_${pageData.pageIndex + 1}---\n` + text;
        });
      },
    });

    if (data && data.text && data.text.trim().length > 100) {
      return parsePagesFromText(data.text, data.numpages || 1);
    }
  } catch (err) {
    // pdf-parse not installed or had an issue, fallback to internal stream parser
  }

  // 2. Built-in Fallback PDF text stream parser
  return extractPdfStreamsInternal(buffer);
};

/**
 * Built-in PDF parser for standard unencrypted PDFs
 */
const extractPdfStreamsInternal = (buffer) => {
  const content = buffer.toString('binary');
  const pages = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  let rawText = '';
  let currentPage = 1;

  while ((match = streamRegex.exec(content)) !== null) {
    const streamData = Buffer.from(match[1], 'binary');
    let decompressed;

    try {
      decompressed = zlib.inflateSync(streamData).toString('utf-8');
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamData).toString('utf-8');
      } catch {
        continue;
      }
    }

    if (decompressed && (decompressed.includes('BT') || decompressed.includes('Tj') || decompressed.includes('TJ'))) {
      const extracted = parseTextFromPdfOperators(decompressed);
      if (extracted.trim().length > 0) {
        rawText += extracted + '\n\n';
      }
    }
  }

  // If no text streams found in flate streams, look for plain text BT...ET
  if (rawText.trim().length === 0) {
    const btRegex = /BT[\s\S]*?ET/g;
    let btMatch;
    while ((btMatch = btRegex.exec(content)) !== null) {
      const extracted = parseTextFromPdfOperators(btMatch[0]);
      if (extracted.trim().length > 0) {
        rawText += extracted + '\n\n';
      }
    }
  }

  // Check if OCR is required
  if (rawText.trim().length < 50) {
    throw new Error(
      'OCR Required: This PDF appears to be a scanned image or empty file without an embedded text layer. Please use a text-based PDF or run OCR before uploading.'
    );
  }

  // Segment by estimated pages (~2500 chars per page if markers not explicit)
  const pageSize = 2500;
  const totalLength = rawText.length;
  const numPages = Math.max(1, Math.ceil(totalLength / pageSize));

  for (let i = 0; i < numPages; i++) {
    const pageText = rawText.slice(i * pageSize, (i + 1) * pageSize);
    pages.push({
      pageNumber: i + 1,
      text: cleanPageText(pageText),
    });
  }

  return {
    numPages,
    pages,
  };
};

/**
 * Extracts text from PDF postscript operators (Tj, TJ, ', ")
 */
const parseTextFromPdfOperators = (streamText) => {
  let output = '';
  // Match Tj: (Text) Tj
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let tjMatch;
  while ((tjMatch = tjRegex.exec(streamText)) !== null) {
    output += unescapePdfString(tjMatch[1]) + ' ';
  }

  // Match TJ: [ (Text) 120 (Text2) ] TJ
  const arrayTjRegex = /\[([\s\S]*?)\]\s*TJ/g;
  let arrMatch;
  while ((arrMatch = arrayTjRegex.exec(streamText)) !== null) {
    const inner = arrMatch[1];
    const subStrRegex = /\(([^)]*)\)/g;
    let subStrMatch;
    while ((subStrMatch = subStrRegex.exec(inner)) !== null) {
      output += unescapePdfString(subStrMatch[1]);
    }
    output += ' ';
  }

  return output;
};

const unescapePdfString = (str) => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
};

/**
 * Splits text parsed from pdf-parse into per-page objects
 */
const parsePagesFromText = (fullText, numPages) => {
  const pageDelimiterRegex = /---PAGE_BREAK_(\d+)---/g;
  const pages = [];

  if (pageDelimiterRegex.test(fullText)) {
    const parts = fullText.split(/---PAGE_BREAK_\d+---\n/);
    parts.forEach((p, idx) => {
      const trimmed = cleanPageText(p);
      if (trimmed) {
        pages.push({
          pageNumber: idx || 1,
          text: trimmed,
        });
      }
    });
  } else {
    // If no markers, divide into equal logical pages
    const pageSize = 2500;
    const count = Math.max(1, Math.ceil(fullText.length / pageSize));
    for (let i = 0; i < count; i++) {
      pages.push({
        pageNumber: i + 1,
        text: cleanPageText(fullText.slice(i * pageSize, (i + 1) * pageSize)),
      });
    }
  }

  if (pages.length === 0 || fullText.trim().length < 50) {
    throw new Error(
      'OCR Required: This PDF has insufficient readable text. Scanned or image-only documents require OCR preprocessing.'
    );
  }

  return {
    numPages: pages.length,
    pages,
  };
};

/**
 * Strips repeated headers, footers, and strange control chars
 */
const cleanPageText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove ASCII control characters
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '') // generic page numbers
    .trim();
};

/**
 * Detects Chapter or Section titles from text
 */
const detectHeading = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let chapter = '';
  let section = '';

  for (const line of lines.slice(0, 8)) {
    const chapMatch = line.match(/^(?:Chapter|Unit|Module)\s+(\d+[:.]?[\s\w-]+)/i);
    if (chapMatch && !chapter) {
      chapter = line;
      continue;
    }

    const secMatch = line.match(/^(?:\d+\.\d+|\bSection\b|[A-Z][a-zA-Z\s]{3,35}:)/);
    if (secMatch && !section && line.length < 60) {
      section = line;
    }
  }

  return {
    chapter: chapter || 'General',
    section: section || 'Introduction',
  };
};

/**
 * Breaks page texts into semantic chunks with metadata
 */
const createChunksFromPages = (pages, bookId, bookTitle, chunkSize = 1600, overlap = 250) => {
  const chunks = [];
  let chunkIndex = 0;
  let currentChapter = 'Overview';
  let currentSection = 'General Concepts';

  for (const page of pages) {
    const { pageNumber, text } = page;
    if (!text || text.length < 40) continue;

    // Heading tracking
    const detected = detectHeading(text);
    if (detected.chapter !== 'General') currentChapter = detected.chapter;
    if (detected.section !== 'Introduction') currentSection = detected.section;

    // Split page text into overlapping windows
    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;

      // Try not to cut in the middle of a sentence
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('. ', end);
        const newlineEnd = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(sentenceEnd, newlineEnd);
        if (breakPoint > start + chunkSize * 0.6) {
          end = breakPoint + 1;
        }
      } else {
        end = text.length;
      }

      const chunkText = text.slice(start, end).trim();

      if (chunkText.length >= 80) {
        const chunkId = `${bookId}_c${chunkIndex}`;

        // Tag detection for common DSA topics
        const topicTags = [];
        const lower = chunkText.toLowerCase();
        if (lower.includes('array') || lower.includes('subarray') || lower.includes('matrix')) topicTags.push('array');
        if (lower.includes('string') || lower.includes('substring') || lower.includes('anagram')) topicTags.push('string');
        if (lower.includes('binary search') || lower.includes('bsearch') || lower.includes('search space')) topicTags.push('binarySearch');
        if (lower.includes('linked list') || lower.includes('singly') || lower.includes('doubly linked')) topicTags.push('linkedList');
        if (lower.includes('stack') || lower.includes('queue') || lower.includes('deque')) topicTags.push('stackQueue');
        if (lower.includes('tree') || lower.includes('bst') || lower.includes('traversal') || lower.includes('heap')) topicTags.push('tree');
        if (lower.includes('graph') || lower.includes('bfs') || lower.includes('dfs') || lower.includes('dijkstra')) topicTags.push('graph');
        if (lower.includes('greedy') || lower.includes('interval') || lower.includes('fractional knapsack')) topicTags.push('greedy');
        if (lower.includes('recursion') || lower.includes('backtrack') || lower.includes('n-queens')) topicTags.push('recursionBacktracking');
        if (lower.includes('dynamic programming') || lower.includes('memoization') || lower.includes('tabulation') || lower.includes(' knapsack')) topicTags.push('dp');

        chunks.push({
          bookId,
          bookTitle,
          chapterTitle: currentChapter,
          sectionTitle: currentSection,
          pageNumber,
          pageRange: `p. ${pageNumber}`,
          chunkIndex,
          chunkId,
          content: chunkText,
          tokenCount: Math.round(chunkText.length / 4),
          topicTags,
          metadata: {
            length: chunkText.length,
            detectedAt: new Date().toISOString(),
          },
        });

        chunkIndex += 1;
      }

      start = end - overlap;
      if (start >= text.length - overlap) break;
    }
  }

  return chunks;
};

module.exports = {
  extractTextFromPdf,
  createChunksFromPages,
  cleanPageText,
  detectHeading,
};
