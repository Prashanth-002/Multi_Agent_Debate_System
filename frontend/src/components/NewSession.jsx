import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function NewSession({ onSessionCreated }) {
    const { userId } = useAuth();
    const [topic, setTopic] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return setError('Topic is required');

        setLoading(true);
        setError('');

        try {
            let endpoint = '/api/session';
            let options = {};

            if (file) {
                endpoint = '/api/upload';
                const formData = new FormData();
                formData.append('document', file);
                formData.append('userId', userId);
                formData.append('topic', topic);

                options = { method: 'POST', body: formData };
            } else {
                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, topic })
                };
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, options);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to start session');

            onSessionCreated(data.sessionId);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-[#023c28] p-6 text-center border-b-4 border-[#c5f015]">
                    <h2 className="text-2xl font-extrabold text-[rgb(154,222,98)] mb-1">Host a New Debate</h2>
                    <p className="text-white/80 text-sm">Define a topic and optionally upload context to enable strict RAG constraints.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Debate Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Is AI going to replace Software Engineers?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#91d353] focus:border-[#023c28] outline-none transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Knowledge Base (Optional RAG)</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                    </svg>
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload PDF</span> or drag and drop</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const selected = e.target.files[0];
                                        if (selected && selected.size > 2 * 1024 * 1024) {
                                            setError('File is too large. Please select a PDF smaller than 2.0 MB.');
                                            setFile(null);
                                            e.target.value = null;
                                        } else {
                                            setFile(selected);
                                            setError('');
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        {file && <p className="text-sm text-[#023c28] mt-2 truncate font-medium">Attached: {file.name}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#023c28] hover:bg-[#035439] text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-md transform hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            'Initialize Agents'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
