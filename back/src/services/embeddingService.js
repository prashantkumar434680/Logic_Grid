let GoogleGenAIClass = null;

const getGoogleGenAI = async () => {
  if (!GoogleGenAIClass) {
    try {
      const module = await import('@google/genai');
      GoogleGenAIClass = module.GoogleGenAI || module.default?.GoogleGenAI;
    } catch (err) {
      console.warn('Could not load @google/genai dynamically:', err.message);
    }
  }
  return GoogleGenAIClass;
};

/**
 * Calculates Cosine Similarity between two numeric vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Generates deterministic fallback embedding vector when API is unreachable
 */
const generateDeterministicEmbedding = (text, dim = 768) => {
  const vector = new Array(dim).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[idx] += sign * (1 / (1 + Math.log(1 + i)));
  }

  // Normalize to unit length
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] /= norm;
    }
  }
  return vector;
};

/**
 * Generates an embedding for a text string using Gemini API with fallback
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return generateDeterministicEmbedding('empty');
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return generateDeterministicEmbedding(text);
  }

  try {
    const GenAI = await getGoogleGenAI();
    if (!GenAI) {
      return generateDeterministicEmbedding(text);
    }

    const ai = new GenAI({ apiKey });
    // Truncate to reasonable token length for embedding
    const truncated = text.slice(0, 3000);

    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: truncated,
    });

    if (response?.embedding?.values) {
      return response.embedding.values;
    }
  } catch (err) {
    // If rate-limited or offline, fallback safely
    console.warn('Embedding API unavailable or throttled, using semantic vector fallback:', err.message);
  }

  return generateDeterministicEmbedding(text);
};

/**
 * Generates embeddings for an array of chunks in batches
 */
const generateBatchEmbeddings = async (chunks, batchSize = 10, delayMs = 300) => {
  const results = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchPromises = batch.map(async (c) => {
      const vec = await generateEmbedding(c.content);
      return {
        ...c,
        embedding: vec,
      };
    });

    const resolved = await Promise.all(batchPromises);
    results.push(...resolved);

    if (i + batchSize < chunks.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  generateDeterministicEmbedding,
};
