
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { User, StudentProfile, StudentTask, UploadedFile, Test, TestAttempt, ReportCard } from '../types';
import { PaperclipIcon, ClockIcon, BookOpenIcon, SpinnerIcon, XIcon, LockClosedIcon, CheckCircleIcon, DashboardIcon, TestIcon, ShieldCheckIcon } from './icons/IconComponents';
import StudentTestView from './StudentTestView';
import ReportCardModal from './ReportCardModal';

type StudentSuiteTab = 'work' | 'assessments' | 'reports';

interface TasksProps {
    user: User;
    onUpdateUser: (user: User) => void;
    allUsers: User[];
    tests: Test[];
    onStartTestSession: (attemptId: string) => void;
    onUpdateTestAttempt: (attempt: TestAttempt) => void;
    onMarkReportAsViewed: (studentId: string, reportId: string) => void;
    initialSubView?: string | null;
}

const TaskItem: React.FC<{
  task: StudentTask; user: User; onToggleTask: (taskId: string) => void;
  onUpdateTask: (updatedTask: StudentTask) => void;
}> = ({ task, user, onToggleTask, onUpdateTask }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isGraded = !!task.grade;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || task.completed) return;
        setIsUploading(true);
        try {
            const newFiles = await Promise.all(Array.from(files).map((f: File) => new Promise<UploadedFile>((res) => {
                const r = new FileReader();
                r.onload = (ev) => res({ 
                    name: f.name, type: f.type, size: f.size, 
                    dataUrl: ev.target?.result as string, accessibleTo: [user.id] 
                });
                r.readAsDataURL(f);
            })));
            onUpdateTask({ ...task, studentSubmissions: [...(task.studentSubmissions || []), ...newFiles] });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`p-4 rounded-xl border transition-all ${task.completed ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/50 shadow-sm'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <p className={`text-base font-bold ${task.completed ? 'text-slate-500' : 'text-slate-800 dark:text-white'}`}>{task.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Max: {task.totalMarks}</span>
                        {task.dueDate && <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    {task.completed ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-[11px] font-black uppercase tracking-wider">
                            <LockClosedIcon className="w-3.5 h-3.5" /> Locked
                        </div>
                    ) : (
                        <button 
                            onClick={() => onToggleTask(task.id)}
                            className="btn-primary py-1.5 px-4 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                        >
                            Submit Work
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {(task.teacherAttachments || []).length > 0 && (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tutor Materials</p>
                        <div className="flex wrap gap-2">
                            {task.teacherAttachments?.map(f => (
                                <a key={f.name} href={f.dataUrl} download={f.name} className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm hover:underline">
                                    <PaperclipIcon className="w-3 h-3"/> {f.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {((task.studentSubmissions || []).length > 0 || !task.completed) && (
                    <div className={`p-2.5 rounded-lg border ${task.completed ? 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200' : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100'}`}>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Your Work</p>
                        <div className="flex wrap gap-2">
                            {task.studentSubmissions?.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm">
                                    <a href={f.dataUrl} download={f.name} className="font-bold truncate max-w-[120px] hover:underline">{f.name}</a>
                                    {!task.completed && (
                                        <button onClick={() => onUpdateTask({ ...task, studentSubmissions: task.studentSubmissions?.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700">
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!task.completed && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-white dark:bg-slate-700 px-2 py-1 rounded border-2 border-dashed border-indigo-200 dark:border-indigo-800"
                                >
                                    {isUploading ? <SpinnerIcon className="w-3 h-3 animate-spin"/> : <PaperclipIcon className="w-3 h-3"/>}
                                    {isUploading ? 'UPLOADING...' : 'ADD DOCUMENTS'}
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                        </div>
                    </div>
                )}

                {isGraded && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3"/> Tutor Review
                            </p>
                            <span className="text-sm font-black text-green-700">{task.grade} / {task.totalMarks}</span>
                        </div>
                        <p className="text-xs text-green-800 dark:text-green-300 italic">"{task.teacherFeedback}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Tasks: React.FC<TasksProps> = (props) => {
    const { user, onUpdateUser, allUsers, tests, onStartTestSession, onUpdateTestAttempt, onMarkReportAsViewed, initialSubView } = props;
    const profile = user.profile as StudentProfile;
    const tasks = profile.tasks || [];
    const reports = [...(profile.reportCards || [])].sort((a, b) => (b.issuedAt || b.createdAt) - (a.issuedAt || a.createdAt));

    const [activeTab, setActiveTab] = useState<StudentSuiteTab>('work');
    const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [viewingReport, setViewingReport] = useState<ReportCard | null>(null);

    useEffect(() => {
        if (initialSubView === 'assessments') setActiveTab('assessments');
        else if (initialSubView === 'reports') setActiveTab('reports');
    }, [initialSubView]);

    const filteredTasks = useMemo(() => {
        if (taskFilter === 'pending') return tasks.filter(t => !t.completed);
        if (taskFilter === 'completed') return tasks.filter(t => t.completed);
        return tasks;
    }, [tasks, taskFilter]);

    const unviewedPendingCount = useMemo(() => (profile.testAttempts || []).filter(a => a.status === 'pending' && !a.isViewedByStudent).length, [profile.testAttempts]);
    const unviewedReportCount = useMemo(() => (profile.reportCards || []).filter(r => !r.isViewedByStudent).length, [profile.reportCards]);

    const handleViewReport = (report: ReportCard) => {
        setViewingReport(report);
        if (!report.isViewedByStudent) {
            onMarkReportAsViewed(user.id, report.id);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 backdrop-blur-md px-6 -mx-8 -mt-8 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Suite Tabs">
                    <button 
                        onClick={() => setActiveTab('work')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'work' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <DashboardIcon className="w-4 h-4" /> Work Desk
                    </button>
                    <button 
                        onClick={() => setActiveTab('assessments')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === 'assessments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <TestIcon className="w-4 h-4" /> Assessment Lab
                        {unviewedPendingCount > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')} 
                        className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === 'reports' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldCheckIcon className="w-4 h-4" /> Progress Hub
                        {unviewedReportCount > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    </button>
                </nav>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-10">
                {activeTab === 'work' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Current Assignments</h3>
                            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                                {['all', 'pending', 'completed'].map(f => (
                                    <button key={f} onClick={() => setTaskFilter(f as any)} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${taskFilter === f ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-500'}`}>{f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 pr-2">
                            {filteredTasks.length > 0 ? filteredTasks.map(t => (
                                <TaskItem 
                                    key={t.id} 
                                    task={t} 
                                    user={user} 
                                    onToggleTask={id => onUpdateUser({...user, profile: {...profile, tasks: tasks.map(x => x.id === id ? {...x, completed: true} : x)}})} 
                                    onUpdateTask={u => onUpdateUser({...user, profile: {...profile, tasks: tasks.map(x => x.id === u.id ? u : x)}})} 
                                />
                            )) : (
                                <div className="text-center py-20 text-slate-500">
                                    <BookOpenIcon className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                    <p className="text-sm font-medium">Clear for take-off! No assignments here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'assessments' && (
                    <div className="animate-fadeIn">
                        <StudentTestView 
                            currentUser={user} 
                            allUsers={allUsers} 
                            tests={tests} 
                            onUpdateUser={onUpdateUser} 
                            onStartTestSession={onStartTestSession} 
                            onUpdateTestAttempt={onUpdateTestAttempt} 
                        />
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-4 animate-fadeIn">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Academic Record</h3>
                        {reports.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <ShieldCheckIcon className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">No reports issued yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reports.map(report => (
                                    <div key={report.id} onClick={() => handleViewReport(report)} className={`p-5 rounded-2xl shadow-sm bg-white dark:bg-slate-800 border-2 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between group ${!report.isViewedByStudent ? 'border-indigo-500 animate-highlight-glow' : 'border-slate-100 dark:border-slate-700'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <BookOpenIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-slate-200 text-base leading-tight">Quarterly Performance</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Issued by {report.teacherName}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-end justify-between">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                <ClockIcon className="w-3 h-3 inline mr-1" />
                                                {new Date(report.issuedAt || report.createdAt).toLocaleDateString()}
                                            </div>
                                            <button className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest group-hover:underline">View Full Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {viewingReport && (
                <ReportCardModal
                    isOpen={!!viewingReport}
                    onClose={() => setViewingReport(null)}
                    mode="view"
                    reportCard={viewingReport}
                    student={user}
                />
            )}
        </div>
    );
};

export default Tasks;
