import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useWebSocket = (sessionId) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('Idle');
    const [isReady, setIsReady] = useState(false);
    const [judgeResult, setJudgeResult] = useState(null);
    const wsRef = useRef(null);
    const { userId } = useAuth();

    // Track current streaming tokens
    const currentStreamRef = useRef('');

    useEffect(() => {
        if (!sessionId || !userId) return;

        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WS Connected');
            ws.send(JSON.stringify({ type: 'auth', sessionId, userId }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'ready':
                    setIsReady(true);
                    setStatus('Ready to Start');
                    break;
                case 'status':
                    setStatus(data.message);
                    break;
                case 'stream_start':
                    currentStreamRef.current = '';
                    setStatus(`${data.role} is typing...`);
                    // Append a placeholder message that we will update
                    setMessages(prev => [...prev, { role: data.role, content: '', isStreaming: true, agentModel: data.agentModel, sourceTag: data.sourceTag }]);
                    break;
                case 'stream_chunk':
                    currentStreamRef.current += data.content;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].isStreaming) {
                            newMsgs[newMsgs.length - 1].content = currentStreamRef.current;
                        }
                        return newMsgs;
                    });
                    break;
                case 'stream_end':
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].isStreaming) {
                            newMsgs[newMsgs.length - 1].isStreaming = false;
                        }
                        return newMsgs;
                    });
                    setStatus('Agent finished.');
                    break;
                case 'round_complete':
                    setStatus('Round Complete. Your turn to decide.');
                    break;
                case 'judge_thinking':
                    setStatus('Judge is evaluating the debate...');
                    break;
                case 'judge_result':
                    setStatus('Debate Concluded');
                    setJudgeResult({
                        winner: data.winner,
                        explanation: data.explanation,
                        summary: data.summary,
                        sources: data.sources || []
                    });
                    break;
                case 'error':
                    setStatus(`Error: ${data.message}`);
                    break;
                default:
                    break;
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [sessionId, userId]);

    const startRound = useCallback((proModel, oppModel) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'start_round',
                proModel,
                oppModel
            }));
        }
    }, []);

    const evaluateJudge = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'execute_judge'
            }));
        }
    }, []);

    // Utility to push historical messages when loading a room
    const setHistoricalMessages = useCallback((history) => {
        setMessages(history);
    }, []);

    return {
        messages,
        status,
        isReady,
        judgeResult,
        startRound,
        evaluateJudge,
        setHistoricalMessages
    };
};
