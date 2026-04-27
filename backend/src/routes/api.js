import express from 'express';
import multer from 'multer';
import { ragService } from '../services/ragService.js';
import Session from '../models/Session.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

router.post('/upload', (req, res, next) => {
    upload.single('document')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File is too large. Maximum size is 2MB.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: 'Server error during file upload.' });
        }
        next();
    });
}, async (req, res) => {
    try {
        // In a real app with Clerk properly configured on backend, 
        // userId would come from req.auth.userId provided by Clerk Middleware.
        // For now we assume the frontend passes it in the body.
        const { userId, topic } = req.body;

        if (!req.file || !userId || !topic) {
            return res.status(400).json({ error: 'Missing file, userId, or topic' });
        }

        // 1. Create a new Session in MongoDB
        const session = new Session({
            userId,
            topic,
            ragEnabled: true,
            status: 'active'
        });
        await session.save();

        // 2. Process the PDF and add to ChromaDB
        try {
            await ragService.processDocument(req.file.buffer, userId, session._id.toString());
        } catch (ragError) {
            // RAG Processing failed (e.g. Rate Limits, Invalid PDF). 
            // Cleanup the orphaned MongoDB session so it doesn't appear in the Sidebar
            await Session.findByIdAndDelete(session._id);
            throw ragError; // Push the error to the main catch block to alert the frontend
        }

        res.status(200).json({
            success: true,
            sessionId: session._id,
            message: 'Document processed successfully and session created.'
        });

    } catch (error) {
        console.error("Upload error FULL TRACE:");
        console.error(error.stack);

        // Pass the explicit Google Rate Limit error to the User UI so they aren't confused
        if (error.message && error.message.includes('Google API Rate Limit')) {
            return res.status(429).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Server error during document processing - check logs for details.' });
    }
});

// Create session without RAG
router.post('/session', async (req, res) => {
    try {
        const { userId, topic } = req.body;
        if (!userId || !topic) return res.status(400).json({ error: 'Missing userId or topic' });

        const session = new Session({
            userId,
            topic,
            ragEnabled: false,
            status: 'active'
        });
        await session.save();

        res.status(200).json({ success: true, sessionId: session._id });
    } catch (error) {
        console.error("Session creation error:", error);
        res.status(500).json({ error: 'Error creating session' });
    }
});

// Fetch user history
router.get('/sessions/:userId', async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching history' });
    }
});

// Delete a session
router.delete('/session/:sessionId', async (req, res) => {
    try {
        const deleted = await Session.findByIdAndDelete(req.params.sessionId);
        if (!deleted) return res.status(404).json({ error: 'Session not found' });

        // Also ideally delete from ChromaDB if RAG enabled to save space, but keeping it simple
        res.status(200).json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ error: 'Error deleting session' });
    }
});

export default router;
