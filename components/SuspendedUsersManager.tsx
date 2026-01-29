import React, { useState } from 'react';
import { User, StudentProfile, TeacherProfile, ParentProfile, statusInfo } from '../types';
import { UndoIcon, TrashIcon, CheckCircleIcon } from './icons/IconComponents';
import AdminActionConfirmModal from './AdminActionConfirmModal';

interface SuspendedUsersManagerProps {
  users: User[];
  onUpdateUser: (user: User) => void;
}

const SuspendedUsersManager: React.FC<SuspendedUsersManagerProps> = ({ users, onUpdateUser }) => {
    const [confirmAction, setConfirmAction] = useState<{user: User, action: 'reactivate' | 'delete'} | null>(null);

    const usersWithStatus = users.filter(u => 
        ['suspended', 'removed'].includes((u.profile as StudentProfile | TeacherProfile | ParentProfile).status)
    );

    const handleConfirm = () => {
        if (!confirmAction) return;
        const { user, action } = confirmAction;

        if (action === 'reactivate') {
            const updatedUser: User = {
                ...user,
                profile: { 
                    ...user.profile, 
                    status: (user.role === 'teacher' ? 'approved' : 'active'), 
                    reinstatementRequest: false 
                } as StudentProfile | TeacherProfile | ParentProfile
            };
            onUpdateUser(updatedUser);
        } else if (action === 'delete') {
            const updatedUser: User = {
                ...user,
                profile: { 
                    ...user.profile, 
                    status: 'deleted', 
                    deletionInfo: { markedForDeletionAt: Date.now(), deletionDurationMs: 15 * 24 * 60 * 60 * 1000, isDeletionViewed: false }
                } as StudentProfile | TeacherProfile | ParentProfile
            };
            onUpdateUser(updatedUser);
        }
        setConfirmAction(null);
    };

    const handleMarkAsViewed = (userToUpdate: User) => {
        const profile = userToUpdate.profile as StudentProfile | TeacherProfile | ParentProfile;
        if (profile.status === 'suspended' && profile.isSuspensionViewed === false) {
            onUpdateUser({ ...userToUpdate, profile: { ...profile, isSuspensionViewed: true }});
        }
        if (profile.status === 'removed' && profile.isRemovalViewed === false) {
            onUpdateUser({ ...userToUpdate, profile: { ...profile, isRemovalViewed: true }});
        }
    };


    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
                <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">User Status Management</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Review accounts with non-active statuses. Reactivate them or move them to the recycle bin.
                </p>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {usersWithStatus.length > 0 ? (
                        usersWithStatus.map(user => {
                            const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile;
                            const hasRequest = profile.reinstatementRequest;
                            const isUnattended = (profile.status === 'suspended' && profile.isSuspensionViewed === false) || (profile.status === 'removed' && profile.isRemovalViewed === false);
                            const statusColor = statusInfo[profile.status]?.color || 'bg-gray-400';
                            
                            return (
                                <div 
                                    key={user.id} 
                                    onClick={() => handleMarkAsViewed(user)}
                                    className={`bg-slate-50 dark:bg-slate-900/50 rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-12 md:items-center gap-4 transition-all duration-300 ${hasRequest ? 'border-l-4 border-green-500' : ''} ${isUnattended ? 'animate-highlight-glow' : 'hover:shadow-xl hover:scale-[1.01] hover:bg-white dark:hover:bg-slate-800 cursor-pointer'}`}
                                >
                                    <div className="md:col-span-1 flex items-center justify-center">
                                        <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                                    </div>
                                    
                                    <div className="md:col-span-4 text-center md:text-left">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{user.role}</p>
                                        {user.role === 'student' && <p className="text-xs text-slate-500">Grade: {(profile as StudentProfile).grade}</p>}
                                        {user.role === 'teacher' && <p className="text-xs text-slate-500">Subjects: {(profile as TeacherProfile).subjects.join(', ')}</p>}
                                    </div>
                                    
                                    <div className="md:col-span-4 flex flex-col items-center text-center">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                                        <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold text-white rounded-full capitalize ${statusColor}`}>
                                            {profile.status}
                                        </span>
                                        {hasRequest && (
                                            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-400">
                                                <CheckCircleIcon className="w-5 h-5"/>
                                                Reinstatement Requested
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="md:col-span-3 flex items-center gap-3 w-full justify-center md:justify-end" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setConfirmAction({ user, action: 'reactivate' })}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-semibold text-sm transition-colors"
                                            title="Reactivate User"
                                        >
                                            <UndoIcon className="w-4 h-4" />
                                            <span>Reactivate</span>
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ user, action: 'delete' })}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 font-semibold text-sm transition-colors"
                                            title="Move to Recycle Bin"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-16">
                            <p className="mt-4 text-slate-500">No suspended or removed accounts found.</p>
                        </div>
                    )}
                </div>
            </div>
            <AdminActionConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                user={confirmAction?.user || null}
                actionText={confirmAction?.action === 'reactivate' ? 'Reactivate User' : 'Move to Recycle Bin'}
                actionColor={confirmAction?.action === 'reactivate' ? 'green' : 'red'}
            />
        </>
    );
};

export default SuspendedUsersManager;