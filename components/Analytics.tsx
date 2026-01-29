
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Test, StudentProfile, Connection, ReportCard, ClassChatMessage, TeacherProfile } from '../types';
import ReportCardModal from './ReportCardModal';
import ScoreTrendChart from './ScoreTrendChart';
import { TestIcon, CheckCircleIcon, BookOpenIcon, XIcon, ChatBubbleIcon, TrashIcon, EditIcon, ShareIcon } from './icons/IconComponents';

interface AnalyticsProps {
    currentUser: User;
    allUsers: User[];
    tests: Test[];
    connections: Connection[];
    onSaveDraftReportCard: (reportCardData: Omit<ReportCard, 'id' | 'status'>) => void;
    onUpdateDraftReportCard: (updatedDraft: ReportCard) => void;
    onDeleteDraftReportCard: (draftReportId: string) => void;
    onIssueReportCard: (draftReportId: string) => void;
}

const ChatHistoryModal: React.FC<{ chatHistory: ClassChatMessage[], onClose: () => void }> = ({ chatHistory, onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg animate-scaleIn max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Chat History</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                {chatHistory.map((msg, i) => (
                    <div key={i} className="text-sm mb-2">
                        <p>
                            <span className="text-xs text-slate-500 mr-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            <strong className="text-slate-700 dark:text-slate-300">{msg.user}: </strong>
                            <span className="text-slate-600 dark:text-slate-400">{msg.text}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const StatCard: React.FC<{ label: string, value: string | number, icon: React.FC<any> }> = ({ label, value, icon: Icon }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 uppercase">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
    </div>
);

const CustomStudentSelector: React.FC<{
    students: User[];
    selectedId: string;
    onSelect: (id: string) => void;
}> = ({ students, selectedId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedStudent = students.find(s => s.id === selectedId);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="input-style w-full text-left flex justify-between items-center">
                {selectedStudent ? (
                    <div className="flex items-center gap-2">
                        <img src={selectedStudent.profilePicUrl} alt={selectedStudent.name} className="w-6 h-6 rounded-full" />
                        <span>{selectedStudent.name}</span>
                    </div>
                ) : (
                    <span className="text-slate-500">Choose a student</span>
                )}
                <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {students.map(student => (
                        <button
                            key={student.id}
                            onClick={() => { onSelect(student.id); setIsOpen(false); }}
                            className="w-full text-left p-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        >
                            <img src={student.profilePicUrl} alt={student.name} className="w-6 h-6 rounded-full" />
                            <span>{student.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


const Analytics: React.FC<AnalyticsProps> = ({ currentUser, allUsers, tests, connections, onSaveDraftReportCard, onUpdateDraftReportCard, onDeleteDraftReportCard, onIssueReportCard }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [modalState, setModalState] = useState<{ mode: 'create' | 'edit' | 'view'; report?: ReportCard } | null>(null);
    const [reportPeriod, setReportPeriod] = useState<string>('30');
    const [viewingChat, setViewingChat] = useState<ClassChatMessage[] | null>(null);
    
    const connectedStudents = useMemo(() => {
        const studentIds = new Set(
            connections
                .filter(c => c.teacherId === currentUser.id && c.status === 'active')
                .map(c => c.studentId)
        );
        return allUsers.filter(u => u.role === 'student' && studentIds.has(u.id));
    }, [connections, allUsers, currentUser.id]);

    // HANDSHAKE FIX: Explicitly pull latest student from allUsers
    const selectedStudent = useMemo(() => {
        return allUsers.find(u => u.id === selectedStudentId);
    }, [allUsers, selectedStudentId]);

    const connection = useMemo(() => {
        if (!selectedStudent) return null;
        return connections.find(c => c.studentId === selectedStudent.id && c.teacherId === currentUser.id);
    }, [connections, selectedStudent, currentUser]);

    const studentStats = useMemo(() => {
        if (!selectedStudent) return null;
        
        const profile = selectedStudent.profile as StudentProfile;
        const attempts = (profile.testAttempts || []).sort((a,b) => (a.submittedAt || 0) - (b.submittedAt || 0));
        const tasks = profile.tasks || [];

        const completedTests = attempts.filter(a => a.status === 'completed' && a.score !== null);
        const totalScore = completedTests.reduce((acc, a) => acc + a.score!, 0);
        const totalPossibleScore = completedTests.reduce((acc, a) => acc + a.totalQuestions, 0);
        const avgTestScore = totalPossibleScore > 0 ? `${((totalScore / totalPossibleScore) * 100).toFixed(1)}%` : 'N/A';

        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const taskCompletionRate = totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(0)}%` : 'N/A';
        
        const scoreTrendData = completedTests.map(a => {
            const test = tests.find(t => t.id === a.testId);
            return {
                label: test?.title || 'Test',
                value: (a.score! / a.totalQuestions) * 100,
            };
        });

        return {
            avgTestScore,
            completedTests: completedTests.length,
            taskCompletionRate,
            completedTasks,
            totalTasks,
            scoreTrendData,
        };
    }, [selectedStudent, tests]);

    const studentReports = useMemo(() => {
        if (!selectedStudent) return [];
        const draftReports = (currentUser.profile as TeacherProfile).draftReportCards?.filter(r => r.studentId === selectedStudent.id) || [];
        const issuedReports = (selectedStudent.profile as StudentProfile).reportCards || [];
        
        return [...draftReports, ...issuedReports].sort((a, b) => {
            const dateA = a.issuedAt || a.createdAt;
            const dateB = b.issuedAt || b.createdAt;
            return dateB - dateA;
        });
    }, [selectedStudent, currentUser.profile]);


    const reportCardCreationData = useMemo(() => {
        if (!selectedStudent) return null;

        const profile = selectedStudent.profile as StudentProfile;
        const now = Date.now();
        const days = parseInt(reportPeriod);
        const startDate = now - days * 24 * 60 * 60 * 1000;
        
        const relevantAttempts = (profile.testAttempts || []).filter(a => a.status === 'completed' && a.submittedAt && a.submittedAt >= startDate);
        const relevantTasks = (profile.tasks || []).filter(t => t.dueDate ? (t.dueDate >= startDate && t.dueDate <= now) : false);

        return {
            teacherId: currentUser.id,
            teacherName: currentUser.name,
            studentId: selectedStudent.id,
            startDate: startDate,
            endDate: now,
            createdAt: now,
            testResults: relevantAttempts.map(a => {
                const test = tests.find(t => t.id === a.testId);
                return { testTitle: test?.title || 'Unknown Test', score: a.score!, totalQuestions: a.totalQuestions };
            }),
            taskDetails: relevantTasks.map(t => ({
                text: t.text,
                status: t.teacherFeedback ? 'Graded' : t.completed ? 'Completed' : 'Pending',
                grade: t.grade,
            })),
        };
    }, [selectedStudent, reportPeriod, currentUser, tests]);

    const handleSaveReport = (report: Omit<ReportCard, 'id'>) => {
        if (modalState?.mode === 'create') {
            onSaveDraftReportCard(report as Omit<ReportCard, 'id' | 'status'>);
        } else if (modalState?.mode === 'edit') {
            onUpdateDraftReportCard(report as ReportCard);
        }
        setModalState(null);
    };

    return (
        <>
            <div className="h-full flex flex-col">
                <div className="flex-shrink-0 mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Student Analytics & Reports</h2>
                    <div className="mt-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
                        <label htmlFor="student-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Viewing Data For:</label>
                        <CustomStudentSelector students={connectedStudents} selectedId={selectedStudentId} onSelect={setSelectedStudentId} />
                    </div>
                </div>

                {selectedStudent && studentStats ? (
                    <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Avg. Test Score" value={studentStats.avgTestScore} icon={TestIcon} />
                            <StatCard label="Tests Completed" value={studentStats.completedTests} icon={CheckCircleIcon} />
                            <StatCard label="Task Completion" value={studentStats.taskCompletionRate} icon={BookOpenIcon} />
                            <StatCard label="Tasks Done" value={`${studentStats.completedTasks}/${studentStats.totalTasks}`} icon={CheckCircleIcon} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                            <ScoreTrendChart scores={studentStats.scoreTrendData} />
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-semibold mb-4">Report Cards</h3>
                             <div className="flex items-center gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div>
                                    <label htmlFor="report-period" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Report Period</label>
                                    <select id="report-period" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="input-style select-style mt-1 w-full">
                                        <option value="7">Last 7 Days</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                </div>
                                <button onClick={() => setModalState({ mode: 'create' })} className="btn-primary mt-5">
                                    Generate New Report
                                </button>
                            </div>
                            <div className="space-y-2">
                                {studentReports.map(report => (
                                    <div key={report.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm truncate">Report for {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
                                                {report.status === 'draft' && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 uppercase flex-shrink-0">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {report.status === 'issued' ? `Issued on: ${new Date(report.issuedAt!).toLocaleString()}` : `Last saved: ${new Date(report.createdAt).toLocaleString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {report.status === 'draft' ? (
                                                <>
                                                    <button onClick={() => setModalState({ mode: 'edit', report })} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full" title="Edit"><EditIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                                                    <button onClick={() => onIssueReportCard(report.id)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full" title="Issue"><ShareIcon className="w-4 h-4 text-green-600"/></button>
                                                    <button onClick={() => onDeleteDraftReportCard(report.id)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full" title="Delete"><TrashIcon className="w-4 h-4 text-red-600"/></button>
                                                </>
                                            ) : (
                                                <button onClick={() => setModalState({ mode: 'view', report })} className="btn-secondary text-xs py-1 px-2">View</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {connection?.classHistory && connection.classHistory.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Class History</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {connection.classHistory.map(session => (
                                        <div key={session.sessionId} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-sm">Class on {new Date(session.startedAt).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500">Duration: {session.durationMinutes} minutes</p>
                                            </div>
                                            {session.chatHistory && session.chatHistory.length > 0 && (
                                                <button onClick={() => setViewingChat(session.chatHistory!)} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                                                    <ChatBubbleIcon className="w-4 h-4" /> View Chat
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 pt-10 flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-800/50 rounded-lg">
                        <p className="text-lg">Select a student to view their performance analytics.</p>
                    </div>
                )}
            </div>
            {/* FIX: Refactored ReportCardModal call to satisfy strict union type constraints by splitting based on mode */}
            {modalState && selectedStudent && (
                 modalState.mode === 'create' ? (
                     <ReportCardModal
                        isOpen={!!modalState}
                        onClose={() => setModalState(null)}
                        mode="create"
                        student={selectedStudent}
                        reportData={reportCardCreationData as any}
                        onSave={handleSaveReport as any}
                    />
                 ) : modalState.mode === 'edit' ? (
                    <ReportCardModal
                        isOpen={!!modalState}
                        onClose={() => setModalState(null)}
                        mode="edit"
                        student={selectedStudent}
                        reportCard={modalState.report as ReportCard}
                        onSave={handleSaveReport as any}
                    />
                 ) : (
                    <ReportCardModal
                        isOpen={!!modalState}
                        onClose={() => setModalState(null)}
                        mode="view"
                        student={selectedStudent}
                        reportCard={modalState.report as ReportCard}
                    />
                 )
            )}
             {viewingChat && <ChatHistoryModal chatHistory={viewingChat} onClose={() => setViewingChat(null)} />}
        </>
    );
};

export default Analytics;
