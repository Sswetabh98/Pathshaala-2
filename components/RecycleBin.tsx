import React, { useState } from 'react';
import { User, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import TimerControl from './TimerControl';
import { UndoIcon, TrashIcon, ArchiveIcon } from './icons/IconComponents';
import AdminActionConfirmModal from './AdminActionConfirmModal';

interface RecycleBinProps {
  users: User[];
  onRestoreUser: (user: User) => void;
  onDeletePermanently: (userId: string, userName?: string) => void;
  onUpdateUser: (user: User) => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ users, onRestoreUser, onDeletePermanently, onUpdateUser }) => {
  const [confirmAction, setConfirmAction] = useState<{user: User, action: 'restore' | 'archive'} | null>(null);
  
  const deletedUsers = users.filter(u => (u.profile as StudentProfile | TeacherProfile | ParentProfile).status === 'deleted');

  const handleConfirm = () => {
      if (!confirmAction) return;
      const { user, action } = confirmAction;

      if (action === 'restore') {
          onRestoreUser(user);
      } else if (action === 'archive') {
          onDeletePermanently(user.id, user.name);
      }
      setConfirmAction(null);
  };

  const handleMarkAsViewed = (userToUpdate: User) => {
    const profile = userToUpdate.profile as StudentProfile | TeacherProfile | ParentProfile;
    if (profile.deletionInfo && profile.deletionInfo.isDeletionViewed === false) {
        onUpdateUser({ 
            ...userToUpdate, 
            profile: { 
                ...profile, 
                deletionInfo: { ...profile.deletionInfo, isDeletionViewed: true } 
            }
        });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
        <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Recycle Bin</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Users will be permanently archived after their timer expires. You can restore them or archive them manually.
        </p>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {deletedUsers.length > 0 ? (
            deletedUsers.map(user => {
              const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile;
              const isUnattended = profile.deletionInfo?.isDeletionViewed === false;
              const isTimerRunning = profile.deletionInfo && !profile.deletionInfo.isPaused;
              return (
              <div 
                key={user.id} 
                onClick={() => handleMarkAsViewed(user)}
                className={`bg-slate-50 dark:bg-slate-900/50 rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-12 md:items-center gap-4 transition-all duration-300 ${isUnattended ? 'animate-highlight-glow' : 'hover:shadow-xl hover:scale-[1.01] hover:bg-white dark:hover:bg-slate-800 cursor-pointer'}`}
              >
                <div className="md:col-span-1 flex items-center justify-center">
                    <img src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                </div>
                
                <div className="md:col-span-4 text-center md:text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{user.role}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <div className="md:col-span-4 flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Deletion Timer</p>
                    <TimerControl
                        user={user}
                        onUpdateUser={onUpdateUser}
                        onTimerExpired={() => onDeletePermanently(user.id)}
                    />
                </div>

                <div className="md:col-span-3 flex items-center gap-3 w-full justify-center md:justify-end" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setConfirmAction({user, action: 'restore'})}
                    disabled={isTimerRunning}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-100 dark:disabled:hover:bg-blue-900/50"
                    title={isTimerRunning ? "Pause the timer to restore" : "Restore User"}
                  >
                    <UndoIcon className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setConfirmAction({user, action: 'archive'})}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-sm transition-colors"
                    title="Archive Now"
                  >
                    <ArchiveIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )})
          ) : (
            <div className="text-center py-16">
              <TrashIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-slate-500">The recycle bin is empty.</p>
            </div>
          )}
        </div>
      </div>
      <AdminActionConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          user={confirmAction?.user || null}
          actionText={confirmAction?.action === 'restore' ? 'Restore User' : 'Archive Now'}
          actionColor={confirmAction?.action === 'restore' ? 'blue' : 'red'}
      />
    </>
  );
};

export default RecycleBin;