
import React from 'react';
import { User } from '../types';
import { useLocalStorage } from '../utils';
import { ShieldCheckIcon, UsersIcon } from './icons/IconComponents';

interface StudentSidebarProps {
    students: User[];
    currentUser: User;
}

/**
 * StudentSidebar: Manages the student roster for the teacher.
 * Features: Access Control (Block/Allow), Live Status, and RAM Optimization.
 * Search bar removed per user instruction.
 */
const StudentSidebar: React.FC<StudentSidebarProps> = ({ students, currentUser }) => {
    // Persistence: Use localStorage to track restricted students
    const [restrictedAccess, setRestrictedAccess] = useLocalStorage<string[]>(`restrictedAccess-${currentUser.id}`, []);

    const toggleStudentAccess = (studentId: string) => {
        setRestrictedAccess(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    // RAM Optimization: Slicing the list for initial render performance.
    const visibleStudents = students.length > 50 ? students.slice(0, 50) : students;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-fadeIn overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Student Roster</h3>
                </div>
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                    {students.length} TOTAL
                </span>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 participant-list-scrollbar">
                {visibleStudents.map(student => {
                    const isBlocked = restrictedAccess.includes(student.id);
                    return (
                        <div 
                            key={student.id} 
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={student.profilePicUrl || `https://i.pravatar.cc/150?u=${student.id}`} 
                                        alt={student.name} 
                                        className={`w-9 h-9 rounded-full object-cover ring-2 transition-all ${isBlocked ? 'grayscale opacity-50' : 'ring-transparent group-hover:ring-indigo-500/30'}`}
                                    />
                                    {/* Live Status Indicator */}
                                    {student.isOnline && (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold truncate transition-colors ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {student.name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                                        {student.studentId} • {student.isOnline ? <span className="text-green-500">LIVE</span> : 'Away'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Shield Lock / Access Control Toggle */}
                            <button 
                                onClick={() => toggleStudentAccess(student.id)}
                                className={`p-2 rounded-lg transition-all ${
                                    isBlocked 
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                                        : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 md:opacity-0 group-hover:opacity-100'
                                }`}
                                aria-label={isBlocked ? 'Unblock Student' : 'Block Student'}
                                title={isBlocked ? 'Unblock Student' : 'Block Student'}
                            >
                                <ShieldCheckIcon className={`w-4 h-4 ${isBlocked ? 'animate-pulse' : ''}`} />
                            </button>
                        </div>
                    );
                })}
                
                {students.length > 50 && (
                    <div className="py-4 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">
                            Showing top 50 matches
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSidebar;
