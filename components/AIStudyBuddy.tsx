
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Import ChatMessage type.
import { ChatMessage } from '../types';
import { getChatbotResponse, createStudyBuddyChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import LoadingDots from './LoadingDots';
import MarkdownRenderer from './MarkdownRenderer';

const AIStudyBuddy: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "Hello! I'm your AI Study Buddy. What subject are we tackling today? Ask me a question to get started." }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        chatRef.current = createStudyBuddyChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await getChatbotResponse(chatRef.current, input);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Study Buddy error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: (error as Error).message }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">AI Study Buddy</h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold">A</div>
                        )}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                            <MarkdownRenderer text={msg.parts[0].text} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold">A</div>
                        <div className="max-w-lg px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-700">
                           <LoadingDots className="p-0" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder="Ask a question or describe a problem..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="ml-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default AIStudyBuddy;
