

import React from 'react';
import { ArchivedUser, Role, TeacherProfile, StudentProfile, ParentProfile } from '../types';
import { ArchiveIcon } from './icons/IconComponents';

interface ArchiveViewProps {
  archivedUsers: ArchivedUser[];
  setArchivedUsers: React.Dispatch<React.SetStateAction<ArchivedUser[]>>;
}

const roleColors: { [key in Role]: { bg: string, text: string, border: string } } = {
    admin: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-500' },
    teacher: { bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-500' },
    student: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-500' },
    parent: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-500' },
};

const DetailItem: React.FC<{ label: string; value?: string | string[] | number }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{String(displayValue)}</p>
        </div>
    );
};

const ArchivedUserCard: React.FC<{ user: ArchivedUser, onMarkAsViewed: (userId: string) => void }> = ({ user, onMarkAsViewed }) => {
    const roleColor = roleColors[user.role];
    const profile = user.profile;
    const isUnattended = user.isArchiveViewed === false;

    const handleClick = () => {
        if (isUnattended) {
            onMarkAsViewed(user.id);
        }
    };

    return (
        <div 
            onClick={handleClick}
            className={`p-5 rounded-lg shadow-sm border-l-4 ${roleColor.border} transition-all duration-300 ${isUnattended ? 'bg-white dark:bg-slate-800 animate-highlight-glow cursor-pointer' : 'bg-slate-50 dark:bg-slate-800/50 opacity-70'}`}
        >
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="flex items-center gap-4">
                    <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-16 h-16 rounded-full grayscale object-cover" />
                    <div>
                        <p className="font-semibold text-xl text-slate-800 dark:text-slate-100">{user.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                </div>
                <div className="mt-3 sm:mt-0 sm:text-right">
                     <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archived</p>
                     <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(user.deletedAt).toLocaleDateString()}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(user.deletedAt).toLocaleTimeString()}</p>
                </div>
            </div>
            
            <div className="my-4 border-t border-dashed border-slate-200 dark:border-slate-700"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                <DetailItem label="Platform ID" value={user.studentId || user.teacherId || user.parentId || user.adminId} />
                <DetailItem label="Role" value={user.role} />
                
                {user.role === 'teacher' && (
                    <>
                        <DetailItem label="Subjects" value={(profile as Omit<TeacherProfile, 'status' | 'deletionInfo'>).subjects} />
                        <DetailItem label="Qualification" value={(profile as Omit<TeacherProfile, 'status' | 'deletionInfo'>).qualification} />
                    </>
                )}
                 {user.role === 'student' && (
                    <>
                        <DetailItem label="Grade" value={(profile as Omit<StudentProfile, 'status' | 'deletionInfo'>).grade} />
                        <DetailItem label="Interests" value={(profile as Omit<StudentProfile, 'status' | 'deletionInfo'>).subjectsOfInterest} />
                    </>
                )}
                 {user.role === 'parent' && (
                    <DetailItem label="Child ID" value={(profile as Omit<ParentProfile, 'status' | 'deletionInfo'>).childStudentId} />
                )}
            </div>
        </div>
    );
};

const ArchiveView: React.FC<ArchiveViewProps> = ({ archivedUsers, setArchivedUsers }) => {

  const handleMarkAsViewed = (userId: string) => {
    setArchivedUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, isArchiveViewed: true } : u)
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">User Archive</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        This is a permanent, read-only record of all users deleted from the platform.
      </p>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {archivedUsers.length > 0 ? (
          [...archivedUsers]
            .sort((a, b) => (a.isArchiveViewed === false ? -1 : 1) - (b.isArchiveViewed === false ? -1 : 1) || b.deletedAt - a.deletedAt)
            .map(user => (
              <ArchivedUserCard key={user.id} user={user} onMarkAsViewed={handleMarkAsViewed} />
          ))
        ) : (
          <div className="text-center py-16">
            <ArchiveIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-slate-500">The archive is empty.</p>
            <p className="text-xs text-slate-400">Permanently deleted users will be recorded here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveView;