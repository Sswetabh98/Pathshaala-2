import React, { useState, useEffect } from 'react';
import { Test, TestAttempt, StudentAnswer } from '../types';
import { ClockIcon, CheckIcon } from './icons/IconComponents';

interface TestTakerPageProps {
    test: Test;
    attempt: TestAttempt;
    onSubmitTest: (attemptId: string, finalAnswers: StudentAnswer[]) => void;
    onUpdateTestAttempt: (updatedAttempt: TestAttempt) => void;
}

const TestTakerPage: React.FC<TestTakerPageProps> = ({ test, attempt, onSubmitTest, onUpdateTestAttempt }) => {
    const [answers, setAnswers] = useState<StudentAnswer[]>(attempt.answers || []);
    const [timeLeft, setTimeLeft] = useState(test.timeLimitSeconds || test.questions.length * 30);
    const [savedAnswers, setSavedAnswers] = useState<Set<number>>(new Set());

    const handleSubmit = () => {
        // Ensure an answer exists for every question, even if it's "Unanswered"
        const finalAnswers = test.questions.map((_, index) => {
            return answers.find(a => a.questionIndex === index) || { questionIndex: index, answer: "Unanswered" };
        });
        onSubmitTest(attempt.id, finalAnswers);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when timer hits 0
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        const newAnswers = [...answers.filter(a => a.questionIndex !== questionIndex)];
        newAnswers.push({ questionIndex, answer });
        setAnswers(newAnswers);
        // Clear saved status on change
        setSavedAnswers(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionIndex);
            return newSet;
        });
    };

    const handleSaveAnswer = (questionIndex: number) => {
        const updatedAttempt = { ...attempt, answers: answers };
        onUpdateTestAttempt(updatedAttempt);
        setSavedAnswers(prev => new Set(prev).add(questionIndex));
    };

    const getStudentAnswer = (questionIndex: number) => {
        return answers.find(a => a.questionIndex === questionIndex)?.answer || '';
    };

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col z-50">
            <header className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{test.title}</h2>
                    <div className={`flex items-center gap-2 font-bold text-lg p-2 rounded-lg ${timeLeft <= 10 ? 'text-red-500 bg-red-100 dark:bg-red-900/50 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}>
                        <ClockIcon className="w-6 h-6" />
                        <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-4xl mx-auto">
                    {test.questions.map((q, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6">
                            <p className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">{index + 1}. {q.questionText}</p>
                            {q.questionType === 'multiple-choice' && q.options && (
                                <div className="space-y-3">
                                    {q.options.map(option => (
                                        <label key={option} className="flex items-center p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400 dark:has-[:checked]:bg-indigo-900/30">
                                            <input type="radio" name={`q-${index}`} value={option} checked={getStudentAnswer(index) === option} onChange={() => handleAnswerChange(index, option)} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"/>
                                            <span className="ml-4 text-slate-700 dark:text-slate-300">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {q.questionType === 'true-false' && (
                                 <div className="flex gap-4">
                                    <label className="flex-1 flex items-center p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400 dark:has-[:checked]:bg-indigo-900/30"><input type="radio" name={`q-${index}`} value="True" checked={getStudentAnswer(index) === "True"} onChange={() => handleAnswerChange(index, "True")} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"/><span className="ml-4 text-slate-700 dark:text-slate-300">True</span></label>
                                    <label className="flex-1 flex items-center p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400 dark:has-[:checked]:bg-indigo-900/30"><input type="radio" name={`q-${index}`} value="False" checked={getStudentAnswer(index) === "False"} onChange={() => handleAnswerChange(index, "False")} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"/><span className="ml-4 text-slate-700 dark:text-slate-300">False</span></label>
                                </div>
                            )}
                             {q.questionType === 'short-answer' && (
                                <input type="text" value={getStudentAnswer(index)} onChange={(e) => handleAnswerChange(index, e.target.value)} className="input-style w-full mt-2" placeholder="Your answer..."/>
                            )}
                            <div className="text-right mt-4">
                                <button
                                    onClick={() => handleSaveAnswer(index)}
                                    disabled={!getStudentAnswer(index)}
                                    className={`btn-secondary py-1 px-3 text-sm ${savedAnswers.has(index) ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                                >
                                    {savedAnswers.has(index) ? <><CheckIcon className="w-4 h-4 mr-1"/> Saved</> : 'Save Answer'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <footer className="p-4 border-t dark:border-slate-700 text-right bg-white dark:bg-slate-800 shadow-top">
                <div className="max-w-4xl mx-auto">
                    <button onClick={handleSubmit} className="btn-primary">Submit Test</button>
                </div>
            </footer>
             <style>{`.shadow-top { box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1); }`}</style>
        </div>
    );
};

export default TestTakerPage;