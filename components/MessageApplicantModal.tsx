import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { summarizeForSMS } from '../services/geminiService';
import { XIcon, SpinnerIcon, CheckCircleIcon, TestIcon } from './icons/IconComponents';

interface MessageApplicantModalProps {
    user: User | null;
    onClose: () => void;
}

const MessageApplicantModal: React.FC<MessageApplicantModalProps> = ({ user, onClose }) => {
    const [view, setView] = useState<'compose' | 'confirm'>('compose');
    const [emailBody, setEmailBody] = useState('');
    const [smsSummary, setSmsSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (user) {
            setEmailBody(`Dear ${user.name},\n\nWe regret to inform you that your application to join Pathshaala was not approved at this time. This decision was made after a careful review of the information provided.\n\nIf you believe this is an error or wish to inquire further, please reply to this email.\n\nSincerely,\nThe Pathshaala Admissions Team`);
            setSmsSummary('');
            setView('compose');
            setIsSending(false);
            setIsSummarizing(false);
        }
    }, [user]);

    if (!user) return null;

    const handleGenerateSummary = async () => {
        if (!emailBody.trim()) return;
        setIsSummarizing(true);
        try {
            const summary = await summarizeForSMS(emailBody);
            setSmsSummary(summary);
        } catch (e) {
            alert(`Failed to generate summary: ${(e as Error).message}`);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSend = () => {
        setIsSending(true);
        // Simulate sending network request
        setTimeout(() => {
            setIsSending(false);
            setView('confirm');
        }, 1500);
    };

    const handleClose = () => {
        // Reset state before closing
        setTimeout(() => {
            setEmailBody('');
            setSmsSummary('');
            setView('compose');
        }, 300); // Wait for fade-out animation
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl min-h-[500px] flex flex-col animate-scaleIn">
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {view === 'compose' ? `Message Applicant: ${user.name}` : 'Message Sent'}
                    </h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>
                
                {view === 'compose' && (
                    <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                        <div>
                            <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email to: {user.email}</label>
                            <textarea id="email-body" value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={8} className="input-style mt-1 w-full" />
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">SMS to: {user.phone}</label>
                             <button onClick={handleGenerateSummary} disabled={isSummarizing || !emailBody.trim()} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 my-2 flex items-center gap-1.5 disabled:opacity-50">
                                {isSummarizing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <TestIcon className="w-4 h-4"/>}
                                {isSummarizing ? 'Generating...' : 'Generate SMS Summary with AI'}
                            </button>
                            <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-md h-20 overflow-y-auto">{smsSummary || 'AI-generated summary will appear here...'}</p>
                            <p className="text-xs text-slate-400 mt-1 text-right">{smsSummary.length} / 160 characters</p>
                        </div>
                    </div>
                )}

                {view === 'confirm' && (
                    <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                        <CheckCircleIcon className="w-20 h-20 text-green-500" />
                        <h3 className="text-2xl font-bold mt-4 text-slate-800 dark:text-white">Message Dispatched</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">The following messages have been simulated as sent to <span className="font-semibold">{user.name}</span>.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left w-full mt-6">
                            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                                <h4 className="font-semibold">Email to {user.email}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap max-h-24 overflow-y-auto">{emailBody}</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                                <h4 className="font-semibold">SMS to {user.phone}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">{smsSummary}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <footer className="p-4 flex justify-end gap-3 border-t dark:border-slate-700">
                    <button onClick={handleClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                        {view === 'compose' ? 'Cancel' : 'Done'}
                    </button>
                    {view === 'compose' && (
                        <button onClick={handleSend} disabled={isSending || !emailBody.trim()} className="btn-primary">
                            {isSending ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Send Message'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default MessageApplicantModal;
