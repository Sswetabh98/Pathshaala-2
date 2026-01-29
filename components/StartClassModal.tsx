import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { XIcon, SpinnerIcon, SearchIcon } from './icons/IconComponents';

interface StartClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (studentIds: string[]) => void;
    connectedStudents: User[];
}

const StartClassModal: React.FC<StartClassModalProps> = ({ isOpen, onClose, onStart, connectedStudents }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isStarting, setIsStarting] = useState(false);

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

    const handleStartClick = () => {
        setIsStarting(true);
        setTimeout(() => {
            onStart(Array.from(selectedStudentIds));
            setIsStarting(false);
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col animate-scaleIn">
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Start a New Class</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>

                <div className="p-4 border-b dark:border-slate-700">
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
                    <button onClick={handleStartClick} disabled={isStarting || selectedStudentIds.size === 0} className="btn-primary">
                        {isStarting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : `Start Class with ${selectedStudentIds.size} Student(s)`}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default StartClassModal;