import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function DebateRoom({ sessionId }) {
    const { userId } = useAuth();
    const [sessionData, setSessionData] = useState(null);

    const {
        messages,
        status,
        isReady,
        judgeResult,
        startRound,
        evaluateJudge,
        setHistoricalMessages
    } = useWebSocket(sessionId);

    const messagesEndRef = useRef(null);

    // Auto-scroll Down
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, judgeResult]);

    // Load Session details on mount
    useEffect(() => {
        if (!sessionId) return;

        fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${userId}`)
            .then(res => res.json())
            .then(data => {
                const current = data.find(s => s._id === sessionId);
                if (current) {
                    setSessionData(current);
                    if (current.messages && current.messages.length > 0) {
                        setHistoricalMessages(current.messages);
                    }
                }
            })
            .catch(err => console.error("Error fetching session:", err));
    }, [sessionId, userId, setHistoricalMessages]);

    if (!sessionId) return <div className="p-8 text-center text-gray-500">Select a session or create a new one.</div>;
    if (!sessionData) return <div className="p-8 text-center text-gray-500">Loading Session...</div>;

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{sessionData.topic}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${sessionData.ragEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            RAG: {sessionData.ragEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className="text-sm text-gray-500">{status}</span>
                    </div>
                </div>

                {/* Controls */}
                {sessionData.status === 'active' && !judgeResult && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => startRound('llama3.1', 'deepseek-r1:7b')}
                            disabled={!isReady || status.includes('typing') || status.includes('Generating') || status.includes('evaluating')}
                            className="px-4 py-2 bg-[#023c28] hover:bg-[#035439] text-white rounded-md text-sm font-medium disabled:opacity-50 transition shadow-sm"
                        >
                            Start Next Round
                        </button>
                        <button
                            onClick={() => evaluateJudge()}
                            disabled={!isReady || status.includes('typing') || messages.length === 0 || status.includes('evaluating')}
                            className="px-4 py-2 bg-[#c5f015] hover:bg-[#aade13] text-[#023c28] rounded-md text-sm font-bold disabled:opacity-50 transition shadow-sm"
                        >
                            Call the Judge
                        </button>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {messages.map((msg, idx) => {
                    const isSystem = msg.role === 'system';
                    const isPro = msg.role === 'pro';

                    return (
                        <div key={idx} className={`flex flex-col ${isSystem ? 'items-center' : isPro ? 'items-start' : 'items-end'}`}>
                            <div className={`flex flex-col mb-1 ${isSystem ? 'items-center' : isPro ? 'items-start' : 'items-end'}`}>
                                <span className={`text-xs uppercase font-bold ${isSystem ? 'text-emerald-600' : isPro ? 'text-[#023c28]' : 'text-[#d13a1a]'}`}>
                                    {!isSystem && `Round ${Math.ceil(idx / 2)} - `}
                                    {isSystem ? 'Researcher Agent' : `${msg.role} Agent`}
                                </span>
                                {/* Dynamically display the model used if available */}
                                <div className="flex gap-2">
                                    {msg.agentModel && (
                                        <span className="text-[10px] text-gray-400 capitalize bg-gray-100 rounded px-1.5 py-0.5 mt-0.5">
                                            Model: {msg.agentModel}
                                        </span>
                                    )}
                                    {msg.sourceTag && (
                                        <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 mt-0.5">
                                            Source: {msg.sourceTag}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`max-w-[85%] rounded-xl px-5 py-4 shadow-sm ${isSystem
                                ? 'bg-emerald-50 border border-emerald-200 text-gray-800 w-full'
                                : isPro
                                    ? 'bg-white border-l-4 border-[#023c28] text-gray-800'
                                    : 'bg-white border-r-4 border-[#d13a1a] text-gray-800'
                                }`}>
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>}
                            </div>
                        </div>
                    );
                })}

                {/* Judge Verdict Box */}
                {(sessionData.judgeResult || judgeResult) && (
                    <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200 shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-600 font-bold text-lg uppercase tracking-wider">Judge Verdict</span>
                        </div>

                        {(() => {
                            const res = judgeResult || sessionData.judgeResult;
                            return (
                                <div className="space-y-4 text-gray-800">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase">Winner</h4>
                                        <p className="text-xl font-semibold text-yellow-700">{res.winner}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase">Explanation</h4>
                                        <p className="leading-relaxed">{res.explanation}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase">Summary</h4>
                                        <p className="italic text-gray-600">{res.summary}</p>
                                    </div>
                                    {res.sources && res.sources.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-500 uppercase">Sources Used</h4>
                                            <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                                                {res.sources.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Extra spacer to ensure the judge box and last message are fully visible when scrolling down */}
                <div className="h-12 w-full shrink-0" />
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
