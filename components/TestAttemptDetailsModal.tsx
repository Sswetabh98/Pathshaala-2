import React from 'react';
import { Test, TestAttempt, User } from '../types';
import { XIcon, CheckCircleIcon, XCircleIcon, InfoCircleIcon } from './icons/IconComponents';

interface TestAttemptDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    test: Test;
    attempt: TestAttempt;
    student: User;
}

const TestAttemptDetailsModal: React.FC<TestAttemptDetailsModalProps> = ({ isOpen, onClose, test, attempt, student }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Test Results: {student.name}</h2>
                        <p className="text-sm text-slate-500">Viewing results for "{test.title}"</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>
                
                <div className="text-center p-4 border-b dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500">Final Score</p>
                    <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{attempt.score} / {attempt.totalQuestions}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                     {test.questions.map((q, idx) => {
                        const studentAnswer = attempt.answers.find(a => a.questionIndex === idx)?.answer;
                        const isCorrect = studentAnswer === q.correctAnswer;
                        const isUnattempted = studentAnswer === 'Unanswered' || studentAnswer === undefined;
                        
                        return (
                            <div key={idx} className="p-4 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold mb-2 flex-1 pr-4">{idx + 1}. {q.questionText}</p>
                                    {isCorrect ? (
                                        <span className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-300"><CheckCircleIcon className="w-5 h-5" /> Correct</span>
                                    ) : isUnattempted ? (
                                        <span className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-yellow-700 dark:text-yellow-300"><InfoCircleIcon className="w-5 h-5" /> Unattempted</span>
                                    ) : (
                                        <span className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-300"><XCircleIcon className="w-5 h-5" /> Incorrect</span>
                                    )}
                                </div>
                                
                                <div className="mt-2 space-y-2">
                                    <div className={`p-2 rounded-md border ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : isUnattempted ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                        <p className="text-xs font-medium text-slate-500">Your Answer</p>
                                        <p className={`font-medium ${isUnattempted ? 'italic text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {isUnattempted ? 'Unattempted' : studentAnswer}
                                        </p>
                                    </div>
                                    {!isCorrect && !isUnattempted && (
                                         <div className="p-2 rounded-md border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                            <p className="text-xs font-medium text-green-700 dark:text-green-300">Correct Answer</p>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{q.correctAnswer}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TestAttemptDetailsModal;