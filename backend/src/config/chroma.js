import { CloudClient } from 'chromadb';
import dotenv from 'dotenv';
dotenv.config();

class ChromaService {
    constructor() {
        this.client = new CloudClient({
            tenant: process.env.CHROMA_TENANT || "cc30f8c0-3705-443e-9b08-714db351f900",
            database: process.env.CHROMA_DATABASE || "DebateAI",
            apiKey: process.env.CHROMA_API_KEY || "ck-2qk2XtgQjvT9pE5FXcnBMzKi1JrqQfSnrL2skrEqWLYR",
        });
        this.collectionName = "debate_knowledge_base_qwen3";
        this.collection = null;
        this.summariesCollectionName = "debate_summaries_qwen3";
        this.summariesCollection = null;
    }

    async initCollection() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: { "hnsw:space": "cosine" },
                embeddingFunction: { generate: () => [] }
            });

            this.summariesCollection = await this.client.getOrCreateCollection({
                name: this.summariesCollectionName,
                metadata: { "hnsw:space": "cosine" },
                embeddingFunction: { generate: () => [] }
            });

            console.log(`ChromaDB Collections ready.`);
        } catch (error) {
            console.error("Error initializing ChromaDB collection:", error.message);
            this.collection = null;
            this.summariesCollection = null;
        }
    }

    getCollection() {
        return this.collection;
    }

    getSummariesCollection() {
        return this.summariesCollection;
    }
}

export const chromaService = new ChromaService();
