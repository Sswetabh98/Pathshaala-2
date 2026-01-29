
import React, { FC, useMemo, useState, useEffect } from 'react';
import { User, ConnectionRequest, TeacherProfile, StudentProfile, Connection } from '../types';
import { CheckIcon, XIcon, UsersIcon, ClockIcon, ArrowRightIcon, UserRemoveIcon, LinkIcon, BookOpenIcon, ShieldCheckIcon } from './icons/IconComponents';
import { useLocalStorage } from '../utils';

type ConnectionTab = 'requests' | 'active';

interface ConnectionsManagerProps {
    currentUser: User;
    allUsers: User[];
    onAcceptRequest: (fromUserId: string) => void;
    onRejectRequest: (fromUserId: string) => void;
    onWithdrawRequest: (toUserId: string) => void;
    onTerminateConnection: (connectionId: string) => void;
    connections: Connection[];
    subView?: string | null;
}

interface ConnectionCardProps {
    user: User | undefined;
    children?: React.ReactNode;
    info?: {
        type: 'active' | 'incoming' | 'outgoing';
        timestamp: number;
    };
    isBlocked?: boolean;
    onToggleBlock?: () => void;
    isTeacher?: boolean;
}

const ConnectionCard: FC<ConnectionCardProps> = ({ user, children, info, isBlocked, onToggleBlock, isTeacher }) => {
    if (!user) return null;
    const profile = user.profile as StudentProfile | TeacherProfile;

    let infoText = '';
    if (info) {
        const dateString = new Date(info.timestamp).toLocaleDateString();
        if (info.type === 'active') infoText = `Connected on ${dateString}`;
        if (info.type === 'incoming') infoText = `Requested on ${dateString}`;
        if (info.type === 'outgoing') infoText = `Sent on ${dateString}`;
    }
    
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 flex items-center gap-4 transition-all duration-300 ${isBlocked ? 'opacity-60 grayscale border-red-200 dark:border-red-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="relative">
                <img 
                    src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0" 
                />
                {user.isOnline && !isBlocked && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div>
                    <p className={`font-bold text-lg transition-all ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'} truncate`}>{user.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full flex-shrink-0">{user.role}</span>
                        {infoText && <p className="text-xs text-slate-500 dark:text-slate-400">{infoText}</p>}
                    </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                    <div className="min-w-0">
                        {user.role === 'teacher' && (
                             <div className="flex items-center gap-3 sm:gap-4 text-center">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hourly</p>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">₹{(profile as TeacherProfile).hourlyRate}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salary Range</p>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">₹{(profile as TeacherProfile).salaryRange}</p>
                                </div>
                             </div>
                        )}
                        {user.role === 'student' && (
                             <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 capitalize truncate">
                                <BookOpenIcon className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                                <span className="font-semibold">Interests:</span>
                                <span className="truncate">{(profile as StudentProfile).subjectsOfInterest.join(', ')}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isTeacher && info?.type === 'active' && onToggleBlock && (
                            <button 
                                onClick={onToggleBlock}
                                className={`p-2 rounded-lg transition-all border ${
                                    isBlocked 
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-transparent hover:border-red-100 dark:hover:border-red-800/50'
                                }`}
                                aria-label={isBlocked ? 'Unblock Student' : 'Block Student'}
                                title={isBlocked ? 'Unblock Student' : 'Block Student'}
                            >
                                <ShieldCheckIcon className={`w-5 h-5 ${isBlocked ? 'animate-pulse' : ''}`} />
                            </button>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

const EmptyState: FC<{ icon: React.FC<any>; text: string }> = ({ icon: Icon, text }) => (
    <div className="text-center text-slate-500 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Icon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-sm">{text}</p>
    </div>
);


const ConnectionsManager: FC<ConnectionsManagerProps> = ({ currentUser, allUsers, onAcceptRequest, onRejectRequest, onWithdrawRequest, onTerminateConnection, connections, subView }) => {
    
    // Persistence for Restricted Access
    const [restrictedAccess, setRestrictedAccess] = useLocalStorage<string[]>(`restrictedAccess-${currentUser.id}`, []);

    const toggleStudentAccess = (studentId: string) => {
        setRestrictedAccess(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const isTeacher = currentUser.role === 'teacher';

    useEffect(() => {
        if (subView === 'active') {
            const element = document.getElementById('active-connections-section');
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [subView]);
    
    const { incomingRequests, outgoingRequests } = useMemo(() => {
        const myProfile = currentUser.profile as TeacherProfile | StudentProfile;
        const incoming = myProfile.connectionRequests?.filter(req => req.status === 'pending') || [];
        
        const outgoing: { userId: string, timestamp: number }[] = [];
        const targetRole = currentUser.role === 'student' ? 'teacher' : 'student';
        
        allUsers.forEach(user => {
            if (user.role === targetRole) {
                const theirProfile = user.profile as TeacherProfile | StudentProfile;
                const reqToMe = theirProfile.connectionRequests?.find(req => req.userId === currentUser.id && req.status === 'pending');
                if (reqToMe) {
                    outgoing.push({ userId: user.id, timestamp: reqToMe.timestamp });
                }
            }
        });
        
        return { incomingRequests: incoming, outgoingRequests: outgoing };
    }, [currentUser, allUsers]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <UsersIcon className="w-8 h-8 text-indigo-500"/>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Manage Connections</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View your active connections and pending requests.</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                 <section id="active-connections-section">
                    <div className="p-2 mb-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            Active Connections
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{connections.filter(c => c.status === 'active').length}</span>
                        </h3>
                    </div>
                    <div className="space-y-3">
                       {connections.filter(c => c.status === 'active').length > 0 ? connections.filter(c => c.status === 'active').map(conn => {
                           const otherUserId = conn.studentId === currentUser.id ? conn.teacherId : conn.studentId;
                           const otherUser = allUsers.find(u => u.id === otherUserId);
                           return (
                               <ConnectionCard 
                                    key={conn.id} 
                                    user={otherUser} 
                                    info={{ type: 'active', timestamp: conn.startedAt }}
                                    isBlocked={otherUser ? restrictedAccess.includes(otherUser.id) : false}
                                    onToggleBlock={otherUser ? () => toggleStudentAccess(otherUser.id) : undefined}
                                    isTeacher={isTeacher}
                                >
                                    <button onClick={() => onTerminateConnection(conn.id)} className="btn-secondary py-1.5 px-3 text-sm border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50">
                                        <UserRemoveIcon className="w-4 h-4 mr-1"/> Terminate
                                    </button>
                               </ConnectionCard>
                           )
                       }) : <EmptyState icon={LinkIcon} text="You have no active connections." />}
                    </div>
                </section>

                <section>
                     <div className="p-2 mb-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            Incoming Requests 
                            <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">{incomingRequests.length}</span>
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {incomingRequests.length > 0 ? incomingRequests.map(req => (
                            <ConnectionCard key={req.userId} user={allUsers.find(u => u.id === req.userId)} info={{ type: 'incoming', timestamp: req.timestamp }}>
                                <button onClick={() => onAcceptRequest(req.userId)} className="btn-primary bg-green-600 hover:bg-green-700 py-1.5 px-3 text-sm"><CheckIcon className="w-4 h-4 mr-1"/>Accept</button>
                                <button onClick={() => onRejectRequest(req.userId)} className="btn-secondary py-1.5 px-3 text-sm"><XIcon className="w-4 h-4 mr-1"/>Decline</button>
                            </ConnectionCard>
                        )) : <EmptyState icon={UsersIcon} text="No incoming requests." />}
                    </div>
                </section>
                <section>
                     <div className="p-2 mb-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            Sent Requests
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{outgoingRequests.length}</span>
                        </h3>
                    </div>
                     <div className="space-y-3">
                        {outgoingRequests.length > 0 ? outgoingRequests.map(req => (
                            <ConnectionCard key={req.userId} user={allUsers.find(u => u.id === req.userId)} info={{ type: 'outgoing', timestamp: req.timestamp }}>
                                <button onClick={() => onWithdrawRequest(req.userId)} className="btn-secondary py-1.5 px-3 text-sm border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900">
                                    <ClockIcon className="w-4 h-4 mr-1"/> Withdraw Request
                                </button>
                            </ConnectionCard>
                        )) : <EmptyState icon={ArrowRightIcon} text="No requests sent." />}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ConnectionsManager;
