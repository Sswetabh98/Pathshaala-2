import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, ArchivedUser, SecurityAlert, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import SecurityCenter from './SecurityCenter';
import RecycleBin from './RecycleBin';
import ArchiveView from './ArchiveView';
import { ShieldCheckIcon, TrashIcon, ArchiveIcon, ExclamationTriangleIcon, BellIcon, BellOffIcon } from './icons/IconComponents';
import SuspendedUsersManager from './SuspendedUsersManager';

type ToolTab = 'security' | 'user_status' | 'recycle' | 'archive';

interface PlatformToolsSuiteProps {
    allUsers: User[];
    archivedUsers: ArchivedUser[];
    setArchivedUsers: React.Dispatch<React.SetStateAction<ArchivedUser[]>>;
    securityAlerts: SecurityAlert[];
    onAction: (alertId: string, action: any, userId: string) => void;
    onRestoreUser: (user: User) => void;
    onDeletePermanently: (userId: string, userName?: string) => void;
    onUpdateUser: (user: User) => void;
}

const PlatformToolsSuite: React.FC<PlatformToolsSuiteProps> = (props) => {
    const { unattendedUserStatusCount, unattendedRecycleCount, unattendedArchiveCount } = useMemo(() => {
        const suspended = props.allUsers.filter(u => {
            const profile = u.profile as StudentProfile | TeacherProfile | ParentProfile;
            return profile.status === 'suspended' && profile.isSuspensionViewed === false;
        }).length;

        const removed = props.allUsers.filter(u => {
            const profile = u.profile as StudentProfile | TeacherProfile | ParentProfile;
            return profile.status === 'removed' && profile.isRemovalViewed === false;
        }).length;

        const recycle = props.allUsers.filter(u => {
            const profile = u.profile as StudentProfile | TeacherProfile | ParentProfile;
            return profile.status === 'deleted' && profile.deletionInfo?.isDeletionViewed === false;
        }).length;
        
        const archive = props.archivedUsers.filter(u => u.isArchiveViewed === false).length;

        return { 
            unattendedUserStatusCount: suspended + removed, 
            unattendedRecycleCount: recycle,
            unattendedArchiveCount: archive,
        };
    }, [props.allUsers, props.archivedUsers]);
    
    const initialTab = useMemo(() => {
        const hasUnreadAlerts = props.securityAlerts.filter(a => !a.isDismissed).length > 0;
        if (hasUnreadAlerts) return 'security';

        if (unattendedUserStatusCount > 0) return 'user_status';
        if (unattendedRecycleCount > 0) return 'recycle';
        if (unattendedArchiveCount > 0) return 'archive';

        return 'security'; // Default
    }, [props.securityAlerts, unattendedUserStatusCount, unattendedRecycleCount, unattendedArchiveCount]);
    
    const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);
    const [isReminderMuted, setIsReminderMuted] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- Intelligent Tab Switching Wrappers ---

    const handleRestoreUserWrapper = (userToRestore: User) => {
        if (unattendedRecycleCount === 1) {
            setActiveTab('user_status');
        }
        props.onRestoreUser(userToRestore);
    };

    const handleDeletePermanentlyWrapper = (userId: string, userName?: string) => {
        if (unattendedRecycleCount === 1) {
            setActiveTab('archive');
        }
        props.onDeletePermanently(userId, userName);
    };

    const handleUpdateUserWrapper = (updatedUser: User) => {
        const originalUser = props.allUsers.find(u => u.id === updatedUser.id);
        if (originalUser) {
            const oldStatus = (originalUser.profile as any).status;
            const newStatus = (updatedUser.profile as any).status;
            if (['suspended', 'removed'].includes(oldStatus) && newStatus === 'deleted' && unattendedUserStatusCount === 1) {
                 setActiveTab('recycle');
            }
        }
        props.onUpdateUser(updatedUser);
    };

    const isAnyTimerRunning = useMemo(() => {
        return props.allUsers.some(u => {
            const profile = u.profile as StudentProfile | TeacherProfile | ParentProfile;
            return profile.status === 'deleted' && profile.deletionInfo && !profile.deletionInfo.isPaused;
        });
    }, [props.allUsers]);
    
    useEffect(() => {
      // Create and resume AudioContext on mount.
      // This leverages the user's initial click (to log in) to bypass browser autoplay restrictions.
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }, []);

    useEffect(() => {
        let intervalId: number | undefined;

        if (isAnyTimerRunning && !isReminderMuted) {
            const playSound = () => {
                const audioContext = audioCtxRef.current;
                if (!audioContext || audioContext.state !== 'running') return;

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(987.77, audioContext.currentTime); // B5
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            };
            
            // Wait a moment for the context to resume before starting the interval
            setTimeout(() => {
                playSound();
                intervalId = window.setInterval(playSound, 10000);
            }, 100);
        }
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isAnyTimerRunning, isReminderMuted]);
    
    const handleMuteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        // The AudioContext is now resumed on mount, so we just toggle the state.
        setIsReminderMuted(prev => !prev);
    };

    const tabs = [
        { 
            id: 'security', 
            label: 'Security Center', 
            icon: ShieldCheckIcon, 
            count: props.securityAlerts.filter(a => !a.isDismissed).length,
            component: <SecurityCenter alerts={props.securityAlerts} allUsers={props.allUsers} onAction={props.onAction} />
        },
        { 
            id: 'user_status', 
            label: 'Suspended Users', 
            icon: ExclamationTriangleIcon, 
            count: unattendedUserStatusCount,
            component: <SuspendedUsersManager users={props.allUsers} onUpdateUser={handleUpdateUserWrapper} />
        },
        { 
            id: 'recycle', 
            label: 'Recycle Bin', 
            icon: TrashIcon, 
            count: unattendedRecycleCount,
            component: <RecycleBin users={props.allUsers} onRestoreUser={handleRestoreUserWrapper} onDeletePermanently={handleDeletePermanentlyWrapper} onUpdateUser={props.onUpdateUser} />
        },
        { 
            id: 'archive', 
            label: 'User Archive', 
            icon: ArchiveIcon, 
            count: unattendedArchiveCount,
            component: <ArchiveView archivedUsers={props.archivedUsers} setArchivedUsers={props.setArchivedUsers} />
        },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
    const showReminder = isAnyTimerRunning;

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-slate-200 dark:border-slate-700 rounded-t-xl px-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ToolTab)}
                            className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                            {tab.id === 'recycle' && showReminder && (
                                <button onClick={handleMuteToggle} className="ml-1 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 z-10" title={isReminderMuted ? "Unmute Reminder" : "Mute Reminder"}>
                                    {isReminderMuted
                                        ? <BellOffIcon className="w-4 h-4 text-slate-500" />
                                        : <BellIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
                                    }
                                </button>
                            )}
                            {tab.count > 0 && (
                                <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${tab.id === 'archive' ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200' : 'bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto mt-0 p-6">
                {ActiveComponent}
            </div>
        </div>
    );
};

export default PlatformToolsSuite;