import React, { useState, useCallback } from 'react';
import { getGroundedResponse } from '../services/geminiService';
import { GroundingChunk } from '@google/genai';
import SkeletonLoader from './SkeletonLoader';

const ResearchAssistant: React.FC = () => {
    const [query, setQuery] = useState('Who won the Nobel Prize in Physics in the most recent year?');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const response = await getGroundedResponse(query);
            setResult(response);
        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">AI Research Assistant</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Powered by Google Search for up-to-date and factual answers.</p>
            
            <div className="flex items-center space-x-2 mb-4">
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question about recent events or facts..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 overflow-y-auto">
                {isLoading && <SkeletonLoader lines={5} />}
                {!isLoading && error && <p className="text-red-500">{error}</p>}
                {!isLoading && result && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Answer:</h3>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{result.text}</p>
                        
                        {result.sources && result.sources.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold text-md mb-2 text-slate-800 dark:text-white">Sources:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="text-sm">
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                {source.web?.title || source.web?.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {!isLoading && !result && !error && (
                    <p className="text-slate-500 text-center pt-10">Ask a question to get a grounded response from Google Search.</p>
                )}
            </div>
        </div>
    );
};

export default ResearchAssistant;