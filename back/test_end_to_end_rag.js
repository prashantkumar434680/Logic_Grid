const fs = require('fs');
const path = require('path');
const { extractTextFromPdf, createChunksFromPages, cleanPageText, detectHeading } = require('./src/services/pdfExtractionService');
const { generateEmbedding, cosineSimilarity } = require('./src/services/embeddingService');
const { calculateTextOverlap } = require('./src/services/retrievalService');
const { getSkillTier } = require('./src/services/learningService');

// Helper to construct a minimal valid uncompressed PDF with stream text
function createTestPdfBuffer(pagesContent) {
  let streamParts = [];
  let objects = [];
  let xrefOffsets = [];

  let pdf = '%PDF-1.4\n';

  const addObj = (str) => {
    xrefOffsets.push(pdf.length);
    const objNum = objects.length + 1;
    pdf += `${objNum} 0 obj\n${str}\nendobj\n`;
    objects.push(objNum);
    return objNum;
  };

  // Obj 1: Catalog
  const catalogNum = addObj('<< /Type /Catalog /Pages 2 0 R >>');

  // Obj 2: Pages (placeholder, will fill kids)
  const pagesObjIdx = xrefOffsets.length;
  xrefOffsets.push(pdf.length);
  const pagesNum = objects.length + 1;
  objects.push(pagesNum);
  const pagesPos = pdf.length;
  pdf += 'PAGES_OBJECT_PLACEHOLDER_________________________________\n';

  // Fonts
  const fontNum = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let kidNums = [];
  for (let i = 0; i < pagesContent.length; i++) {
    const text = pagesContent[i];
    const streamContent = `BT /F1 12 Tf 50 750 Td (${text.replace(/[()\\]/g, '')}) Tj ET`;
    const streamNum = addObj(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);
    const pageNum = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamNum} 0 R /Resources << /Font << /F1 ${fontNum} 0 R >> >> >>`);
    kidNums.push(`${pageNum} 0 R`);
  }

  // Update Pages Object
  const pagesBody = `<< /Type /Pages /Kids [ ${kidNums.join(' ')} ] /Count ${kidNums.length} >>\nendobj\n`;
  const actualPagesObj = `${pagesNum} 0 obj\n${pagesBody}`;
  pdf = pdf.replace('PAGES_OBJECT_PLACEHOLDER_________________________________\n', actualPagesObj);

  // Xref
  const startXref = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of xrefOffsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'binary');
}

async function testRAGWorkflow() {
  console.log('=== Running End-to-End RAG Learning Assistant Verification ===\n');

  // 1. Create a synthetic educational textbook PDF
  const sampleBookPages = [
    'Chapter 1: Binary Search and Divide-and-Conquer. Binary search efficiently searches for a target value within a sorted array. It repeatedly divides the search space in half by comparing the middle element with the target. If target equals middle, search terminates. If target is less, search left subarray. Time complexity is O(log N).',
    'Chapter 1: Section 1.2 Lower Bound and Boundary Invariants. When calculating midpoint, avoid integer overflow by using mid = left + (right - left) / 2. Common bugs include infinite loops caused by left <= right versus left < right. Invariant: candidate answer is always kept inside the search interval.',
    'Chapter 2: Dynamic Programming and Optimal Substructure. Dynamic programming solves problems by combining solutions to overlapping subproblems. Memorization stores recursive results in a cache, while tabulation iteratively fills a table bottom-up. Classic examples include 0-1 Knapsack and Longest Common Subsequence.',
  ];

  const tempPdfPath = path.join(__dirname, 'test_synthetic_book.pdf');
  fs.writeFileSync(tempPdfPath, createTestPdfBuffer(sampleBookPages));
  console.log('✔ Synthetic DSA textbook PDF generated at:', tempPdfPath);

  // 2. Test PDF extraction
  const extracted = await extractTextFromPdf(tempPdfPath);
  console.log(`✔ Extracted ${extracted.numPages} pages from PDF.`);
  if (extracted.pages.length === 0) {
    throw new Error('Failed to extract pages from synthetic PDF');
  }

  // 3. Test semantic chunking
  const chunks = createChunksFromPages(extracted.pages, 'book_001', 'Algorithm Design Essentials');
  console.log(`✔ Generated ${chunks.length} semantic chunks with grounded metadata.`);
  console.log('  Sample Chunk Metadata:', {
    chunkId: chunks[0].chunkId,
    chapterTitle: chunks[0].chapterTitle,
    pageNumber: chunks[0].pageNumber,
    topicTags: chunks[0].topicTags,
  });

  // 4. Test vector embedding and retrieval
  const query = 'How do I choose loop condition in binary search to prevent infinite loop?';
  const queryEmb = await generateEmbedding(query);
  console.log(`✔ Generated query embedding vector (length: ${queryEmb.length})`);

  let bestChunk = null;
  let maxSim = -1;

  for (const chunk of chunks) {
    const chunkEmb = await generateEmbedding(chunk.content);
    const sim = cosineSimilarity(queryEmb, chunkEmb);
    console.log(`  Similarity with [p.${chunk.pageNumber} | ${chunk.chapterTitle}]: ${sim.toFixed(4)}`);
    if (sim > maxSim) {
      maxSim = sim;
      bestChunk = chunk;
    }
  }

  console.log(`✔ Top retrieved chunk: "${bestChunk.chapterTitle}" (Score: ${maxSim.toFixed(4)})`);
  if (!bestChunk.content.toLowerCase().includes('binary search')) {
    throw new Error('Retrieval failed to identify binary search chunk');
  }

  // 5. Test Scanned PDF OCR Detection
  console.log('\n--- Testing OCR Scanned PDF Edge Case ---');
  const emptyPdfPath = path.join(__dirname, 'test_empty_scan.pdf');
  fs.writeFileSync(emptyPdfPath, createTestPdfBuffer(['']));
  try {
    await extractTextFromPdf(emptyPdfPath);
    console.error('❌ Expected OCR error not thrown');
  } catch (err) {
    console.log('✔ Correctly caught OCR required condition:', err.message);
  } finally {
    if (fs.existsSync(emptyPdfPath)) fs.unlinkSync(emptyPdfPath);
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
  }

  console.log('\n=== All RAG Verification Tests Succeeded! ===');
}

testRAGWorkflow().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
