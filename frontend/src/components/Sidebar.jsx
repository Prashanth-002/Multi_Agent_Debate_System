import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function Sidebar({ currentSessionId, onSelectSession }) {
    const { userId } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error("Failed to load sessions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setSessionToDelete(id);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;
        setIsModalOpen(false);
        const id = sessionToDelete;

        try {
            console.log(`Sending DELETE request to: ${import.meta.env.VITE_API_URL}/api/session/${id}`);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/session/${id}`, { method: 'DELETE' });
            console.log("Delete Response Status:", res.status);

            if (res.ok) {
                console.log("Deletion successful. Updating UI state.");
                setSessions(prev => prev.filter(s => s._id !== id));
                if (currentSessionId === id) onSelectSession(null);
            } else {
                console.error("Failed to delete, status:", res.status);
            }
        } catch (err) {
            console.error("Failed to delete session (Network Error):", err);
        } finally {
            setSessionToDelete(null);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchSessions();
        }
    }, [userId]);

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={() => onSelectSession(null)}
                    className="w-full bg-[#023c28] hover:bg-[#035439] text-white py-2 px-4 rounded-md font-medium transition shadow-sm"
                >
                    + New Debate
                </button>
            </div>
            <div className="flex-1 py-2 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-500 text-sm p-4">Loading past debates...</p>
                ) : sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm p-4">No past debates found.</p>
                ) : (
                    <ul className="space-y-1">
                        {sessions.map(s => (
                            <li key={s._id}>
                                <div
                                    onClick={() => onSelectSession(s._id)}
                                    className={`w-full cursor-pointer text-left px-4 py-3 text-sm flex flex-col border-l-4 transition-colors ${currentSessionId === s._id
                                        ? 'border-[#c5f015] bg-[#023c28]/5 text-[#023c28] font-bold'
                                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="truncate flex-1 font-semibold pr-2">{s.topic}</span>
                                        <button
                                            onClick={(e) => handleDelete(e, s._id)}
                                            className="text-gray-400 hover:text-red-500 transition px-1"
                                            title="Delete debate"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-500 truncate mt-1">
                                        {new Date(s.createdAt).toLocaleDateString()} &middot; {s.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Custom confirmation modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-100 overflow-hidden text-left">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you sure you wanna delete this?</h3>
                            <p className="text-sm text-gray-400">This action is permanent and cannot be undone.</p>

                            <div className="flex justify-end gap-6 mt-8 items-center">
                                <button
                                    className="text-gray-500 font-medium hover:text-gray-700 transition"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSessionToDelete(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-6 py-2 bg-[#d13a1a] hover:bg-[#b02c12] text-white font-medium rounded-lg transition"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
