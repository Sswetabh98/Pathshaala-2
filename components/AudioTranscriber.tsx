
import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio, closeLiveSession } from '../services/geminiService';

const AudioTranscriber: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [finalizedTranscription, setFinalizedTranscription] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const activeStreamRef = useRef<MediaStream | null>(null);

    const onMessage = useCallback((text: string, isFinal: boolean) => {
        if (isFinal) {
            setFinalizedTranscription(prev => [...prev, text]);
            setTranscription('');
        } else {
            setTranscription(text);
        }
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            activeStreamRef.current = stream;
            setIsRecording(true);
            setFinalizedTranscription([]);
            setTranscription('');
            
            transcribeAudio(stream, onMessage);

        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDismissedError') {
                setError("Microphone access denied. Please grant permission in your browser settings to use the transcriber.");
            } else {
                setError("Could not access microphone. Please check your device is connected and not in use by another application.");
            }
        }
    };

    const stopRecording = () => {
        // FORCE STOP HARDWARE TRACKS
        if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(track => track.stop());
            activeStreamRef.current = null;
        }
        closeLiveSession();
        setIsRecording(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">Live Audio Transcriber</h2>
            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg text-center text-sm font-medium">
                    <p>{error}</p>
                </div>
            )}
            <p className="mb-6 text-slate-600 dark:text-slate-400">Click "Start Recording" and speak into your microphone. Your speech will be transcribed in real-time.</p>
            
            <div className="flex justify-center items-center mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-8 py-4 rounded-full font-bold text-white transition-all duration-300 flex items-center space-x-2 text-lg ${
                        isRecording 
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/50'
                    }`}
                >
                    {isRecording ? (
                        <>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span>Stop Recording</span>
                        </>
                    ) : (
                        <span>Start Recording</span>
                    )}
                </button>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Transcription:</h3>
                <div className="text-slate-800 dark:text-slate-200 space-y-2">
                    {finalizedTranscription.map((text, index) => (
                        <p key={index}>{text}</p>
                    ))}
                    {transcription && <p className="text-slate-500 dark:text-slate-400 italic">{transcription}</p>}
                    {!isRecording && finalizedTranscription.length === 0 && (
                        <p className="text-slate-500 dark:text-slate-400">Your transcription will appear here...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioTranscriber;
