import { DebateService, PROMPTS } from '../services/llmService.js';
import Session from '../models/Session.js';
import { ragService } from '../services/ragService.js';

export const handleDebateConnection = (ws) => {
    const debateService = new DebateService(ws);
    let activeSessionId = null;
    let userId = null;

    console.log("WebSocket Client Connected");

    ws.on('message', async (messageData) => {
        try {
            const data = JSON.parse(messageData);

            if (data.type === 'auth') {
                // Simple auth for WS
                activeSessionId = data.sessionId;
                userId = data.userId;
                ws.send(JSON.stringify({ type: 'ready', message: 'Ready to debate' }));
                return;
            }

            if (!activeSessionId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated for a session.' }));
                return;
            }

            const session = await Session.findById(activeSessionId);
            if (!session) return;

            if (data.type === 'start_round') {
                const { proModel = 'llama3.1', oppModel = 'llama3.1' } = data;

                // Clean up any existing error messages before starting (for backwards compatibility/recovery)
                let cleaned = false;
                while (session.messages.length > 0 && session.messages[session.messages.length - 1].content.includes("encountered an error")) {
                    session.messages.pop();
                    cleaned = true;
                }
                if (cleaned) {
                    await session.save();
                }

                ws.send(JSON.stringify({ type: 'status', message: 'Retrieving Context...' }));

                let context = '';
                if (session.ragEnabled) {
                    context = await debateService.retrieveContext(session.topic, userId, session._id.toString());
                }

                // If this is the very first turn, the Researcher Agent goes first
                if (session.messages.length === 0) {
                    ws.send(JSON.stringify({ type: 'status', message: 'Researcher Agent is gathering facts...' }));
                    const researcherModel = 'llama3.1'; // User requested llama3.1 for researcher
                    const researcherPrompt = PROMPTS.researcher(session.topic, context);
                    const researcherSourceTag = session.ragEnabled ? 'Knowledge Base' : 'General Knowledge';
                    let researcherPayload = await streamAgentWithWait(debateService, researcherModel, researcherPrompt, 'system', researcherSourceTag);
                    if (!researcherPayload || researcherPayload.trim() === '' || researcherPayload.includes("encountered an error")) {
                        ws.send(JSON.stringify({ type: 'error', message: "Researcher Agent encountered an error. Please click 'Start Next Round' to retry." }));
                        return;
                    }

                    session.messages.push({ role: 'system', content: researcherPayload, agentModel: researcherModel, sourceTag: researcherSourceTag });
                    await session.save();
                }

                // Build hybrid history string for agents
                const summaries = await ragService.getSummaries(userId, session._id.toString());
                const recentMessages = session.messages.slice(session.lastSummarizedMessageIndex);

                let historyStr = '';
                const isDB = summaries.length > 0;

                if (isDB) {
                    historyStr += "--- PREVIOUS DEBATE SUMMARIES (Read these for context on past rounds) ---\n";
                    historyStr += summaries.map((s, i) => `[Summary Block ${i + 1}]:\n${s}`).join('\n\n') + "\n\n";
                    historyStr += "--- RECENT UN-SUMMARIZED DEBATE TRANSCRIPT (Reply to the latest point here) ---\n";
                }
                historyStr += recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

                // Check who needs to run
                const lastRole = session.messages.length > 0 ? session.messages[session.messages.length - 1].role : null;
                const runPro = lastRole !== 'pro';

                // ==== PRO AGENT TURN ====
                if (runPro) {
                    ws.send(JSON.stringify({ type: 'status', message: 'Pro Agent is thinking...' }));
                    let proSourceTag = isDB ? "DB" : (session.messages.length === 1 ? "Researcher" : `Round ${Math.ceil((session.messages.length - 1) / 2)} - Opponent`);
                    const proPrompt = PROMPTS.pro(session.topic, context, historyStr);
                    let proPayload = await streamAgentWithWait(debateService, proModel, proPrompt, 'pro', proSourceTag);

                    if (!proPayload || proPayload.trim() === '' || proPayload.includes("encountered an error")) {
                        ws.send(JSON.stringify({ type: 'error', message: "Pro Agent encountered an error. Please click 'Start Next Round' to retry." }));
                        return; // Abort early so we don't save bad data or run opponent
                    }

                    // Save Pro message
                    session.messages.push({ role: 'pro', content: proPayload, agentModel: proModel, sourceTag: proSourceTag });
                    await session.save();

                    // Re-calculate recent messages + history string so Opponent sees Pro's new argument
                    const updatedRecentMessages = session.messages.slice(session.lastSummarizedMessageIndex);
                    historyStr = '';
                    if (isDB) {
                        historyStr += "--- PREVIOUS DEBATE SUMMARIES (Read these for context on past rounds) ---\n";
                        historyStr += summaries.map((s, i) => `[Summary Block ${i + 1}]:\n${s}`).join('\n\n') + "\n\n";
                        historyStr += "--- RECENT UN-SUMMARIZED DEBATE TRANSCRIPT (Reply to the latest point here) ---\n";
                    }
                    historyStr += updatedRecentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
                }

                // ==== OPPONENT AGENT TURN ====
                ws.send(JSON.stringify({ type: 'status', message: 'Opponent Agent is rebutting...' }));
                let oppSourceTag = isDB ? "DB" : `Round ${Math.ceil(session.messages.length / 2)} - Pro`;
                const oppPrompt = PROMPTS.opponent(session.topic, context, historyStr);
                let oppPayload = await streamAgentWithWait(debateService, oppModel, oppPrompt, 'opponent', oppSourceTag);

                if (!oppPayload || oppPayload.trim() === '' || oppPayload.includes("encountered an error")) {
                    ws.send(JSON.stringify({ type: 'error', message: "Opponent Agent encountered an error. Please click 'Start Next Round' to retry." }));
                    return; // Abort round early!
                }

                // Save Opponent message
                session.messages.push({ role: 'opponent', content: oppPayload, agentModel: oppModel, sourceTag: oppSourceTag });

                // PHASE 8: ROLLING SUMMARIZATION
                // Check if we have enough unsummarized messages (3 rounds)
                const unsummarizedCount = session.messages.length - session.lastSummarizedMessageIndex;
                let summarizeCount = 0;

                // If this is the very first summary, the Researcher (index 0) is included, so we need 7 messages (Res + Pro1 + Opp1 + Pro2 + Opp2 + Pro3 + Opp3)
                if (session.lastSummarizedMessageIndex === 0 && unsummarizedCount >= 7) {
                    summarizeCount = 7;
                } else if (session.lastSummarizedMessageIndex > 0 && unsummarizedCount >= 6) {
                    // Subsequent summaries just take the 6 purely debate messages (3 full rounds)
                    summarizeCount = 6;
                }

                if (summarizeCount > 0) {
                    ws.send(JSON.stringify({ type: 'status', message: 'Generating rolling memory...' }));

                    const messagesToSummarize = session.messages.slice(session.lastSummarizedMessageIndex, session.lastSummarizedMessageIndex + summarizeCount);
                    const historyToSummarize = messagesToSummarize.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

                    const summaryText = await debateService.summarizeMessages(historyToSummarize);
                    if (summaryText) {
                        const summaryIndex = session.lastSummarizedMessageIndex === 0 ? 0 : Math.ceil(session.lastSummarizedMessageIndex / 6);
                        await ragService.storeSummary(summaryText, userId, session._id.toString(), summaryIndex);
                        session.lastSummarizedMessageIndex += summarizeCount;
                    }
                }

                await session.save();

                ws.send(JSON.stringify({ type: 'round_complete' }));
            }

            if (data.type === 'execute_judge') {
                ws.send(JSON.stringify({ type: 'status', message: 'Judge is evaluating...' }));

                let context = '';
                if (session.ragEnabled) {
                    context = await debateService.retrieveContext(session.topic, userId, session._id.toString());
                }

                // Phase 8: HYBRID CONTEXT (Summaries + Recent Raw Messages)
                const summaries = await ragService.getSummaries(userId, session._id.toString());
                const recentMessages = session.messages.slice(session.lastSummarizedMessageIndex);

                let historyStr = '';
                if (summaries.length > 0) {
                    historyStr += "--- PREVIOUS DEBATE SUMMARIES (Read these for context on past rounds) ---\n";
                    historyStr += summaries.map((s, i) => `[Summary Block ${i + 1}]:\n${s}`).join('\n\n') + "\n\n";
                    historyStr += "--- RECENT UN-SUMMARIZED DEBATE TRANSCRIPT ---\n";
                }
                historyStr += recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

                const verdict = await debateService.executeJudge(historyStr, session.topic, context);

                // Append verdict to DB
                session.judgeResult = verdict;
                session.status = 'completed';
                await session.save();

                ws.send(JSON.stringify({ type: 'judge_result', ...verdict }));
            }

        } catch (err) {
            console.error("WS Error:", err);
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
    });

    ws.on('close', () => {
        console.log('WS Client Disconnected');
    });
};

// Helper to wrap the streaming function in a promise that resolves with the full text
function streamAgentWithWait(service, model, prompt, role, sourceTag) {
    return new Promise(async (resolve, reject) => {
        try {
            const fullText = await service.streamAgentResponse(model, prompt, role, sourceTag);
            resolve(fullText);
        } catch (err) {
            reject(err);
        }
    });
}
