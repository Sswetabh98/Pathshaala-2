
import React, { useState, useRef, useMemo } from 'react';
import { User, Message, Notification, Connection, getUserPermissions, Announcement, ArchivedUser, SecurityAlert, AuditLog, StudentProfile, TeacherProfile, ParentProfile, SecurityAction, CalendarEvent } from '../types';
import { DashboardIcon, UsersIcon, MessageIcon, LogoutIcon, SettingsIcon, ShieldCheckIcon, MenuIcon, XIcon, BookOpenIcon, AnnouncementIcon, RefreshIcon, CopyIcon, CheckCircleIcon } from './icons/IconComponents';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationBell from './NotificationBell';
import NotificationPanel from './NotificationPanel';
import MessagingCenter from './MessagingCenter';
import SettingsPage from './SettingsPage';
import { MessageContent, Plan } from '../types';
import UserManagement from './UserManagement';
import PlatformToolsSuite from './PlatformToolsSuite';
import AnnouncementsManager from './AnnouncementsManager';
import NotificationCenter from './NotificationCenter';
import AdminConnectionsManager from './AdminConnectionsManager';
import { useLocalStorage } from '../utils';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  archivedUsers: ArchivedUser[];
  setArchivedUsers: React.Dispatch<React.SetStateAction<ArchivedUser[]>>;
  securityAlerts: SecurityAlert[];
  setSecurityAlerts: React.Dispatch<React.SetStateAction<SecurityAlert[]>>;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  onUpdateUser: (user: User) => void;
  messages: Message[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  typingUsers: Record<string, boolean>;
  onSendMessage: (receiverId: string, content: MessageContent) => void;
  // FIX: Added missing management props to interface
  onDeleteMessage: (messageId: string, type: 'for_me' | 'for_everyone') => void;
  onClearChat: (otherUserId: string) => void;
  onMarkAsRead: (otherUserId: string) => void;
  onTyping: (receiverId: string, isTyping: boolean) => void;
  hasUnreadMessages: boolean;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  onConnectionResponse: (notification: Notification, response: 'accepted' | 'rejected') => void;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  onAppReset: () => void;
  handleManualRefresh: () => void;
  onApprovePinReset: (userId: string) => void;
  onRejectPinReset: (userId: string) => void;
  calendarEvents: CalendarEvent[];
}

type AdminView = 'dashboard' | 'user_management' | 'platform_tools' | 'messages' | 'announcements' | 'connections' | 'settings';

const PinResetConfirmationModal: React.FC<{
    isOpen: boolean;
    onAcknowledge: () => void;
    user: User;
    newPin: string;
}> = ({ isOpen, onAcknowledge, user, newPin }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(newPin).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onAcknowledge}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
                <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mt-4">PIN Reset Successful</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    The PIN for <span className="font-semibold">{user.name}</span> has been reset. The user can retrieve these new credentials from the "Check Application Status" tool.
                </p>
                <div className="my-4 text-center bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                    <p className="text-xs font-semibold text-slate-500">NEW 6-DIGIT PIN</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 tracking-widest">{newPin}</p>
                        <button onClick={handleCopy} title="Copy PIN" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 relative">
                            <CopyIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            {copySuccess && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-1 rounded">{copySuccess}</span>}
                        </button>
                    </div>
                </div>
                <button onClick={onAcknowledge} className="btn-primary w-full relative">
                    Acknowledge & Close
                </button>
            </div>
        </div>
    );
};

const PinApprovalConfirmationModal: React.FC<{
    isOpen: boolean;
    onApprove: () => void;
    onReject: () => void;
    onClose: () => void;
    user: User | null;
}> = ({ isOpen, onApprove, onReject, onClose, user }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
                <CheckCircleIcon className="w-16 h-16 mx-auto text-blue-500" />
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mt-4">Review PIN Reset Request</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Please review the new PIN chosen by <span className="font-semibold">{user.name}</span>. The user will be notified of your decision.
                </p>
                <div className="my-4 text-center bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                    <p className="text-xs font-semibold text-slate-500">USER'S PROPOSED PIN</p>
                    <p className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 tracking-widest">{user.pendingPin}</p>
                </div>
                 <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onReject} className="btn-primary bg-red-600 hover:bg-red-700">
                        Reject
                    </button>
                    <button onClick={onApprove} className="btn-primary">
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminHome: React.FC = () => (
    <div>
        <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
        <p>Welcome to the admin control panel. From here you can manage users, monitor security, and broadcast announcements.</p>
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { user, onLogout, allUsers, setAllUsers, archivedUsers, setArchivedUsers, securityAlerts, setSecurityAlerts, auditLogs, addAuditLog, onUpdateUser, messages, notifications, setNotifications, typingUsers, onSendMessage, onDeleteMessage, onClearChat, onMarkAsRead, onTyping, hasUnreadMessages, connections, setConnections, announcements, setAnnouncements, onAppReset, handleManualRefresh, onApprovePinReset, onRejectPinReset, calendarEvents, onConnectionResponse } = props;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [initialChatUserId, setInitialChatUserId] = useState<string | null>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  
  const [isPressingRefresh, setIsPressingRefresh] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  
  const [pinResetConfirmation, setPinResetConfirmation] = useState<{ user: User, newPin: string, alertIds: string[] } | null>(null);
  const [pinApprovalConfirm, setPinApprovalConfirm] = useState<{user: User} | null>(null);

  const [attendedEventIds, setAttendedEventIds] = useLocalStorage<string[]>('attendedEventIds', []);

  const handleAttendEvent = (eventId: string) => {
      setAttendedEventIds(prev => [...new Set([...prev, eventId])]);
  };

  const platformToolsAttention = useMemo(() => {
    const urgentSecurity = securityAlerts.some(a => !a.isDismissed);
    const urgentUserStatus = allUsers.some(u => {
        const p = u.profile as StudentProfile | TeacherProfile | ParentProfile;
        return (p.status === 'suspended' && p.isSuspensionViewed === false) ||
               (p.status === 'removed' && p.isRemovalViewed === false);
    });
    const urgentRecycle = allUsers.some(u => {
        const p = u.profile as StudentProfile | TeacherProfile | ParentProfile;
        return p.status === 'deleted' && p.deletionInfo?.isDeletionViewed === false;
    });
    
    const isAnyTimerRunning = allUsers.some(u => {
        const p = u.profile as StudentProfile | TeacherProfile | ParentProfile;
        return p.status === 'deleted' && p.deletionInfo && !p.deletionInfo.isPaused;
    });

    const hasNewArchiveEntries = archivedUsers.some(u => u.isArchiveViewed === false);

    return { 
        urgent: urgentSecurity || urgentUserStatus || urgentRecycle, 
        normal: !urgentSecurity && !urgentUserStatus && !urgentRecycle && (isAnyTimerRunning || hasNewArchiveEntries)
    };
  }, [allUsers, securityAlerts, archivedUsers]);

  const userManagementAttention = useMemo(() => {
    const hasPendingUsers = allUsers.some(u => (u.profile as any).status === 'pending');
    const hasPendingPinResets = allUsers.some(u => u.pinResetPending);
    return hasPendingUsers || hasPendingPinResets;
  }, [allUsers]);

  const hasUnattendedConnections = useMemo(() => {
    return calendarEvents.some(e => e.start > Date.now() && !attendedEventIds.includes(e.id));
  }, [calendarEvents, attendedEventIds]);

  const handleCreateAnnouncement = (announcement: Omit<Announcement, 'id'|'timestamp'>) => {
    const newAnnouncement: Announcement = {
        ...announcement,
        id: `ann-${Date.now()}`,
        timestamp: Date.now(),
    };
    setAnnouncements(prev => [...prev, newAnnouncement]);
  };
  
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, enabled: true },
    { id: 'user_management', label: 'User Management', icon: UsersIcon, enabled: true, needsUrgentAttention: userManagementAttention },
    { id: 'platform_tools', label: 'Platform Tools', icon: ShieldCheckIcon, enabled: true, needsUrgentAttention: platformToolsAttention.urgent, needsAttention: platformToolsAttention.normal },
    { id: 'messages', label: 'Messages', icon: MessageIcon, enabled: true, needsUrgentAttention: hasUnreadMessages },
    { id: 'announcements', label: 'Announcements', icon: AnnouncementIcon, enabled: true },
    { id: 'connections', label: 'Connections', icon: UsersIcon, enabled: true, needsAttention: hasUnattendedConnections },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, enabled: true },
  ].filter(item => item.enabled), [hasUnreadMessages, platformToolsAttention, userManagementAttention, hasUnattendedConnections]);
  
  const [activeView, setActiveView] = useLocalStorage<AdminView>(`activeView-${user.id}`, () => {
    const firstUrgentItem = navItems.find(item => item.needsUrgentAttention);
    if (firstUrgentItem) return firstUrgentItem.id as AdminView;
    const firstAttentionItem = navItems.find(item => item.needsAttention);
    return firstAttentionItem ? (firstAttentionItem.id as AdminView) : 'dashboard';
  });
  
  const handleRefreshPressStart = () => {
    setIsPressingRefresh(true);
    longPressTimer.current = window.setTimeout(() => {
        onAppReset();
        longPressTimer.current = null; // Mark timer as fired
    }, 2000);
  };

  const handleRefreshPressEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    setIsPressingRefresh(false);
    // If timer is still there, it was a short click
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        setActiveView('dashboard');
    }
    // If it was a long press (timer is null) AND a touch event, prevent ghost click
    else if (e && e.type === 'touchend') {
        e.preventDefault();
    }
  };
  
  const handleMouseLeave = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      setIsPressingRefresh(false);
  }

  const handleNavigation = (view: string, params?: { userId?: string }) => {
    if (view === 'messages' && params?.userId) {
        setInitialChatUserId(params.userId);
    } else {
        setInitialChatUserId(null);
    }
    setActiveView(view as AdminView);
  };
  
    const handleInitiatePinApproval = (userToApprove: User) => {
        setPinApprovalConfirm({ user: userToApprove });
    };

    const handleFinalizePinApproval = () => {
        if (pinApprovalConfirm) {
            onApprovePinReset(pinApprovalConfirm.user.id);
            setPinApprovalConfirm(null);
        }
    };

    const handleFinalizePinRejection = () => {
        if (pinApprovalConfirm) {
            onRejectPinReset(pinApprovalConfirm.user.id);
            setPinApprovalConfirm(null);
        }
    };

    const handleAcknowledgePinReset = () => {
        if (!pinResetConfirmation) return;
        const { user: userToReset, newPin, alertIds } = pinResetConfirmation;

        onUpdateUser({
            ...userToReset,
            pin: newPin,
            isLocked: false,
            loginAttempts: 0,
            pinJustResetByAdmin: true,
        });
        
        addAuditLog({
            adminId: user.id,
            adminName: user.name,
            targetUserId: userToReset.id,
            targetUserName: userToReset.name,
            action: 'User PIN Reset & Unlocked',
            details: `Forced PIN reset and unlocked account in response to alert(s): ${alertIds.join(', ')}.`
        });
        
        setSecurityAlerts(prev =>
            prev.map(alert =>
                alertIds.includes(alert.id) ? { ...alert, isDismissed: true, resolutionAction: 'reset_pin' } : alert
            )
        );
        
        setPinResetConfirmation(null);
    };

    const handleSecurityAction = (alertIdOrIds: string | string[], action: SecurityAction, userId: string) => {
        const ids = Array.isArray(alertIdOrIds) ? alertIdOrIds : [alertIdOrIds];

        if (action === 'dismiss') {
            setSecurityAlerts(prev =>
                prev.map(alert =>
                    ids.includes(alert.id) ? { ...alert, isDismissed: true, resolutionAction: 'dismiss' } : alert
                )
            );
            addAuditLog({
                adminId: user.id,
                adminName: user.name,
                targetUserId: userId,
                targetUserName: allUsers.find(u => u.id === userId)?.name || 'N/A',
                action: 'Security Alert Dismissed',
                details: `Dismissed alert(s): ${ids.join(', ')}.`
            });
        }
        
        if (action === 'reset_pin') {
            const userToReset = allUsers.find(u => u.id === userId);
            if (userToReset) {
                const newPin = String(Math.floor(100000 + Math.random() * 900000));
                setPinResetConfirmation({ user: userToReset, newPin, alertIds: ids });
            }
        }

        if (action === 'force_pin_reset') {
            const userToUpdate = allUsers.find(u => u.id === userId);
            if (userToUpdate) {
                const updatedUser = {
                    ...userToUpdate,
                    tempOtp: { code: 'ADMIN_FORCE_RESET', expiresAt: Date.now() + 15 * 60 * 1000 }
                };
                onUpdateUser(updatedUser);
                addAuditLog({
                    adminId: user.id,
                    adminName: user.name,
                    targetUserId: userId,
                    targetUserName: userToUpdate.name,
                    action: 'Forced PIN Reset Initiated',
                    details: `Admin initiated a mandatory PIN reset for the user in response to alert(s): ${ids.join(', ')}.`
                });
                setSecurityAlerts(prev =>
                    prev.map(alert =>
                        ids.includes(alert.id) ? { ...alert, isDismissed: true, resolutionAction: 'force_pin_reset' } : alert
                    )
                );
            }
        }
    };
  
  const handleRestoreUser = (userToRestore: User) => {
        const updatedUser: User = {
            ...userToRestore,
            profile: {
                ...userToRestore.profile,
                status: 'suspended',
                isSuspensionViewed: false,
                deletionInfo: undefined
            } as StudentProfile | TeacherProfile | ParentProfile
        };
        onUpdateUser(updatedUser);
        addAuditLog({
            adminId: user.id,
            adminName: user.name,
            targetUserId: userToRestore.id,
            targetUserName: userToRestore.name,
            action: 'User Restored',
            details: 'Restored user from recycle bin to suspended status.'
        });
    };

    const handleDeletePermanently = (userId: string) => {
        const userToArchive = allUsers.find(u => u.id === userId);
        if (!userToArchive) return;

        const { pin, password, loginAttempts, isLocked, tempOtp, pendingPin, pinResetPending, ...restOfUser } = userToArchive;

        const archivedUser: ArchivedUser = {
            ...restOfUser,
            deletedAt: Date.now(),
            deletedBy: user.name,
            isArchiveViewed: false,
        };
        
        setArchivedUsers(prev => [...prev, archivedUser]);
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        
        addAuditLog({
            adminId: user.id,
            adminName: user.name,
            targetUserId: userId,
            targetUserName: userToArchive.name,
            action: 'User Archived',
            details: 'Permanently deleted user from recycle bin and moved to archive.'
        });
    };
    
  const activeLabel = useMemo(() => navItems.find(item => item.id === activeView)?.label || 'Dashboard', [activeView, navItems]);

  const renderContent = () => {
    switch (activeView) {
        case 'user_management': return <UserManagement allUsers={allUsers} onUpdateUser={onUpdateUser} auditLogs={auditLogs} addAuditLog={addAuditLog} currentUser={user} onInitiatePinApproval={handleInitiatePinApproval} onRejectPinReset={onRejectPinReset} />;
        case 'platform_tools': return <PlatformToolsSuite allUsers={allUsers} archivedUsers={archivedUsers} setArchivedUsers={setArchivedUsers} securityAlerts={securityAlerts} onAction={handleSecurityAction} onRestoreUser={handleRestoreUser} onDeletePermanently={handleDeletePermanently} onUpdateUser={onUpdateUser} />;
        // FIX: Passed missing message management props to MessagingCenter
        case 'messages': return <MessagingCenter currentUser={user} allUsers={allUsers} messages={messages} typingUsers={typingUsers} onSendMessage={onSendMessage} onDeleteMessage={onDeleteMessage} onClearChat={onClearChat} onMarkAsRead={onMarkAsRead} onTyping={onTyping} onReactToMessage={()=>{}} onPinMessage={()=>{}} connections={connections} announcements={announcements} onCreateAnnouncement={handleCreateAnnouncement} initialChatUserId={initialChatUserId} onChatUserSelected={() => setInitialChatUserId(null)} />;
        case 'announcements': return <AnnouncementsManager announcements={announcements} onCreateAnnouncement={handleCreateAnnouncement} currentUser={user} allUsers={allUsers} />;
        case 'connections': return <AdminConnectionsManager connections={connections} allUsers={allUsers} onUpdateConnection={(conn) => setConnections(prev => prev.map(c => c.id === conn.id ? conn : c))} messages={messages} calendarEvents={calendarEvents} attendedEventIds={attendedEventIds} onAttendEvent={handleAttendEvent} />;
        // FIX: Passed missing onSelectPlan dummy prop to SettingsPage
        case 'settings': return <SettingsPage user={user} onUpdateUser={onUpdateUser} onLogout={onLogout} auditLogs={auditLogs} onSelectPlan={() => {}} notifications={notifications} />;
      case 'dashboard':
      default:
        return <AdminHome />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <BookOpenIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Pathshaala</h1>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onMouseDown={handleRefreshPressStart}
                    onMouseUp={handleRefreshPressEnd}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleRefreshPressStart}
                    onTouchEnd={handleRefreshPressEnd}
                    className={`p-1.5 rounded-full transition-colors ${
                        isPressingRefresh
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50'
                            : 'text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400'
                    }`}
                    title="Click to go to Dashboard. Hold for 2s to reset app."
                >
                    <RefreshIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-500 dark:text-slate-400">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map(item => {
                const isActive = activeView === item.id;
                const needsUrgentAttention = !isActive && (item as any).needsUrgentAttention;
                const needsNormalAttention = !isActive && (item as any).needsAttention && !(item as any).needsUrgentAttention;
                const needsAnyAttention = needsUrgentAttention || needsNormalAttention;

                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveView(item.id as AdminView);
                            setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                        isActive 
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200' 
                        : needsAnyAttention 
                        ? 'nav-item-attention text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                        {needsUrgentAttention && <span className="animate-pulse-dot-blue"></span>}
                        {needsNormalAttention && <span className="static-dot-blue"></span>}
                    </button>
                )
            })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
             <div className="flex justify-around items-center">
                <ThemeSwitcher />
                <NotificationBell 
                    ref={bellRef}
                    user={user} 
                    notifications={notifications} 
                    onToggle={() => setIsNotifOpen(prev => !prev)}
                />
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 w-full">
                    <img onClick={() => setActiveView('settings')} src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-10 h-10 rounded-full cursor-pointer" />
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">{user.role}</p>
                    </div>
                </div>
                <div className="mt-3 border-t border-slate-200 dark:border-slate-600 pt-3">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-red-100 hover:text-red-700 dark:bg-slate-700 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors">
                        <LogoutIcon className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-transparent flex items-center justify-center p-4 lg:gap-4">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fadeIn"></div>}
      <aside className={`h-[95vh] w-64 bg-white dark:bg-slate-900 flex flex-col shadow-xl rounded-2xl z-40 transition-transform duration-300 ease-in-out lg:static lg:transform-none fixed top-1/2 -translate-y-1/2 left-4 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
          <SidebarContent />
      </aside>
      <div className={`flex-1 flex flex-col overflow-hidden h-[95vh] rounded-2xl shadow-xl bg-white dark:bg-slate-900 ${isSidebarOpen ? 'hidden lg:flex' : 'flex'} lg:w-auto w-full`}>
        <header className="relative flex-shrink-0 bg-white dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
            <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white capitalize">{activeLabel}</h2>
                </div>
            </div>
        </header>
        <main className="flex-1 p-6 sm:p-8 flex flex-col min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-800">
            {renderContent()}
        </main>
      </div>
      <NotificationPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        user={user}
        notifications={notifications}
        setNotifications={setNotifications}
        onConnectionResponse={onConnectionResponse}
        anchorRef={bellRef}
        onViewAll={() => setIsNotificationCenterOpen(true)}
        onNavigate={handleNavigation}
      />
      <NotificationCenter
            isOpen={isNotificationCenterOpen}
            onClose={() => setIsNotificationCenterOpen(false)}
            user={user}
            notifications={notifications}
            setNotifications={setNotifications}
            onNavigate={handleNavigation}
        />
        {pinResetConfirmation && (
            <PinResetConfirmationModal 
                isOpen={!!pinResetConfirmation}
                onAcknowledge={handleAcknowledgePinReset}
                user={pinResetConfirmation.user}
                newPin={pinResetConfirmation.newPin}
            />
        )}
        <PinApprovalConfirmationModal
            isOpen={!!pinApprovalConfirm}
            onClose={() => setPinApprovalConfirm(null)}
            onApprove={handleFinalizePinApproval}
            onReject={handleFinalizePinRejection}
            user={pinApprovalConfirm?.user || null}
        />
    </div>
  );
};

export default AdminDashboard;
