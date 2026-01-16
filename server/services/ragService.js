const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../db");

// Professional Mock Fallback for Demos
const MOCK_MODE =
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY.includes("your_gemini_api_key");
if (MOCK_MODE) console.warn("⚠️ App is running in MOCK MODE (No Gemini Key)");

// Initialize Gemini
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

// Embedding model (still valid on v1beta)
const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

// Preferred chat models as requested: try 2.5-flash, then 2.0-flash
const MODEL_NAMES = ["gemini-2.5-flash", "gemini-2.0-flash"];
let model = genAI.getGenerativeModel({ model: MODEL_NAMES[0] });

// This function runs in the background to not block the server startup
async function initGemini() {
    if (MOCK_MODE) return;
    console.log("Checking Gemini API connection...");
    let lastError = null;

    for (const name of MODEL_NAMES) {
        try {
            const testModel = genAI.getGenerativeModel({ model: name });
            // Very short test
            await testModel.generateContent({ contents: [{ role: "user", parts: [{ text: "hi" }] }] });
            model = testModel;
            console.log(`✅ Gemini Connected using model: ${name}`);
            return;
        } catch (err) {
            lastError = err;
        }
    }

    if (lastError) console.error("❌ Gemini Connection Error Detail:", lastError.message);
    console.warn("⚠️ Could not connect to Gemini API. Using Keyword Search fallback.");
}

/**
 * Chunk text into larger pieces for better context
 */
function chunkText(text, size = 800, overlap = 150) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + size));
        i += size - overlap;
        if (i + overlap >= text.length) break;
    }
    return chunks;
}

/**
 * Generate embedding for a given text using Gemini.
 */
async function generateEmbedding(text) {
    if (MOCK_MODE) return null;

    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Gemini Embedding Error:", error);
        return null;
    }
}

/**
 * Fallback keyword search logic
 */
function keywordSearch(query, chunks, topK = 5) {
    const stopWords = new Set([
        "what",
        "is",
        "how",
        "the",
        "and",
        "was",
        "for",
        "who",
        "where",
        "when",
        "this",
        "that",
        "with",
        "are",
        "your",
    ]);

    const words = query
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

    console.log(`[DEBUG] Searching for keywords: [${words.join(", ")}]`);

    if (words.length === 0) return [];

    const scored = chunks.map((chunk) => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        const item = db
            .prepare("SELECT title FROM items WHERE id = ?")
            .get(chunk.item_id);
        const titleLower = (item?.title || "").toLowerCase();

        words.forEach((word) => {
            // 1. Strict Word Boundary Match in Content
            const regex = new RegExp(`\\b${word}\\b`, "g");
            const matches = contentLower.match(regex);
            if (matches) {
                score += matches.length * 100;
                console.log(
                    `[DEBUG] Match found: "${word}" in content (${matches.length}x)`
                );
            }

            // 2. Title Match
            if (titleLower.includes(word)) {
                score += 200;
                console.log(`[DEBUG] Match found: "${word}" in title`);
            }
        });

        return { ...chunk, score, source: item?.title || "Note" };
    });

    const results = scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    console.log(`[DEBUG] Final results: ${results.length} items found.`);
    return results;
}

/**
 * Compute cosine similarity
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0; // Handle dimension mismatch
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve top relevant chunks with improved relevance filtering
 */
async function retrieveContext(query, topK = 3) {
    const queryEmbedding = await generateEmbedding(query);
    const allChunks = db
        .prepare("SELECT id, content, item_id FROM chunks")
        .all();

    if (!queryEmbedding) {
        console.log("[DEBUG] No embedding available, using keyword search");
        return keywordSearch(query, allChunks, topK);
    }

    // 1. Semantic Search with HIGHER Score Threshold for better relevance
    const scoredChunks = allChunks.map((chunk) => {
        const chunkData = db
            .prepare("SELECT embedding FROM chunks WHERE id = ?")
            .get(chunk.id);
        if (!chunkData || !chunkData.embedding)
            return { ...chunk, score: 0 };

        const embedding = new Float32Array(chunkData.embedding.buffer);
        const score = cosineSimilarity(queryEmbedding, Array.from(embedding));
        const item = db
            .prepare("SELECT id, title, source FROM items WHERE id = ?")
            .get(chunk.item_id);
        return { ...chunk, score, source: item.title || item.source, source_item_id: item.id };
    });

    // STRICTER threshold: Only return items with similarity > 0.5 (was 0.3)
    // This prevents unrelated content from being returned
    const semanticResults = scoredChunks
        .filter((s) => s.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    console.log(`[DEBUG] Semantic search: Found ${semanticResults.length} results with score > 0.5`);
    if (semanticResults.length > 0) {
        console.log(`[DEBUG] Top score: ${semanticResults[0].score.toFixed(3)}`);
    }

    // 2. Hybrid Fallback: If semantic search found nothing good, try Keyword Search
    if (semanticResults.length === 0) {
        console.log("[DEBUG] No high-confidence semantic matches. Trying keyword search...");
        const keywordResults = keywordSearch(query, allChunks, topK);

        // Only use keyword results if they found something
        if (keywordResults.length > 0) {
            console.log(`[DEBUG] Keyword search found ${keywordResults.length} results`);
            return keywordResults;
        }

        // If both failed, try lowering semantic threshold temporarily
        const lowerThresholdResults = scoredChunks
            .filter((s) => s.score > 0.35)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        if (lowerThresholdResults.length > 0) {
            console.log(`[DEBUG] Using lower threshold (0.35): Found ${lowerThresholdResults.length} results`);
            return lowerThresholdResults;
        }
    }

    return semanticResults;
}

/**
 * Ask Gemini a question based on retrieved context.
 */
async function askQuestion(question, contextChunks) {
    const contextText = contextChunks
        .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
        .join("\n\n");

    const prompt = `
You are a helpful AI Knowledge Assistant that ONLY answers based on the provided context from the user's saved notes.

STRICT RULES:
1. ONLY use information from the context below - do not add external knowledge
2. If the answer is NOT in the context, clearly state "I don't have information about that in your saved notes"
3. Always cite sources by referencing the Source numbers (e.g., "According to Source 1...")
4. Be concise and directly answer the question
5. If the context is not relevant to the question, clearly say so

Context:
${contextText}

User Question: ${question}

Your Answer:
`.trim();

    try {
        if (MOCK_MODE) throw new Error("Mock Mode Active");

        // Add timeout wrapper (30 seconds)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini API timeout (30s)")), 30000)
        );

        const generatePromise = model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        // Race between API call and timeout
        const result = await Promise.race([generatePromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Gemini API query successful");

        return {
            answer: text,
            sources: contextChunks.map((c) => ({
                content: c.content,
                source: c.source,
                item_id: c.source_item_id || c.item_id,
            })),
        };
    } catch (error) {
        // Enhanced error logging
        console.error("❌ Gemini API Error during query:");
        console.error("   Error Message:", error.message);
        console.error("   Error Status:", error.status || error.statusCode || 'N/A');

        // Determine error type for better user feedback
        let errorType = "unavailable";
        let userMessage = "Gemini API is currently unavailable";

        if (error.message?.includes("timeout")) {
            errorType = "timeout";
            userMessage = "Gemini API request timed out";
            console.error("   Diagnosis: API timeout (may be quota exhausted or network issue)");
        } else if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            errorType = "quota";
            userMessage = "Gemini API quota exceeded";
            console.error("   Diagnosis: API quota exceeded or rate limited");
        } else if (error.message?.includes("blocked") || error.message?.includes("SAFETY")) {
            errorType = "blocked";
            userMessage = "Content was blocked by Gemini safety filters";
            console.error("   Diagnosis: Content safety filter triggered");
        } else {
            console.error("   Full Error Details:", error);
        }

        // If Gemini fails, re-run search with ONLY Keyword logic
        const allChunks = db
            .prepare("SELECT id, content, item_id FROM chunks")
            .all();
        const fallbackResults = keywordSearch(question, allChunks, 3);

        return {
            answer: `I found these specific matches for your question in your notes. (Note: ${userMessage}, so I am using precise keyword search).`,
            sources: fallbackResults.map((c) => ({
                content: c.content,
                source: c.source,
                item_id: c.item_id,
            })),
            isMock: true,
        };
    }
}

/**
 * Test Gemini API connection in real-time
 */
async function testGeminiConnection() {
    if (MOCK_MODE) {
        return {
            connected: false,
            status: 'mock_mode',
            message: 'Running in MOCK MODE (No valid API key)'
        };
    }

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection test timeout")), 10000)
        );

        const testPromise = model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Say 'OK' if you can read this" }] }]
        });

        const result = await Promise.race([testPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        return {
            connected: true,
            status: 'healthy',
            message: 'Gemini API is working correctly',
            model: MODEL_NAMES[0],
            testResponse: text
        };
    } catch (error) {
        return {
            connected: false,
            status: 'error',
            message: error.message,
            error: error.status || error.statusCode || 'Unknown error type'
        };
    }
}

module.exports = {
    chunkText,
    generateEmbedding,
    retrieveContext,
    askQuestion,
    initGemini,
    testGeminiConnection,
};
