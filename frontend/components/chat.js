'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

export default function Chat({ projectId }) {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);
    const socketRef = useRef(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!projectId || !user || !apiUrl) return;

        socketRef.current = io(apiUrl);
        const socket = socketRef.current;
        socket.emit('joinProject', projectId);

        const messageListener = (incomingMessage) => {
            // Defensive check to ensure incoming message has the required structure
            if (incomingMessage && incomingMessage.sender && incomingMessage.sender._id) {
                 setMessages((prevMessages) => [...prevMessages, incomingMessage]);
            }
        };
        socket.on('newMessage', messageListener);

        return () => {
            socket.off('newMessage', messageListener);
            socket.disconnect();
        };
    }, [projectId, user, apiUrl]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!token || !apiUrl) { setLoading(false); return; }
            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}/api/chat?projectId=${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setMessages(data.data);
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [projectId, token, apiUrl]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const socket = socketRef.current;
        if (newMessage.trim() && user && socket) {
            socket.emit('sendMessage', {
                projectId,
                content: newMessage,
                senderId: user.id,
            });
            setNewMessage('');
        }
    };

    if (loading) return <p className="text-center text-gray-500 py-4">Loading chat history...</p>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                    // --- FIX: Add a check to prevent rendering malformed messages ---
                    msg && msg.sender && msg.sender._id && (
                        <div
                            key={msg._id}
                            className={`flex items-end mb-4 ${msg.sender._id === user.id ? 'justify-end' : ''}`}
                        >
                            <div className={`flex flex-col space-y-1 text-sm max-w-xs mx-2 ${msg.sender._id === user.id ? 'order-1 items-end' : 'order-2 items-start'}`}>
                                <span className="font-semibold text-gray-700">{msg.sender._id === user.id ? 'You' : msg.sender.name}</span>
                                <span className={`px-4 py-2 rounded-lg inline-block ${msg.sender._id === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.content}
                                </span>
                            </div>
                            <div className={`h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 ${msg.sender._id === user.id ? 'order-2' : 'order-1'}`}>
                                {/* --- FIX: Use optional chaining for safety --- */}
                                {msg.sender.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        </div>
                    )
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="border-t p-4 bg-gray-50">
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                    <button
                        type="submit"
                        className="ml-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

