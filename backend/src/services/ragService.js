import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Session from '../models/Session.js';
import { chromaService } from '../config/chroma.js';

// Function to chunk text into optimal sizes for LLM context (approx 300 words)
function chunkText(text, chunkSize = 1500, overlap = 300) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

// Function to call Google Gemini API for fast batch embeddings
async function getBatchEmbeddings(texts) {
    try {
        const apiKey = "Use Your Key"; // User provided API key

        // Construct the bulk payload
        const payload = {
            requests: texts.map(text => ({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text: text }] }
            }))
        };

        // Google Gemini Bulk API Endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Google API Error:", data);
            if (response.status === 429) {
                throw new Error("Google API Rate Limit Exceeded: You have reached the free tier quota limits for Gemini embeddings. Please wait a minute or check your Google AI Studio billing.");
            }
            throw new Error(`Google returned status ${response.status}: ${data.error?.message || 'Unknown error'}`);
        }
        if (!data.embeddings || !Array.isArray(data.embeddings)) {
            throw new Error("Google did not return bulk embeddings array.");
        }

        // Extract just the inner floating point arrays
        return data.embeddings.map(e => e.values);
    } catch (error) {
        console.error("Error generating batch embeddings from Google Gemini:", error.message);
        throw error;
    }
}

// Function to call local Ollama model for summaries (qwen3-embedding:4b)
async function getLocalEmbedding(text) {
    try {
        const ollamaHost = process.env.OLLAMA_SERVER_URL || 'http://localhost:11434';
        const response = await fetch(`${ollamaHost}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen3-embedding:4b',
                prompt: text
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate qwen3 embedding');
        return data.embedding;
    } catch (error) {
        console.error("Local Ollama Embedding Error:", error.message);
        throw error;
    }
}

export const ragService = {
    processDocument: async (fileBuffer, userId, sessionId) => {
        try {
            // 1. Extract Text from PDF securely using pdf-parse
            const pdfData = await pdfParse(fileBuffer);
            const text = pdfData.text.replace(/\s+/g, ' ').trim();

            if (!text || text.length === 0) {
                throw new Error("Could not extract any readable text from the PDF.");
            }

            console.log("Extracted text length:", text.length);

            // 2. Save directly to the Session document for fast local retrieval redundancy
            await Session.findByIdAndUpdate(sessionId, {
                documentText: text
            });

            // 3. Chunk the text
            const chunks = chunkText(text);
            console.log("Total chunks created:", chunks.length);

            // 4. Generate embeddings & store in ChromaDB
            const collection = chromaService.getCollection();
            if (!collection) throw new Error("ChromaDB Collection not initialized");

            // Local Qwen3 is not batched natively in Ollama API, so we embed sequentially.
            // If processing time is an issue, this can be mapped with Promise.all with a concurrency limit.
            const allEmbeddings = [];
            for (const chunk of chunks) {
                const emb = await getLocalEmbedding(chunk);
                allEmbeddings.push(emb);
            }

            // Create parallel arrays for ChromaDB
            const metadatas = chunks.map((_, idx) => ({ userId, sessionId, chunkIndex: idx }));
            const ids = chunks.map((_, idx) => `${sessionId}-chunk-${idx}`);

            await collection.add({
                ids: ids,
                embeddings: allEmbeddings,
                metadatas: metadatas,
                documents: chunks
            });

            console.log(`Successfully stored ${chunks.length} chunks in ChromaDB for Session: ${sessionId}`);
            return { success: true, chunksProcessed: chunks.length };

        } catch (error) {
            console.error("Error processing document for RAG:", error.message);
            // Re-throw so the API handles the specific error string
            throw error;
        }
    },

    queryContext: async (topic, userId, sessionId, nResults = 3) => {
        try {
            // Priority 1: Query ChromaDB for targeted context
            const collection = chromaService.getCollection();
            if (collection) {
                const queryEmbedding = await getLocalEmbedding(topic);
                const results = await collection.query({
                    queryEmbeddings: [queryEmbedding],
                    nResults,
                    where: { "$and": [{ userId }, { sessionId }] }
                });

                if (results.documents && results.documents[0] && results.documents[0].length > 0) {
                    return results.documents[0]; // Return the closest text chunks
                }
            }

            // Priority 2: Fallback to the raw stored text if Chroma fails or returns empty
            const session = await Session.findOne({ _id: sessionId, userId });
            if (!session || !session.documentText) return [];

            const text = session.documentText;
            const contextLimit = 8000;
            if (text.length > contextLimit) {
                return [text.substring(0, contextLimit) + "... (Document truncated)"];
            }
            return [text];

        } catch (error) {
            console.error("Error retrieving context from Chroma/MongoDB:", error);
            // Fallback to purely MongoDB text
            try {
                const session = await Session.findOne({ _id: sessionId, userId });
                if (session && session.documentText) return [session.documentText.substring(0, 8000)];
            } catch (e) { }
            return [];
        }
    },

    storeSummary: async (summaryText, userId, sessionId, summaryIndex) => {
        try {
            const collection = chromaService.getSummariesCollection();
            if (!collection) throw new Error("Summaries Collection not initialized");

            const embedding = await getLocalEmbedding(summaryText);
            const chunkId = `${sessionId}-summary-${summaryIndex}`;

            await collection.add({
                ids: [chunkId],
                embeddings: [embedding],
                metadatas: [{ userId, sessionId, summaryIndex, type: 'summary' }],
                documents: [summaryText]
            });
            console.log(`Successfully stored summary ${summaryIndex} in ChromaDB using qwen3-embedding:4b.`);
            return true;
        } catch (error) {
            console.error("Error storing summary:", error.message);
            return false;
        }
    },

    getSummaries: async (userId, sessionId) => {
        try {
            const collection = chromaService.getSummariesCollection();
            if (!collection) return [];

            const results = await collection.get({
                where: { "$and": [{ userId }, { sessionId }, { type: "summary" }] }
            });

            if (!results.documents || results.documents.length === 0) return [];

            const summaries = results.documents.map((doc, i) => ({
                text: doc,
                index: results.metadatas[i].summaryIndex
            })).sort((a, b) => a.index - b.index);

            return summaries.map(s => s.text);
        } catch (error) {
            console.error("Error retrieving summaries:", error.message);
            return [];
        }
    }
};
