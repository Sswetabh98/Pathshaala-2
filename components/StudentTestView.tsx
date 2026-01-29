
import React, { useState, useMemo, useEffect } from 'react';
import { User, Test, StudentProfile, TestAttempt } from '../types';
import TestAttemptDetailsModal from './TestAttemptDetailsModal';
import ReportCardModal from './ReportCardModal';

interface StudentTestViewProps {
    currentUser: User;
    allUsers: User[];
    tests: Test[];
    onUpdateUser: (user: User) => void;
    onStartTestSession: (attemptId: string) => void;
    onUpdateTestAttempt: (attempt: TestAttempt) => void;
}

const StudentTestView: React.FC<StudentTestViewProps> = ({ currentUser, allUsers, tests, onStartTestSession, onUpdateTestAttempt }) => {
    const myAttempts = useMemo(() => (currentUser.profile as StudentProfile).testAttempts || [], [currentUser]);
    const [viewingResult, setViewingResult] = useState<{ test: Test; attempt: TestAttempt } | null>(null);
    const [viewingReportCard, setViewingReportCard] = useState<{ test: Test; attempt: TestAttempt } | null>(null);

    const hasUnviewedPending = useMemo(() => myAttempts.some(a => a.status === 'pending' && !a.isViewedByStudent), [myAttempts]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>(hasUnviewedPending ? 'pending' : 'all');

    const unviewedPendingCount = useMemo(() => myAttempts.filter(a => a.status === 'pending' && !a.isViewedByStudent).length, [myAttempts]);

    const handleMarkAsViewed = (attemptId: string) => {
        const targetAttempt = myAttempts.find(a => a.id === attemptId);
        if (targetAttempt && !targetAttempt.isViewedByStudent) {
            onUpdateTestAttempt({ ...targetAttempt, isViewedByStudent: true });
        }
    };

    const displayAttempts = useMemo(() => {
        const sorted = [...myAttempts].sort((a,b) => {
             const aTest = tests.find(t => t.id === a.testId);
             const bTest = tests.find(t => t.id === b.testId);
             return (bTest?.createdAt || 0) - (aTest?.createdAt || 0);
        });

        switch (activeTab) {
            case 'pending': return sorted.filter(a => a.status === 'pending' || a.status === 'in-progress');
            case 'completed': return sorted.filter(a => a.status === 'completed');
            case 'all': default: return sorted;
        }
    }, [activeTab, myAttempts, tests]);

    return (
        <>
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Assessment Lab</h3>
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        {(['all', 'pending', 'completed'] as const).map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                {tab}
                                {tab === 'pending' && unviewedPendingCount > 0 && <span className="ml-1.5 bg-indigo-500 text-white px-1.5 rounded-full text-[8px]">{unviewedPendingCount}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {displayAttempts.length === 0 ? (
                        <p className="text-slate-500 text-center pt-10 font-medium italic">No evaluation records found in this category.</p>
                    ) : displayAttempts.map(attempt => {
                        const test = tests.find(t => t.id === attempt.testId);
                        if (!test) return null;
                        const teacher = allUsers.find(u => u.id === test.teacherId);
                        const isUnviewed = attempt.status === 'pending' && !attempt.isViewedByStudent;
                        
                        return (
                            <div key={attempt.id} onClick={() => handleMarkAsViewed(attempt.id)} className={`p-4 rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 border-l-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isUnviewed ? 'border-indigo-500 animate-highlight-glow' : 'border-slate-100 dark:border-slate-700'}`}>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{test.title}</p>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">Assigned by {teacher?.name || 'Tutor'}</p>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{test.questions.length} Ques</span>
                                        {test.timeLimitSeconds && <span>{test.timeLimitSeconds / 60} Mins</span>}
                                        {test.dueDate && <span>Due: {new Date(test.dueDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-3">
                                    {attempt.status === 'pending' && <button onClick={() => onStartTestSession(attempt.id)} className="btn-primary py-2 px-6 font-black uppercase tracking-widest text-[11px]">Start Test</button>}
                                    {attempt.status === 'in-progress' && <button onClick={() => onStartTestSession(attempt.id)} className="btn-primary bg-amber-500 hover:bg-amber-600 py-2 px-6 font-black uppercase tracking-widest text-[11px]">Continue</button>}
                                    {attempt.status === 'completed' && (
                                        <div className="text-right flex flex-col sm:flex-row items-center gap-4">
                                            <div className="pr-4 border-r dark:border-slate-700">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Performance</p>
                                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{attempt.score} / {attempt.totalQuestions}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setViewingResult({ test, attempt })} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest">Review</button>
                                                {attempt.reportCard && (
                                                    <button onClick={() => setViewingReportCard({ test, attempt })} className="btn-primary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest">Feedback</button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
             {viewingResult && (
                <TestAttemptDetailsModal
                    isOpen={!!viewingResult}
                    onClose={() => setViewingResult(null)}
                    test={viewingResult.test}
                    attempt={viewingResult.attempt}
                    student={currentUser}
                />
            )}
             {viewingReportCard && (
                <ReportCardModal
                    isOpen={!!viewingReportCard}
                    onClose={() => setViewingReportCard(null)}
                    mode="view"
                    test={viewingReportCard.test}
                    attempt={viewingReportCard.attempt}
                    student={currentUser}
                />
            )}
        </>
    );
};

export default StudentTestView;
