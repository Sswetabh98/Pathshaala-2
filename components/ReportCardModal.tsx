
import React, { useState, useEffect, useMemo } from 'react';
import { Test, TestAttempt, User, ReportCard } from '../types';
import { XIcon, SpinnerIcon, PathshaalaLogoIcon, BookOpenIcon, CheckCircleIcon } from './icons/IconComponents';

type ReportCardModalProps =
  | {
      isOpen: boolean;
      onClose: () => void;
      mode: 'view';
      reportCard: ReportCard;
      student: User;
      onSave?: never;
      reportData?: never;
      test?: never;
      attempt?: never;
    }
  // FIX: Added a new union branch to support viewing a report generated from a specific test attempt
  | {
      isOpen: boolean;
      onClose: () => void;
      mode: 'view';
      test: Test;
      attempt: TestAttempt;
      student: User;
      onSave?: never;
      reportData?: never;
      reportCard?: never;
    }
  | {
      isOpen: boolean;
      onClose: () => void;
      mode: 'create';
      student: User;
      reportData: Omit<ReportCard, 'id' | 'summary' | 'comments' | 'isViewedByStudent' | 'isViewedByParent' | 'status'>;
      onSave: (reportCard: Omit<ReportCard, 'id' | 'status'>) => void;
      reportCard?: never;
      test?: never;
      attempt?: never;
    }
  | {
      isOpen: boolean;
      onClose: () => void;
      mode: 'edit';
      student: User;
      reportCard: ReportCard;
      onSave: (reportCard: ReportCard) => void;
      reportData?: never;
      test?: never;
      attempt?: never;
    };


const ReportCardModal: React.FC<ReportCardModalProps> = (props) => {
    const { isOpen, onClose, mode } = props;
    const [comments, setComments] = useState('');
    const [summary, setSummary] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const student = props.student;

    // FIX: Derived report card data from union props based on current mode
    const reportCardData = useMemo(() => {
        if (props.mode === 'create') return props.reportData;
        if (props.mode === 'edit') return props.reportCard;
        if (props.mode === 'view') {
            if (props.reportCard) return props.reportCard;
            // Transforming test attempt feedback into a temporary ReportCard object for viewing
            return {
                teacherName: 'Tutor',
                startDate: props.test.createdAt,
                endDate: props.attempt.submittedAt || Date.now(),
                testResults: [{
                    testTitle: props.test.title,
                    score: props.attempt.score || 0,
                    totalQuestions: props.attempt.totalQuestions
                }],
                taskDetails: [],
                createdAt: props.test.createdAt,
                // FIX: Added issuedAt to resolve property missing error in JSX
                issuedAt: props.attempt.submittedAt || Date.now(),
                status: 'issued' as const,
                summary: props.attempt.reportCard?.performanceSummary || '',
                comments: props.attempt.reportCard?.teacherComments || '',
            };
        }
        return null;
    }, [props]);

    useEffect(() => {
        if (mode === 'view') {
            if (props.reportCard) {
                setComments(props.reportCard.comments);
                setSummary(props.reportCard.summary);
            } else if (props.attempt) {
                setComments(props.attempt.reportCard?.teacherComments || '');
                setSummary(props.attempt.reportCard?.performanceSummary || '');
            }
        } else if (mode === 'edit') {
            setComments(props.reportCard.comments);
            setSummary(props.reportCard.summary);
        } else if (mode === 'create') {
            const avgScore = props.reportData.testResults.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / (props.reportData.testResults.length || 1);
            const scorePercentage = avgScore * 100;

            const templateSummary = `Overall, ${student.name.split(' ')[0]} demonstrated a ${scorePercentage >= 80 ? 'strong' : scorePercentage >= 60 ? 'good' : 'developing'} understanding of the material during this period.`;
            setSummary(templateSummary);
            setComments('');
        }
    }, [props, student.name, mode]);

    const handleSave = () => {
        if (mode === 'view' || !props.onSave) return;
        setIsSaving(true);
        setTimeout(() => {
            let finalReportCard;
            if (mode === 'create') {
                finalReportCard = {
                    ...props.reportData,
                    summary,
                    comments,
                };
                props.onSave(finalReportCard as Omit<ReportCard, 'id' | 'status'>);
            } else if (mode === 'edit') {
                 finalReportCard = {
                    ...props.reportCard,
                    summary,
                    comments,
                };
                props.onSave(finalReportCard as ReportCard);
            }
            setIsSaving(false);
        }, 1000);
    };

    if (!isOpen || !reportCardData) return null;

    const { testResults, taskDetails } = reportCardData;
    const overallScore = testResults.reduce((acc, r) => acc + r.score, 0);
    const overallTotal = testResults.reduce((acc, r) => acc + r.totalQuestions, 0);
    const overallPercentage = overallTotal > 0 ? ((overallScore / overallTotal) * 100).toFixed(1) : 'N/A';
    
    const completedTasks = taskDetails.filter(t => t.status === 'Completed' || t.status === 'Graded').length;

    const buttonText = {
        create: 'Save as Draft',
        edit: 'Update Draft',
        view: '',
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[98vh] flex flex-col animate-scaleIn">
                <header className="p-3 flex justify-between items-center border-b dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {mode === 'create' ? 'Generate Report Card' : mode === 'edit' ? 'Edit Draft Report' : 'Student Report Card'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>

                <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                    <div id="report-card-content" className="w-full mx-auto bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl border dark:border-slate-700 aspect-[1/1.414] flex flex-col">
                        {/* Header */}
                        <div className="flex-shrink-0 flex justify-between items-start border-b-2 pb-3 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <BookOpenIcon className="w-10 h-10 text-indigo-600"/>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tighter">Pathshaala</h1>
                                    <p className="text-xs text-slate-500">Official Performance Report</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-lg">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.studentId}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(reportCardData.startDate).toLocaleDateString()} - {new Date(reportCardData.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-grow grid grid-cols-5 gap-4 py-3 min-h-0">
                            <div className="col-span-3 space-y-3 flex flex-col">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Teacher's Comments</h3>
                                    {mode === 'view' ? (
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap border p-2 rounded-md bg-slate-50 dark:bg-slate-700/50 min-h-[100px]">{comments}</p>
                                    ) : (
                                        <textarea value={comments} onChange={e => setComments(e.target.value)} rows={5} className="input-style w-full text-xs mt-1" placeholder="Detailed comments..."/>
                                    )}
                                </div>
                                 <div className="flex-grow flex flex-col min-h-0">
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Assignment Summary</h3>
                                    <div className="border rounded-md flex-1 overflow-y-auto">
                                        {taskDetails.length > 0 ? taskDetails.map((task, index) => (
                                            <div key={index} className="flex items-center justify-between p-1.5 text-xs border-b last:border-b-0 dark:border-slate-700">
                                                <p className="truncate pr-2">{task.text}</p>
                                                <span className={`px-1.5 py-0.5 font-semibold rounded-full text-[10px] flex-shrink-0 ${task.status === 'Graded' ? 'bg-green-100 text-green-800' : task.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>{task.status} {task.grade && `(${task.grade})`}</span>
                                            </div>
                                        )) : <p className="p-4 text-center text-xs text-slate-400">No tasks in this period.</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-3">
                                 <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Performance Summary</h3>
                                    {mode === 'view' ? (
                                        <p className="text-xs italic text-slate-700 dark:text-slate-300 mt-1">"{summary}"</p>
                                    ) : (
                                        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} className="input-style w-full text-xs mt-1" placeholder="Overall performance summary..."/>
                                    )}
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg text-center">
                                    <h3 className="text-xs font-semibold uppercase text-indigo-800 dark:text-indigo-200 tracking-wider">Overall Test Score</h3>
                                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{overallPercentage}<span className="text-xl">%</span></p>
                                    <p className="text-[10px] text-indigo-500">({overallScore} of {overallTotal} correct)</p>
                                </div>
                                 <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-center">
                                    <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Task Completion</h3>
                                    <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{completedTasks}<span className="text-xl">/{taskDetails.length}</span></p>
                                    <p className="text-[10px] text-slate-500">tasks completed</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 flex justify-between items-end pt-2 mt-auto border-t-2 border-slate-200 dark:border-slate-700">
                            <div className="text-left">
                                <p className="text-[10px] text-slate-400">
                                    {/* FIX: Cast reportCardData to any to bypass strict issuedAt check on the union type */}
                                    {((reportCardData as any).status === 'issued' && (reportCardData as any).issuedAt)
                                        ? `Issued on: ${new Date((reportCardData as any).issuedAt).toLocaleString()}`
                                        : `Draft created: ${new Date(reportCardData.createdAt).toLocaleString()}`
                                    }
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-dotted w-32 border-slate-400 mb-1 h-6"></div>
                                <p className="text-xs font-semibold">{reportCardData.teacherName}</p>
                                <p className="text-[10px] text-slate-500 -mt-1">Teacher's Signature</p>
                                <BookOpenIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mt-1"/>
                            </div>
                        </div>
                    </div>
                </div>

                {mode !== 'view' && (
                    <footer className="p-3 flex justify-end gap-3 border-t dark:border-slate-700 flex-shrink-0">
                        <button onClick={onClose} className="btn-secondary">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : buttonText[mode]}
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ReportCardModal;
