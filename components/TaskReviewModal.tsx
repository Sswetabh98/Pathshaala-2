
import React, { useState, useEffect } from 'react';
import { StudentTask } from '../types';
import { XIcon, SpinnerIcon, ExclamationTriangleIcon } from './icons/IconComponents';

interface TaskReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: StudentTask;
    onSaveReview: (studentId: string, taskId: string, feedback: string, grade: string) => void;
    studentId: string;
}

const TaskReviewModal: React.FC<TaskReviewModalProps> = ({ isOpen, onClose, task, onSaveReview, studentId }) => {
    const [feedback, setFeedback] = useState('');
    const [grade, setGrade] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (task) {
            setFeedback(task.teacherFeedback || '');
            setGrade(task.grade || '');
            setError('');
        }
    }, [task]);

    const handleSave = () => {
        const numericGrade = parseFloat(grade);
        const maxMarks = task.totalMarks || 100;

        if (grade === '' || isNaN(numericGrade)) {
            setError('Please enter a valid numeric grade.');
            return;
        }

        if (numericGrade > maxMarks) {
            setError(`Grade cannot exceed the total marks (${maxMarks}).`);
            return;
        }

        if (numericGrade < 0) {
            setError('Grade cannot be negative.');
            return;
        }

        setError('');
        setIsSaving(true);
        // Simulate network delay
        setTimeout(() => {
            onSaveReview(studentId, task.id, feedback.trim(), grade);
            setIsSaving(false);
            onClose();
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-scaleIn">
                <header className="p-5 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Grading & Review</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-black uppercase text-slate-500 mb-1.5 tracking-widest">Selected Task</p>
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-200 leading-snug">{task.text}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                            <label className="block text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-1.5">Max Possible</label>
                            <p className="text-2xl font-black text-indigo-900 dark:text-white">{task.totalMarks || 100} Marks</p>
                        </div>
                        <div>
                            <label htmlFor="grade" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Awarded Grade</label>
                            <input
                                id="grade"
                                type="number"
                                value={grade}
                                onChange={e => { setGrade(e.target.value); setError(''); }}
                                className={`input-style w-full text-xl font-bold py-3 ${error ? 'border-red-500 ring-red-500/20' : ''}`}
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg border border-red-100 dark:border-red-900/50">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="feedback" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Detailed Feedback</label>
                        <textarea
                            id="feedback"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            rows={4}
                            className="input-style w-full text-base py-3"
                            placeholder="Constructive comments for the student..."
                        />
                    </div>
                </div>

                <footer className="p-4 flex justify-end gap-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary min-w-[140px] font-black uppercase tracking-widest text-sm">
                        {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Submit Grade'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TaskReviewModal;
