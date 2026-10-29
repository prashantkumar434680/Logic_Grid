const { normalizeTopicTag, TOPIC_CONFIG } = require('./src/services/skillAnalyticsService');
const { extractTextFromPdf, createChunksFromPages, cleanPageText, detectHeading } = require('./src/services/pdfExtractionService');
const { cosineSimilarity, generateDeterministicEmbedding } = require('./src/services/embeddingService');
const { calculateTextOverlap } = require('./src/services/retrievalService');
const { getSkillTier } = require('./src/services/learningService');

const runTests = async () => {
  console.log('--- Starting Personalized DSA Assistant Service Tests ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  };

  // 1. Topic Normalization Tests
  assert(normalizeTopicTag('array') === 'array', 'Normalize array tag');
  assert(normalizeTopicTag('Linked List') === 'linkedList', 'Normalize Linked List');
  assert(normalizeTopicTag('bsearch') === 'binarySearch', 'Normalize bsearch');
  assert(normalizeTopicTag('Dynamic Programming') === 'dp', 'Normalize DP');
  assert(normalizeTopicTag('tree') === 'tree', 'Normalize tree');
  assert(normalizeTopicTag('graphs') === 'graph', 'Normalize graph');

  // 2. Skill Tier Logic Tests
  assert(getSkillTier(25) === 'Beginner', 'Tier: 25% is Beginner');
  assert(getSkillTier(60) === 'Intermediate', 'Tier: 60% is Intermediate');
  assert(getSkillTier(85) === 'Advanced', 'Tier: 85% is Advanced');

  // 3. Cosine Similarity & Vector Tests
  const vec1 = [1, 0, 0];
  const vec2 = [1, 0, 0];
  const vec3 = [0, 1, 0];
  assert(Math.abs(cosineSimilarity(vec1, vec2) - 1.0) < 0.001, 'Identical vectors cosine = 1.0');
  assert(Math.abs(cosineSimilarity(vec1, vec3) - 0.0) < 0.001, 'Orthogonal vectors cosine = 0.0');

  const embA = generateDeterministicEmbedding('binary search algorithm in array');
  const embB = generateDeterministicEmbedding('binary search algorithm in array');
  const embC = generateDeterministicEmbedding('breadth first search traversal in graph');
  assert(embA.length === 768, 'Embedding dimension is 768');
  assert(Math.abs(cosineSimilarity(embA, embB) - 1.0) < 0.001, 'Deterministic embedding is consistent');
  assert(cosineSimilarity(embA, embB) > cosineSimilarity(embA, embC), 'Semantic proximity distinguishes concepts');

  // 4. Overlap & Redundancy Filter Tests
  const text1 = 'Binary search requires sorted array and evaluates middle element at each step.';
  const text2 = 'Binary search requires sorted array and evaluates middle element at each step.';
  const text3 = 'Graph depth first search uses stack or recursion to explore nodes.';
  assert(calculateTextOverlap(text1, text2) === 1.0, 'Identical text overlap is 1.0');
  assert(calculateTextOverlap(text1, text3) < 0.2, 'Different text overlap is low');

  // 5. PDF Heading & Text Cleaning
  const samplePage = `
    Chapter 4: Binary Search Trees
    Section 4.1: Properties of Binary Search Trees
    A binary search tree satisfies the invariant that for any node X, all values in its left subtree are smaller than X.val.
  `;
  const heading = detectHeading(samplePage);
  assert(heading.chapter.includes('Binary Search Trees'), 'Heading chapter detected correctly');
  assert(heading.section.includes('Properties'), 'Heading section detected correctly');

  // 6. Semantic Chunking
  const pages = [
    { pageNumber: 1, text: samplePage },
    { pageNumber: 2, text: 'Traversals: Inorder traversal visits left, root, right in ascending order. Time complexity is O(N).' }
  ];
  const chunks = createChunksFromPages(pages, 'mock_book_id', 'Mock DSA Guide');
  assert(chunks.length >= 2, 'Chunks created from pages');
  assert(chunks[0].bookTitle === 'Mock DSA Guide', 'Chunk retains book title');
  assert(chunks[0].pageNumber === 1, 'Chunk retains page number');
  assert(chunks[0].topicTags.includes('tree'), 'Tree topic tag detected in chunk');

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
