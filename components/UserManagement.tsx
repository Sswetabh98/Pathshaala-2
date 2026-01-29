
import React, { useState, useMemo } from 'react';
// FIX: Import necessary types from the corrected types file.
import { User, UserStatus, StudentProfile, TeacherProfile, ParentProfile, statusInfo, AuditLog } from '../types';
import { CheckIcon, XIcon, TrashIcon } from './icons/IconComponents';
import SwipeableStatus from './SwipeableStatus';
import UserDetailsModal from './UserDetailsModal';
import MessageApplicantModal from './MessageApplicantModal';
import AdminActionConfirmModal from './AdminActionConfirmModal';

// FIX: Added missing props to the interface to satisfy the component's signature
interface UserManagementProps {
    allUsers: User[];
    onUpdateUser: (user: User) => void;
    auditLogs: AuditLog[];
    addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
    currentUser: User;
    onInitiatePinApproval: (user: User) => void;
    onRejectPinReset: (userId: string) => void;
}

type UserRoleTab = 'all' | 'pending' | 'student' | 'teacher' | 'parent' | 'rejected';

const StaticStatusPill: React.FC<{status: UserStatus}> = ({ status }) => {
    const info = statusInfo[status];
    const isPending = status === 'pending';
    if (!info) {
        return <span className={`flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full bg-gray-400 w-28 h-7 capitalize`}>{status}</span>;
    }
    return <div className={`flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full ${info.color} w-28 h-7 ${isPending ? 'animate-pulse-glow-yellow' : ''}`}>{info.text}</div>;
};

const RejectedUserCard: React.FC<{user: User, onCardClick: () => void, onMessageClick: () => void}> = ({ user, onCardClick, onMessageClick }) => {
    const profile = user.profile as StudentProfile | TeacherProfile;
    const isViewed = (profile as any).isRejectedViewed;
    
    let detail1 = '', detail2 = '';
    if (user.role === 'student') {
        detail1 = `Grade: ${(profile as StudentProfile).grade}`;
        detail2 = `Interests: ${(profile as StudentProfile).subjectsOfInterest.join(', ')}`;
    } else if (user.role === 'teacher') {
        detail1 = `Qualification: ${(profile as TeacherProfile).qualification}`;
        detail2 = `Subjects: ${(profile as TeacherProfile).subjects.join(', ')}`;
    }

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (!isViewed) onCardClick();
    };

    return (
        <div onClick={handleCardClick} className={`bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm transition-all flex flex-col sm:flex-row items-start gap-4 ${isViewed ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}>
            <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Applicant</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{user.role}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Application Details</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{detail1}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{detail2}</p>
                </div>
                 <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Contact</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{user.email}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{user.phone}</p>
                </div>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
                <button onClick={onMessageClick} className="btn-primary py-2 w-full sm:w-auto">
                    Message Applicant
                </button>
            </div>
        </div>
    );
};

const UserManagement: React.FC<UserManagementProps> = 
({ allUsers, onUpdateUser, auditLogs, addAuditLog, currentUser, onInitiatePinApproval, onRejectPinReset }) => {
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [showToast, setShowToast] = useState<string | null>(null);
    const [rejectingUser, setRejectingUser] = useState<User | null>(null);

    const pendingCount = useMemo(() => allUsers.filter(u => (u.profile as any).status === 'pending').length, [allUsers]);
    const rejectedCount = useMemo(() => allUsers.filter(u => (u.profile as any).status === 'rejected' && !(u.profile as any).isRejectedViewed).length, [allUsers]);
    const pinResetCount = useMemo(() => allUsers.filter(u => u.pinResetPending).length, [allUsers]);


    const [activeTab, setActiveTab] = useState<UserRoleTab>(() => {
        if (pendingCount > 0) return 'pending';
        if (rejectedCount > 0) return 'rejected';
        return 'all';
    });

    const [approvalInfo, setApprovalInfo] = useState<{name: string, loginId: string, pin: string} | null>(null);
    const [messagingUser, setMessagingUser] = useState<User | null>(null);


    const platformIdHeader = useMemo(() => {
        switch (activeTab) {
            case 'student': return 'Student ID';
            case 'teacher': return 'Teacher ID';
            case 'parent': return 'Parent ID';
            default: return 'Platform ID';
        }
    }, [activeTab]);
    
    const showPinColumn = useMemo(() => ['all', 'student', 'teacher', 'parent'].includes(activeTab), [activeTab]);
    const showDetailsColumn = useMemo(() => ['student', 'teacher', 'parent'].includes(activeTab), [activeTab]);

    const handleViewUser = (userToView: User) => {
        setViewingUser(userToView);
    };
    
    const handleMarkRejectedAsViewed = (userToUpdate: User) => {
        const profile = userToUpdate.profile as StudentProfile | TeacherProfile | ParentProfile;
        if (profile.status === 'rejected' && !profile.isRejectedViewed) {
            const updatedUser = { ...userToUpdate, profile: { ...profile, isRejectedViewed: true } };
            onUpdateUser(updatedUser);
        }
    };

    const filteredUsers = useMemo(() => {
        let users;

        if (activeTab === 'pending') {
            users = allUsers.filter(u => u.role !== 'admin' && (u.profile as any).status !== 'deleted' && ((u.profile as any).status === 'pending' || u.pinResetPending));
        } else if (activeTab === 'rejected') {
            users = allUsers.filter(u => u.role !== 'admin' && (u.profile as any).status !== 'deleted' && (u.profile as any).status === 'rejected');
        } else if (activeTab === 'student' || activeTab === 'teacher' || activeTab === 'parent') {
            users = allUsers.filter(u => u.role === activeTab && (u.profile as any).status !== 'deleted' && (u.profile as any).status !== 'pending' && (u.profile as any).status !== 'rejected');
        } else { // 'all' tab
            users = allUsers.filter(u => (u.profile as any).status !== 'deleted' && (u.profile as any).status !== 'rejected');
        }

        if (filter) {
            const lowerFilter = filter.toLowerCase();
            return users.filter(u =>
                u.name.toLowerCase().includes(lowerFilter) ||
                u.email.toLowerCase().includes(lowerFilter) ||
                u.loginId?.toLowerCase().includes(lowerFilter) ||
                u.studentId?.toLowerCase().includes(lowerFilter) ||
                u.teacherId?.toLowerCase().includes(lowerFilter) ||
                u.parentId?.toLowerCase().includes(lowerFilter)
            );
        }
        return users.sort((a,b) => (a.pinResetPending ? -1 : 1) - (b.pinResetPending ? -1 : 1) || a.createdAt! - b.createdAt!);
    }, [allUsers, filter, activeTab]);
    
    const handleActionSuccess = (message: string) => {
        setShowToast(message);
        setTimeout(() => setShowToast(null), 4000);
    };

    const handleUpdateUserWrapper = (updatedUser: User) => {
        const originalUser = allUsers.find(u => u.id === updatedUser.id);
        if (!originalUser) {
            onUpdateUser(updatedUser);
            return;
        }

        const oldStatus = (originalUser.profile as any).status;
        const newStatus = (updatedUser.profile as any).status;
        let newTab: UserRoleTab | null = null;

        if (activeTab === 'pending' && oldStatus === 'pending' && pendingCount === 1) {
            if (newStatus === 'rejected') {
                newTab = 'rejected';
            } else if ((newStatus === 'active' || newStatus === 'approved') && updatedUser.role !== 'admin') {
                newTab = updatedUser.role;
            }
        }
        
        // FIX: Used string cast for activeTab comparison to avoid unintentional narrowing error in TypeScript.
        else if ((activeTab as string) === 'rejected' && oldStatus === 'rejected' && rejectedCount === 1) {
            if ((newStatus === 'active' || newStatus === 'approved') && updatedUser.role !== 'admin') {
                newTab = updatedUser.role;
            } else {
                newTab = 'all'; // Default fallback if deleted from rejected view
            }
        }
        
        onUpdateUser(updatedUser);

        if (newTab) {
            setActiveTab(newTab);
        }
    };

    const ApprovalConfirmationModal = () => {
        if (!approvalInfo) return null;
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn text-center">
                    <CheckIcon className="w-16 h-16 mx-auto text-green-500" />
                    <h2 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">User Approved!</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">{approvalInfo.name}</span> has been approved and their credentials have been generated.
                    </p>
                    <div className="mt-4 text-left bg-slate-100 dark:bg-slate-700 p-4 rounded-md space-y-2">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">LOGIN ID</p>
                            <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-200">{approvalInfo.loginId}</p>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-slate-500">6-DIGIT PIN</p>
                            <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-200">{approvalInfo.pin}</p>
                        </div>
                    </div>
                    <button onClick={() => setApprovalInfo(null)} className="btn-primary w-full mt-6">Done</button>
                </div>
            </div>
        )
    };
    
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-4">User Management</h2>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Search by name, email, or ID..." value={filter} onChange={e => setFilter(e.target.value)} className="input-style" style={{width: '300px'}} />
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(['all', 'pending', 'student', 'teacher', 'parent', 'rejected'] as UserRoleTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize flex items-center`}>
                            {tab}
                            {tab === 'pending' && (pendingCount + pinResetCount) > 0 && <span className="ml-2 bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingCount + pinResetCount}</span>}
                            {tab === 'rejected' && rejectedCount > 0 && <span className="ml-2 bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">{rejectedCount}</span>}
                        </button>
                    ))}
                </nav>
            </div>
            {activeTab === 'rejected' ? (
                <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => <RejectedUserCard key={u.id} user={u} onCardClick={() => handleMarkRejectedAsViewed(u)} onMessageClick={() => setMessagingUser(u)} />)
                    ) : (
                        <p className="text-center text-slate-500 pt-10">No rejected applications.</p>
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto mt-4">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                {(activeTab === 'all' || activeTab === 'pending') && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>}
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Login ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{platformIdHeader}</th>
                                {showDetailsColumn && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>}
                                {showPinColumn && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PIN</th>}
                                {activeTab === 'all' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>}
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                {activeTab === 'pending' && <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.map(u => {
                                const profile = u.profile as StudentProfile | TeacherProfile | ParentProfile;
                                let details = '';
                                if (showDetailsColumn) {
                                    if (u.role === 'student') details = `Grade: ${(profile as StudentProfile).grade}`;
                                    if (u.role === 'teacher') details = `Subjects: ${(profile as TeacherProfile).subjects.join(', ')}`;
                                    if (u.role === 'parent') {
                                        const child = allUsers.find(childUser => childUser.studentId === (profile as ParentProfile).childStudentId);
                                        if (child) {
                                            details = `Child: ${child.name}`;
                                        }
                                    }
                                }
                                return(
                                    <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${u.pinResetPending ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                        <td onClick={() => handleViewUser(u)} className="px-6 py-4 whitespace-nowrap cursor-pointer">
                                            <div className="flex items-center">
                                                <img className="h-10 w-10 rounded-full" src={u.profilePicUrl || `https://i.pravatar.cc/150?u=${u.id}`} alt="" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</div>
                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {(activeTab === 'all' || activeTab === 'pending') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 capitalize">{u.role}</td>}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{u.loginId || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{u.studentId || u.teacherId || u.parentId || u.adminId || 'N/A'}</td>
                                        {showDetailsColumn && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{details}</td>}
                                        {showPinColumn && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 font-mono">{u.pin}</td>}
                                        {activeTab === 'all' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? 'bg-green-500 animate-pulse-dot' : 'bg-slate-400'}`}></span>
                                                    <span>{u.isOnline ? 'Online' : 'Offline'}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center">
                                                {u.role === 'admin' ? (
                                                    <StaticStatusPill status={(u.profile as any).status} />
                                                ) : activeTab === 'pending' && u.pinResetPending ? (
                                                    <div className="flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-yellow-800 rounded-full bg-yellow-200 w-28 h-7 animate-pulse-glow-yellow">PIN Reset</div>
                                                ) : (activeTab as string) === 'rejected' ? (
                                                    <StaticStatusPill status={(u.profile as any).status} />
                                                ) : (
                                                    <SwipeableStatus
                                                        user={u}
                                                        allUsers={allUsers}
                                                        onUpdateUser={handleUpdateUserWrapper}
                                                        onActionSuccess={handleActionSuccess}
                                                        onShowApprovalInfo={(name, id, pin) => setApprovalInfo({ name, loginId: id, pin })}
                                                        addAuditLog={addAuditLog}
                                                        currentUser={currentUser}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        {activeTab === 'pending' && (
                                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {u.pinResetPending ? (
                                                     <div className="flex justify-center gap-2">
                                                        <button onClick={() => onInitiatePinApproval(u)} className="px-3 py-1.5 text-xs font-semibold bg-green-200 text-green-800 rounded-md hover:bg-green-300">
                                                            Review
                                                        </button>
                                                    </div>
                                                ) : <span>-</span>}
                                             </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
             {viewingUser && <UserDetailsModal user={viewingUser} logs={auditLogs} onClose={() => setViewingUser(null)} />}
             <ApprovalConfirmationModal />
             <MessageApplicantModal user={messagingUser} onClose={() => setMessagingUser(null)} />
             <AdminActionConfirmModal
                isOpen={!!rejectingUser}
                onClose={() => setRejectingUser(null)}
                onConfirm={() => {
                    if (rejectingUser) {
                        onRejectPinReset(rejectingUser.id);
                        handleActionSuccess(`PIN reset for ${rejectingUser.name} has been rejected.`);
                        setRejectingUser(null);
                    }
                }}
                user={rejectingUser}
                actionText="Reject PIN Reset"
                actionColor="red"
            />
        </div>
    );
};

export default UserManagement;
