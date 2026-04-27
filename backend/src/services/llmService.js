import { ragService } from './ragService.js';
import Session from '../models/Session.js';

import { ProAgentPrompt } from '../agents/ProAgent.js';
import { OpponentAgentPrompt } from '../agents/OpponentAgent.js';
import { JudgeAgentPrompt } from '../agents/JudgeAgent.js';
import { ResearcherAgentPrompt } from '../agents/ResearcherAgent.js';

const PROMPTS = {
    pro: ProAgentPrompt,
    opponent: OpponentAgentPrompt,
    judge: JudgeAgentPrompt,
    researcher: ResearcherAgentPrompt,
    summarizer: (messagesStr) => `You are a professional debate stenographer. Your job is to concisely summarize the following segment of an ongoing debate between a Pro and Opponent agent. Capture the core arguments, rebuttals, and facts presented, without taking sides.
   
Here is the raw transcript:
${messagesStr}

Write a dense, objective summary of the main points covered in this segment. Do NOT invent new information.`
};

// Core class for talking to Ollama streaming endpoint
export class DebateService {
    constructor(socket) {
        this.ws = socket;
        this.baseUrl = process.env.OLLAMA_SERVER_URL || 'http://localhost:11434';
    }

    // Generalized inference method returning a stream over WebSockets
    async streamAgentResponse(model, prompt, role, sourceTag) {
        try {
            // Notify UI we are starting stream
            this.ws.send(JSON.stringify({ type: 'stream_start', role, agentModel: model, sourceTag }));

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: true
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Ollama streaming chunk format: {"model":"...","created_at":"...","response":" text","done":false}
                // There could be multiple JSON blocks per chunk if they arrive fast
                const lines = chunk.split('\n').filter(l => l.trim() !== '');

                for (const line of lines) {
                    const parsed = JSON.parse(line);
                    fullText += parsed.response;

                    // Stream to frontend
                    this.ws.send(JSON.stringify({
                        type: 'stream_chunk',
                        role,
                        content: parsed.response
                    }));
                }
            }

            this.ws.send(JSON.stringify({ type: 'stream_end', role }));
            return fullText;

        } catch (error) {
            console.error("LLM Error:", error);
            this.ws.send(JSON.stringify({ type: 'error', message: 'Agent failed to respond.' }));
            return '';
        }
    }

    async summarizeMessages(messagesStr) {
        try {
            const prompt = PROMPTS.summarizer(messagesStr);
            console.log("Generating rolling summary secretly in background...");

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.1', // Fast base model for summarization
                    prompt,
                    stream: false
                })
            });

            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            console.error("Summarizer Error:", error);
            return '';
        }
    }

    // Method specifically to get structured JSON from the Judge
    async executeJudge(transcript, topic, context) {
        try {
            this.ws.send(JSON.stringify({ type: 'judge_thinking' }));

            const prompt = PROMPTS.judge(topic, transcript, context);

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'phi3', // Updated per user request
                    prompt,
                    stream: false,
                    format: 'json' // OLLAMA feature
                })
            });

            const data = await response.json();
            return JSON.parse(data.response); // Parse the forced JSON output

        } catch (error) {
            console.error("Judge Error:", error);
            return { winner: 'Error', explanation: 'Failed to process verdict.', summary: 'Error' };
        }
    }

    async retrieveContext(topic, userId, sessionId) {
        const contextLines = await ragService.queryContext(topic, userId, sessionId, 3);
        return contextLines.join('\n\n');
    }
}

export { PROMPTS };
