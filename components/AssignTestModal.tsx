import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { XIcon, SpinnerIcon, SearchIcon } from './icons/IconComponents';

interface AssignTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (studentIds: string[], dueDate?: number, timeLimitSeconds?: number) => void;
    connectedStudents: User[];
    testTitle: string;
}

const AssignTestModal: React.FC<AssignTestModalProps> = ({ isOpen, onClose, onAssign, connectedStudents, testTitle }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [timeInputs, setTimeInputs] = useState({ hours: '0', minutes: '20', seconds: '0' });

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return connectedStudents;
        return connectedStudents.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [connectedStudents, searchTerm]);

    const handleToggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudentIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudentIds(newSelection);
    };
    
    const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Ensure only non-negative integers are entered
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setTimeInputs(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const handleAssignClick = () => {
        setIsAssigning(true);
        let dueTimestamp: number | undefined = undefined;
        if (dueDate) {
            const timeString = dueTime || '00:00';
            dueTimestamp = new Date(`${dueDate}T${timeString}`).getTime();
        }

        const hours = parseInt(timeInputs.hours || '0', 10);
        const minutes = parseInt(timeInputs.minutes || '0', 10);
        const seconds = parseInt(timeInputs.seconds || '0', 10);
        const timeLimitInSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        // Simulate network delay
        setTimeout(() => {
            onAssign(Array.from(selectedStudentIds), dueTimestamp, timeLimitInSeconds > 0 ? timeLimitInSeconds : undefined);
            setIsAssigning(false);
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg h-[90vh] flex flex-col animate-scaleIn">
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Test</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>

                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 border-b dark:border-slate-700">
                    <p className="text-sm text-slate-500">You are assigning the test:</p>
                    <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{testTitle}</p>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date & Time (Optional)</label>
                        <div className="flex gap-2 mt-1">
                            <input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-style w-full text-sm"/>
                            <input id="due-time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input-style w-full text-sm" disabled={!dueDate}/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Time Limit</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1"><label htmlFor="hours" className="text-xs text-slate-500">HH</label><input type="number" name="hours" id="hours" value={timeInputs.hours} onChange={handleTimeInputChange} min="0" className="input-style w-full text-sm text-center" placeholder="0"/></div>
                            <span className="font-bold pt-4">:</span>
                            <div className="flex-1"><label htmlFor="minutes" className="text-xs text-slate-500">MM</label><input type="number" name="minutes" id="minutes" value={timeInputs.minutes} onChange={handleTimeInputChange} min="0" max="59" className="input-style w-full text-sm text-center" placeholder="20"/></div>
                            <span className="font-bold pt-4">:</span>
                            <div className="flex-1"><label htmlFor="seconds" className="text-xs text-slate-500">SS</label><input type="number" name="seconds" id="seconds" value={timeInputs.seconds} onChange={handleTimeInputChange} min="0" max="59" className="input-style w-full text-sm text-center" placeholder="00"/></div>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-4 border-b dark:border-slate-700">
                    <div className="relative">
                        <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search students to invite..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-style w-full pl-10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                            <label key={student.id} className="flex items-center p-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.has(student.id)}
                                    onChange={() => handleToggleStudent(student.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <img src={student.profilePicUrl || `https://i.pravatar.cc/150?u=${student.id}`} alt={student.name} className="w-10 h-10 rounded-full mx-4" />
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{student.name}</p>
                                    <p className="text-sm text-slate-500">Grade: {(student.profile as any).grade}</p>
                                </div>
                            </label>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 p-8">No connected students found.</p>
                    )}
                </div>

                <footer className="p-4 flex justify-end gap-3 border-t dark:border-slate-700">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleAssignClick} disabled={isAssigning || selectedStudentIds.size === 0} className="btn-primary">
                        {isAssigning ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : `Assign to ${selectedStudentIds.size} Student(s)`}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssignTestModal;