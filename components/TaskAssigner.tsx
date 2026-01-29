
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Connection, StudentProfile, StudentTask, UploadedFile, Test, ReportCard } from '../types';
import { TaskAssignIcon, UsersIcon, PaperclipIcon, XIcon, SpinnerIcon, CheckCircleIcon, BookOpenIcon, InfoCircleIcon, ArchiveIcon, EyeIcon, TestIcon, DashboardIcon, ImageFileIcon } from './icons/IconComponents';
import TaskReviewModal from './TaskReviewModal';
import TestCenter from './TestCenter';
import Analytics from './Analytics';

type TaskSuiteTab = 'creator' | 'assessments' | 'performance';

interface TaskAssignerProps {
    teacher: User;
    allUsers: User[];
    connections: Connection[];
    onAssignTask: (studentId: string, taskDetails: Omit<StudentTask, 'id' | 'completed' | 'assignedBy' | 'comments'>) => void;
    onGradeTask: (studentId: string, taskId: string, feedback: string, grade: string) => void;
    onUpdateUser: (user: User) => void;
    tests: Test[];
    onSaveDraftReportCard: (reportCardData: Omit<ReportCard, 'id' | 'status'>) => void;
    onUpdateDraftReportCard: (updatedDraft: ReportCard) => void;
    onDeleteDraftReportCard: (draftReportId: string) => void;
    onIssueReportCard: (draftReportId: string) => void;
    initialTestId?: string | null;
    onClearInitialTestId?: () => void;
}

const FileCard: React.FC<{ file: UploadedFile; onRemove?: () => void }> = ({ file, onRemove }) => {
    const isImage = file.type.startsWith('image/');
    return (
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm min-w-[140px] max-w-[180px] animate-scaleIn">
            <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {isImage ? (
                    <img src={file.dataUrl} className="w-full h-full object-cover" alt="preview" />
                ) : (
                    <PaperclipIcon className="w-4 h-4 text-indigo-500" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-[8px] text-slate-400 uppercase">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            {onRemove && (
                <button onClick={onRemove} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 rounded transition-colors">
                    <XIcon className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

const SubmissionPreview: React.FC<{ submissions: UploadedFile[] }> = ({ submissions }) => (
    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Submissions</p>
        <div className="flex flex-wrap gap-2">
            {submissions.map((f, i) => (
                <FileCard key={i} file={f} />
            ))}
        </div>
    </div>
);

const TaskAssigner: React.FC<TaskAssignerProps> = (props) => {
    const { teacher, allUsers, connections, onAssignTask, onGradeTask, onUpdateUser, tests, onSaveDraftReportCard, onUpdateDraftReportCard, onDeleteDraftReportCard, onIssueReportCard, initialTestId, onClearInitialTestId } = props;
    
    const [activeTab, setActiveTab] = useState<TaskSuiteTab>('creator');
    
    // States for Task Creator
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [taskText, setTaskText] = useState<string>('');
    const [totalMarks, setTotalMarks] = useState<string>('100');
    const [dueDate, setDueDate] = useState<string>('');
    const [dueTime, setDueTime] = useState<string>('23:59');
    const [reviewingTask, setReviewingTask] = useState<StudentTask | null>(null);
    const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialTestId) {
            setActiveTab('assessments');
        }
    }, [initialTestId]);

    const connectedStudents = useMemo(() => {
        const studentIds = new Set(
            connections
                .filter(c => c.teacherId === teacher.id && c.status === 'active')
                .map(c => c.studentId)
        );
        return allUsers.filter(u => u.role === 'student' && studentIds.has(u.id));
    }, [connections, allUsers, teacher.id]);

    // HANDSHAKE FIX: Ensure we use the latest student object from allUsers array
    const selectedStudent = useMemo(() => allUsers.find(u => u.id === selectedStudentId), [allUsers, selectedStudentId]);

    const assignedTasks = useMemo(() => {
        if (!selectedStudent) return [];
        return [...((selectedStudent.profile as StudentProfile).tasks || [])]
            .filter(t => t.assignedBy === teacher.name)
            .sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));
    }, [selectedStudent, teacher.name]);

    const hasUnreviewedTests = useMemo(() => {
        const myTestIds = new Set(tests.filter(t => t.teacherId === teacher.id).map(t => t.id));
        return allUsers.some(u => {
            if (u.role === 'student') {
                return (u.profile as StudentProfile).testAttempts?.some(attempt => 
                    attempt.status === 'completed' &&
                    !attempt.isReviewedByTeacher &&
                    myTestIds.has(attempt.testId)
                );
            }
            return false;
        });
    }, [allUsers, tests, teacher.id]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            const newFiles = await Promise.all(Array.from(files).map((f: File) => new Promise<UploadedFile>((res) => {
                const r = new FileReader();
                r.onload = (ev) => res({ 
                    name: f.name, type: f.type, size: f.size, 
                    dataUrl: ev.target?.result as string, accessibleTo: [teacher.id] 
                });
                r.readAsDataURL(f);
            })));
            setAttachedFiles(prev => [...prev, ...newFiles]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !taskText.trim()) return;
        const dueTimestamp = dueDate ? new Date(`${dueDate}T${dueTime || '00:00'}`).getTime() : undefined;
        onAssignTask(selectedStudentId, {
            text: taskText.trim(), dueDate: dueTimestamp, totalMarks: parseInt(totalMarks) || 100,
            teacherAttachments: attachedFiles, studentSubmissions: [], isViewedByStudent: false
        });
        setTaskText(''); setDueDate(''); setDueTime('23:59'); setAttachedFiles([]); setTotalMarks('100');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 backdrop-blur-md px-6">
                <nav className="-mb-px flex space-x-8" aria-label="Suite Tabs">
                    <button 
                        onClick={() => setActiveTab('creator')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'creator' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <DashboardIcon className="w-4 h-4" /> Work Desk
                    </button>
                    <button 
                        onClick={() => setActiveTab('assessments')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === 'assessments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <TestIcon className="w-4 h-4" /> Test Center
                        {hasUnreviewedTests && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('performance')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'performance' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UsersIcon className="w-4 h-4" /> Performance
                    </button>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                {activeTab === 'creator' && (
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
                        <form onSubmit={handleSubmit} className="lg:col-span-4 space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 self-start">
                            <h3 className="text-xl font-bold border-b pb-3 border-slate-100 dark:border-slate-700">Assign New Task</h3>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Student</label>
                                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required className="input-style py-2.5 text-sm">
                                    <option value="">-- Choose Student --</option>
                                    {connectedStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                                <textarea value={taskText} onChange={e => setTaskText(e.target.value)} required rows={2} className="input-style py-2.5 text-sm" placeholder="What needs to be done?" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Marks</label><input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} className="input-style py-1.5 text-xs" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-style py-1.5 text-xs" /></div>
                                <div><label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Due Time</label><input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input-style py-1.5 text-xs" /></div>
                            </div>
                            
                            {/* Improved Attachment Preview Cards */}
                            {attachedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments Preview</p>
                                    <div className="flex flex-wrap gap-2">
                                        {attachedFiles.map((f, i) => (
                                            <FileCard key={i} file={f} onRemove={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                                {isUploading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <PaperclipIcon className="w-4 h-4" />}
                                <span className="text-[11px] font-bold uppercase tracking-wider">Attach Materials</span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                            <button type="submit" className="w-full btn-primary py-3 rounded-xl font-black uppercase tracking-widest text-[13px] shadow-xl shadow-indigo-500/10">Assign Task</button>
                        </form>

                        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-slate-800 dark:text-slate-200">
                                <ArchiveIcon className="w-5 h-5 text-indigo-500" />
                                Task History: <span className="text-indigo-600">{selectedStudent?.name || '---'}</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 participant-list-scrollbar">
                                {!selectedStudentId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                        <UsersIcon className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm font-bold uppercase">Select a student to view history</p>
                                    </div>
                                ) : assignedTasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                        <InfoCircleIcon className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm font-bold uppercase">No tasks assigned yet</p>
                                    </div>
                                ) : (
                                    assignedTasks.map(task => {
                                        const hasSubmissions = (task.studentSubmissions || []).length > 0;
                                        const isExpanded = expandedReviewId === task.id;
                                        return (
                                            <div key={task.id} className={`bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl shadow-sm border-l-4 transition-all ${task.grade ? 'border-indigo-500' : task.completed ? 'border-green-500' : 'border-amber-400'}`}>
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{task.text}</p>
                                                        <div className="flex gap-4 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span>
                                                            <span>{task.totalMarks} Marks</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${task.grade ? 'bg-indigo-600 text-white' : task.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {task.grade ? 'GRADED' : task.completed ? 'SUBMITTED' : 'PENDING'}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {hasSubmissions && !task.grade && (
                                                                <button onClick={() => setExpandedReviewId(isExpanded ? null : task.id)} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="Review Submissions">
                                                                    <EyeIcon className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {task.completed && !task.grade && (
                                                                <button onClick={() => setReviewingTask(task)} className="btn-primary py-1 px-3 text-[10px] font-black rounded-lg">GRADE</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isExpanded && hasSubmissions && <SubmissionPreview submissions={task.studentSubmissions || []} />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assessments' && (
                    <TestCenter 
                        currentUser={teacher} 
                        allUsers={allUsers} 
                        tests={tests} 
                        onUpdateUser={onUpdateUser} 
                        onGradeTask={onGradeTask}
                        initialTestId={initialTestId}
                        onClearInitialTestId={onClearInitialTestId}
                    />
                )}

                {activeTab === 'performance' && (
                    <Analytics 
                        currentUser={teacher} 
                        allUsers={allUsers} 
                        tests={tests} 
                        connections={connections} 
                        onSaveDraftReportCard={onSaveDraftReportCard} 
                        onUpdateDraftReportCard={onUpdateDraftReportCard} 
                        onDeleteDraftReportCard={onDeleteDraftReportCard} 
                        onIssueReportCard={onIssueReportCard} 
                    />
                )}
            </div>

            {reviewingTask && selectedStudentId && (
                <TaskReviewModal isOpen={!!reviewingTask} onClose={() => setReviewingTask(null)} task={reviewingTask} onSaveReview={onGradeTask} studentId={selectedStudentId} />
            )}
        </div>
    );
};

export default TaskAssigner;
