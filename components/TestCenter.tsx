
import React, { useState, useMemo, useEffect } from 'react';
import { User, Test, StudentProfile, TestAttempt, StudentTask } from '../types';
import { TestIcon, CheckCircleIcon, ClockIcon, UsersIcon, BookOpenIcon } from './icons/IconComponents';
import TestAttemptDetailsModal from './TestAttemptDetailsModal';
import TaskReviewModal from './TaskReviewModal';

interface TestCenterProps {
    currentUser: User;
    allUsers: User[];
    tests: Test[];
    onUpdateUser: (user: User) => void;
    onGradeTask: (studentId: string, taskId: string, feedback: string, grade: string) => void;
    initialTestId?: string | null;
    onClearInitialTestId?: () => void;
}

type UnifiedWorkEntry = 
    | { type: 'test'; id: string; title: string; data: Test }
    | { type: 'task'; id: string; title: string; submissions: { student: User; task: StudentTask }[] };

const TestCenter: React.FC<TestCenterProps> = ({ currentUser, allUsers, tests, onUpdateUser, onGradeTask, initialTestId, onClearInitialTestId }) => {
    const [selectedEntry, setSelectedEntry] = useState<UnifiedWorkEntry | null>(null);
    const [viewingAttempt, setViewingAttempt] = useState<{ student: User, attempt: TestAttempt } | null>(null);
    const [viewingTask, setViewingTask] = useState<{ student: User, task: StudentTask } | null>(null);

    const teacherTests = useMemo(() => {
        return tests.filter(test => test.teacherId === currentUser.id)
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [tests, currentUser.id]);

    const unifiedWorkList = useMemo((): UnifiedWorkEntry[] => {
        // 1. Convert Tests
        const testEntries: UnifiedWorkEntry[] = teacherTests.map(t => ({
            type: 'test',
            id: t.id,
            title: t.title,
            data: t
        }));

        // 2. Aggregate Manual Tasks by Name
        const taskMap = new Map<string, { student: User; task: StudentTask }[]>();
        allUsers.forEach(u => {
            if (u.role === 'student') {
                const profile = u.profile as StudentProfile;
                (profile.tasks || []).forEach(task => {
                    if (task.assignedBy === currentUser.name) {
                        if (!taskMap.has(task.text)) taskMap.set(task.text, []);
                        taskMap.get(task.text)!.push({ student: u, task });
                    }
                });
            }
        });

        const manualEntries: UnifiedWorkEntry[] = Array.from(taskMap.entries()).map(([text, submissions]) => ({
            type: 'task',
            id: `grouped-${text}`,
            title: text,
            submissions
        }));

        return [...testEntries, ...manualEntries];
    }, [teacherTests, allUsers, currentUser.name]);

    useEffect(() => {
        if (initialTestId) {
            const entry = unifiedWorkList.find(e => e.id === initialTestId);
            if (entry) {
                setSelectedEntry(entry);
            }
            if (onClearInitialTestId) onClearInitialTestId();
        }
    }, [initialTestId, unifiedWorkList, onClearInitialTestId]);

    const studentAttemptsForTest = useMemo(() => {
        if (!selectedEntry || selectedEntry.type !== 'test') return [];
        const test = selectedEntry.data;
        const attempts = [];
        for (const student of allUsers) {
            if (student.role === 'student') {
                const profile = student.profile as StudentProfile;
                const attempt = profile.testAttempts?.find(a => a.testId === test.id);
                if (attempt) {
                    attempts.push({ student, attempt });
                }
            }
        }
        return attempts.sort((a,b) => (b.attempt.submittedAt || 0) - (a.attempt.submittedAt || 0));
    }, [selectedEntry, allUsers]);

    const handleViewDetails = (student: User, attempt: TestAttempt) => {
        if (attempt.status === 'completed' && !attempt.isReviewedByTeacher) {
            const updatedAttempt = { ...attempt, isReviewedByTeacher: true };
            const studentProfile = student.profile as StudentProfile;
            const updatedAttempts = studentProfile.testAttempts?.map(a => a.id === attempt.id ? updatedAttempt : a) || [];
            onUpdateUser({ ...student, profile: { ...studentProfile, testAttempts: updatedAttempts } });
        }
        setViewingAttempt({ student, attempt });
    };

    return (
        <>
            <div className="h-full flex flex-col animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                    {/* Work List */}
                    <div className="md:col-span-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <h3 className="text-[10px] font-black uppercase tracking-widest p-4 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">Evaluation Command Center</h3>
                        <div className="flex-1 overflow-y-auto participant-list-scrollbar">
                            {unifiedWorkList.length > 0 ? (
                                unifiedWorkList.map(entry => {
                                    const isSelected = selectedEntry?.id === entry.id;
                                    let meta = '';
                                    let status = 'INACTIVE';
                                    
                                    if (entry.type === 'test') {
                                        const count = allUsers.filter(u => u.role === 'student' && (u.profile as StudentProfile).testAttempts?.some(a => a.testId === entry.id)).length;
                                        meta = `${count} Students`;
                                        status = 'STRUCTURED';
                                    } else {
                                        meta = `${entry.submissions.length} Students`;
                                        status = 'MANUAL';
                                    }

                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => setSelectedEntry(entry)}
                                            className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-700 relative transition-all ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 dark:text-slate-200 pr-4 truncate">{entry.title}</p>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${entry.type === 'test' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{status}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{meta}</span>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-10 text-center text-slate-400">
                                    <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No work found in vault</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="md:col-span-2 flex flex-col">
                        {selectedEntry ? (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold tracking-tight truncate">{selectedEntry.title}</h3>
                                    <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">Submissions Pool</span>
                                </div>
                                <div className="flex-1 overflow-y-auto participant-list-scrollbar">
                                    <table className="min-w-full divide-y divide-slate-50 dark:divide-slate-700">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Result</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                            {selectedEntry.type === 'test' ? (
                                                studentAttemptsForTest.map(({ student, attempt }) => (
                                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <img className="h-8 w-8 rounded-full" src={student.profilePicUrl || `https://i.pravatar.cc/150?u=${student.id}`} alt="" />
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase rounded ${attempt.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                {attempt.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="text-sm font-black text-indigo-600">
                                                                {attempt.score !== null ? `${attempt.score}/${attempt.totalQuestions}` : '---'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                            {attempt.status === 'completed' && (
                                                                <button onClick={() => handleViewDetails(student, attempt)} className="text-[10px] font-black uppercase text-indigo-500 hover:underline">REVIEW</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                selectedEntry.submissions.map(({ student, task }) => (
                                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <img className="h-8 w-8 rounded-full" src={student.profilePicUrl || `https://i.pravatar.cc/150?u=${student.id}`} alt="" />
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase rounded ${task.completed ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                {task.completed ? 'SUBMITTED' : 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="text-sm font-black text-indigo-600">
                                                                {task.grade ? `${task.grade}/${task.totalMarks}` : '---'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                            {task.completed && (
                                                                <button onClick={() => setViewingTask({ student, task })} className="text-[10px] font-black uppercase text-indigo-500 hover:underline">
                                                                    {task.grade ? 'VIEW' : 'GRADE'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-100 dark:border-slate-700">
                                <TestIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Evaluation Vault</h3>
                                <p className="mt-2 text-sm text-slate-500 max-w-xs">Select work from the vault to monitor submissions and verify student performance data.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {viewingAttempt && selectedEntry?.type === 'test' && (
                <TestAttemptDetailsModal isOpen={!!viewingAttempt} onClose={() => setViewingAttempt(null)} test={selectedEntry.data} attempt={viewingAttempt.attempt} student={viewingAttempt.student} />
            )}

            {viewingTask && (
                <TaskReviewModal 
                    isOpen={!!viewingTask} 
                    onClose={() => setViewingTask(null)} 
                    task={viewingTask.task} 
                    onSaveReview={onGradeTask} 
                    studentId={viewingTask.student.id} 
                />
            )}
        </>
    );
};

export default TestCenter;
