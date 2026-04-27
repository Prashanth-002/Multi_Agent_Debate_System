import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'system', 'pro', 'opponent', 'judge'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    agentModel: {
        type: String, // e.g., 'llama3', 'mistral'
        required: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const sessionSchema = new mongoose.Schema({
    userId: {
        type: String, // Clerk User ID
        required: true,
        index: true,
    },
    topic: {
        type: String,
        required: true,
    },
    ragEnabled: {
        type: Boolean,
        default: false,
    },
    documentText: {
        type: String, // Store parsed PDF text directly
        required: false,
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
    },
    lastSummarizedMessageIndex: {
        type: Number,
        default: 0
    },
    messages: [messageSchema],
    judgeResult: {
        winner: String,
        explanation: String,
        summary: String,
        sources: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

sessionSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
