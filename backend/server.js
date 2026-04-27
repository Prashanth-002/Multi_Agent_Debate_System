import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { chromaService } from './src/config/chroma.js';
import apiRoutes from './src/routes/api.js';
import { handleDebateConnection } from './src/sockets/debateSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// WebSocket connection handling (Basic stub, real logic in Phase 4)
wss.on('connection', (ws, req) => {
    handleDebateConnection(ws);
});

const PORT = process.env.PORT || 5000;

// Initialize Databases before starting API
const startServer = async () => {
    await connectDB();
    try {
        await chromaService.initCollection();
    } catch (err) {
        console.warn("⚠️ ChromaDB failed to initialize. RAG features will be disabled, but standard debates will work.", err.message);
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
