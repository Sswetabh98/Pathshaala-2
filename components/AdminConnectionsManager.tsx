
import React, { useMemo, useState } from 'react';
import { Connection, User, Message, CalendarEvent, ClassChatMessage } from '../types';
import { LinkIcon, MessageIcon, ClassroomIcon, ClockIcon, SearchIcon, CalendarIcon, XIcon, InfoCircleIcon, WhiteboardIcon, ChatBubbleIcon } from './icons/IconComponents';
import SwipeableConnectionStatus from './SwipeableConnectionStatus';

interface AdminConnectionsManagerProps {
    connections: Connection[];
    allUsers: User[];
    onUpdateConnection: (connection: Connection) => void;
    messages: Message[];
    calendarEvents: CalendarEvent[];
    attendedEventIds: string[];
    onAttendEvent: (eventId: string) => void;
}

const SessionProofModal: React.FC<{
    session: any;
    onClose: () => void;
}> = ({ session, onClose }) => {
    if (!session) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold">Proof of Session Audit</h2>
                        <p className="text-xs text-slate-500">Session ID: {session.sessionId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                </header>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                            <h3 className="text-sm font-black uppercase text-indigo-600 mb-3 flex items-center gap-2">
                                <ChatBubbleIcon className="w-4 h-4"/> AI Chat Summary
                            </h3>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 italic text-slate-700 dark:text-slate-300 leading-relaxed">
                                "{session.chatSummary || 'No summary available.'}"
                            </div>
                        </section>
                        <section>
                            <h3 className="text-sm font-black uppercase text-indigo-600 mb-3 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4"/> Metadata
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Started At</p>
                                    <p className="text-sm font-bold">{new Date(session.startedAt).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
                                    <p className="text-sm font-bold">{session.durationMinutes} Minutes</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section>
                        <h3 className="text-sm font-black uppercase text-indigo-600 mb-3 flex items-center gap-2">
                            <WhiteboardIcon className="w-4 h-4"/> Final Whiteboard State
                        </h3>
                        {session.whiteboardSnapshot ? (
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border dark:border-slate-700">
                                <img src={session.whiteboardSnapshot} alt="Session Snapshot" className="w-full h-auto max-h-[400px] object-contain bg-white" />
                            </div>
                        ) : (
                            <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                                No whiteboard data captured for this session.
                            </div>
                        )}
                    </section>
                </div>
                <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="btn-primary">Acknowledge Audit</button>
                </footer>
            </div>
        </div>
    );
};

const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms %= (24 * 60 * 60 * 1000);
    const hours = Math.floor(ms / (60 * 60 * 1000));
    
    let duration = '';
    if (days > 0) duration += `${days}d `;
    if (hours > 0) duration += `${hours}h`;
    
    if (duration.trim() === '') {
        const minutes = Math.floor(ms / (60 * 1000));
        return `${minutes}m`;
    }

    return duration.trim();
};

const UserPill: React.FC<{user: User}> = ({user}) => (
    <div className="flex items-center">
        <img className="h-10 w-10 rounded-full" src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
        <div className="ml-3 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
        </div>
    </div>
);

const ConnectionCard: React.FC<{
    connection: Connection,
    student: User,
    teacher: User,
    messageCount: number,
    onUpdateConnection: (connection: Connection) => void,
    onViewHistory: (conn: Connection) => void
}> = ({ connection, student, teacher, messageCount, onUpdateConnection, onViewHistory }) => {

    const duration = formatDuration(Date.now() - connection.startedAt);
    const totalClasses = connection.classHistory?.length || 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 border-slate-200 dark:border-slate-700 transition hover:shadow-lg hover:border-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Users Info */}
                <div className="md:col-span-4 flex items-center justify-center md:justify-start gap-4">
                    <UserPill user={student} />
                    <div className="h-0.5 w-6 bg-slate-300 dark:bg-slate-600 border-t border-dashed border-slate-400 dark:border-slate-500"></div>
                    <UserPill user={teacher} />
                </div>
                 {/* Analytics */}
                 <div className="md:col-span-5 flex flex-row md:flex-row justify-around items-center text-center md:border-l md:border-r md:px-4 border-slate-200 dark:border-slate-700">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Connected</p>
                        <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{duration}</p>
                     </div>
                     <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                     <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">Messages</p>
                        <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{messageCount}</p>
                     </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                     <button 
                        onClick={() => onViewHistory(connection)}
                        className="group flex flex-col items-center hover:opacity-70 transition-opacity"
                    >
                         <p className="text-[10px] font-black text-slate-400 uppercase">Sessions</p>
                        <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            {totalClasses}
                            <InfoCircleIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        </p>
                     </button>
                 </div>
                 {/* Actions */}
                 <div className="md:col-span-3 flex items-center justify-center">
                    <SwipeableConnectionStatus connection={connection} onUpdateConnection={onUpdateConnection} />
                 </div>
            </div>
        </div>
    );
};

const ScheduledClassCard: React.FC<{ event: CalendarEvent; student: User; teacher: User; onAttend: (eventId: string) => void; isAttended: boolean; }> = ({ event, student, teacher, onAttend, isAttended }) => {
    return (
        <div 
            onClick={() => !isAttended && onAttend(event.id)}
            className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 transition-all duration-300 ${isAttended ? 'border-slate-300 dark:border-slate-600 opacity-60' : 'border-blue-400 animate-highlight-glow cursor-pointer hover:shadow-lg'}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 flex items-center justify-center md:justify-start gap-4">
                    <UserPill user={student} />
                    <div className="h-0.5 w-6 bg-slate-300 dark:bg-slate-600"></div>
                    <UserPill user={teacher} />
                </div>
                <div className="md:col-span-5 flex flex-col items-center text-center md:border-l md:border-r md:px-4 border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><CalendarIcon className="w-4 h-4" />Scheduled Time</p>
                    <p className="text-md font-bold text-blue-600 dark:text-blue-400">{new Date(event.start).toLocaleString()}</p>
                </div>
                <div className="md:col-span-3 flex items-center justify-center relative">
                    <div className="flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-blue-800 dark:text-blue-200 rounded-full bg-blue-100 dark:bg-blue-900/50 w-32 h-8">
                        Waiting for Class
                    </div>
                </div>
            </div>
        </div>
    );
};

const SlidingToggle: React.FC<{
    value: 'upcoming' | 'all';
    onChange: (newValue: 'upcoming' | 'all') => void;
    upcomingCount: number;
}> = ({ value, onChange, upcomingCount }) => {
    return (
        <div className="relative w-full max-w-md mx-auto h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center p-1">
            <div
                className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white dark:bg-slate-800 rounded-md shadow-md transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(${value === 'upcoming' ? '0%' : 'calc(100% + 4px)'})` }}
            />
            <button
                onClick={() => onChange('upcoming')}
                className="relative w-1/2 h-full text-sm font-medium z-10 flex items-center justify-center"
            >
                <span className={`transition-colors flex items-center gap-2 ${value === 'upcoming' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    <CalendarIcon className="w-5 h-5" />
                    <span>Upcoming Classes</span>
                    {upcomingCount > 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${value === 'upcoming' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50' : 'bg-gray-300 dark:bg-slate-800 text-gray-700 dark:text-gray-200'}`}>{upcomingCount}</span>
                    )}
                </span>
            </button>
            <button
                onClick={() => onChange('all')}
                className="relative w-1/2 h-full text-sm font-medium z-10 flex items-center justify-center"
            >
                <span className={`transition-colors flex items-center gap-2 ${value === 'all' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    <LinkIcon className="w-5 h-5" />
                    <span>All Connections</span>
                </span>
            </button>
        </div>
    );
};

const AdminConnectionsManager: React.FC<AdminConnectionsManagerProps> = ({ connections, allUsers, onUpdateConnection, messages, calendarEvents, attendedEventIds, onAttendEvent }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'flagged'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [historyConnection, setHistoryConnection] = useState<Connection | null>(null);
    const [auditSession, setAuditSession] = useState<any | null>(null);
    
    const upcomingClassesCount = useMemo(() => {
        return calendarEvents.filter(e => e.start > Date.now() && !attendedEventIds.includes(e.id)).length;
    }, [calendarEvents, attendedEventIds]);

    const [activeView, setActiveView] = useState<'upcoming' | 'all'>(() =>
        upcomingClassesCount > 0 ? 'upcoming' : 'all'
    );

    const messageCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        messages.forEach(msg => {
            const conn = connections.find(c => 
                (c.studentId === msg.senderId && c.teacherId === msg.receiverId) ||
                (c.studentId === msg.receiverId && c.teacherId === msg.senderId)
            );
            if (conn) {
                counts[conn.id] = (counts[conn.id] || 0) + 1;
            }
        });
        return counts;
    }, [messages, connections]);

    const filteredUpcomingClasses = useMemo(() => {
        const upcoming = calendarEvents
            .filter(e => e.start > Date.now())
            .sort((a,b) => a.start - b.start);

        if (!searchTerm.trim()) return upcoming;

        const lowerSearchTerm = searchTerm.toLowerCase();

        return upcoming.filter(event => {
            const participantUsers = event.participants.map(p => allUsers.find(u => u.id === p.userId)).filter((u): u is User => !!u);
            const student = participantUsers.find(u => u.role === 'student');
            const teacher = participantUsers.find(u => u.role === 'teacher');
            
            return student?.name.toLowerCase().includes(lowerSearchTerm) ||
                   teacher?.name.toLowerCase().includes(lowerSearchTerm);
        });
    }, [calendarEvents, searchTerm, allUsers]);

    const filteredConnections = useMemo(() => {
        return connections.filter(conn => {
            if (conn.status === 'terminated') return false;
            
            const statusMatch = statusFilter === 'all' || conn.status === statusFilter;
            
            const student = allUsers.find(u => u.id === conn.studentId);
            const teacher = allUsers.find(u => u.id === conn.teacherId);
            const searchMatch = !searchTerm ||
                student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            return statusMatch && searchMatch;
        });
    }, [connections, statusFilter, searchTerm, allUsers]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">Connections Management</h2>
            <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                         <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                         <input
                            type="text"
                            placeholder="Search by student or teacher name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-style w-full pl-10"
                        />
                    </div>
                </div>

                <div className="mt-4">
                     <SlidingToggle
                        value={activeView}
                        onChange={setActiveView}
                        upcomingCount={upcomingClassesCount}
                    />
                </div>

                {activeView === 'all' && (
                    <div className="flex-shrink-0 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mt-4">
                        {(['all', 'active', 'suspended', 'flagged'] as const).map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${statusFilter === status ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {activeView === 'upcoming' && (
                    <div className="space-y-4">
                        {filteredUpcomingClasses.length > 0 ? (
                            filteredUpcomingClasses.map(event => {
                                const participantUsers = event.participants.map(p => allUsers.find(u => u.id === p.userId)).filter((u): u is User => !!u);
                                const student = participantUsers.find(u => u.role === 'student');
                                const teacher = participantUsers.find(u => u.role === 'teacher');
                                if (!student || !teacher) return null;
                                
                                return <ScheduledClassCard key={event.id} event={event} student={student} teacher={teacher} onAttend={onAttendEvent} isAttended={attendedEventIds.includes(event.id)} />;
                            })
                        ) : (
                            <div className="text-center py-16">
                                <CalendarIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="mt-4 text-slate-500">No upcoming classes to show.</p>
                            </div>
                        )}
                    </div>
                )}
                {activeView === 'all' && (
                    <div className="space-y-4">
                        {filteredConnections.map(conn => {
                            const student = allUsers.find(u => u.id === conn.studentId);
                            const teacher = allUsers.find(u => u.id === conn.teacherId);
                            if (!student || !teacher) return null;

                            return (
                               <ConnectionCard
                                    key={conn.id}
                                    connection={conn}
                                    student={student}
                                    teacher={teacher}
                                    messageCount={messageCounts[conn.id] || 0}
                                    onUpdateConnection={onUpdateConnection}
                                    onViewHistory={setHistoryConnection}
                               />
                            );
                        })}

                        {filteredConnections.length === 0 && (
                            <div className="text-center py-16">
                                <LinkIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="mt-4 text-slate-500">No connections match the current filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Connection History Sidebar/Modal Overlay */}
            {historyConnection && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-fadeIn" onClick={() => setHistoryConnection(null)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in" onClick={e => e.stopPropagation()}>
                        <header className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <div>
                                <h3 className="text-xl font-bold">Class History Audit</h3>
                                <p className="text-xs text-slate-500">Reviewing session proofs for escrow verification.</p>
                            </div>
                            <button onClick={() => setHistoryConnection(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {(!historyConnection.classHistory || historyConnection.classHistory.length === 0) ? (
                                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                    <ClassroomIcon className="w-16 h-16 mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-sm">No History Recorded</p>
                                </div>
                            ) : (
                                historyConnection.classHistory.map(session => (
                                    <button 
                                        key={session.sessionId}
                                        onClick={() => setAuditSession(session)}
                                        className="w-full text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(session.startedAt).toLocaleDateString()}</p>
                                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">{session.durationMinutes} Mins</span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 italic">"{session.chatSummary || 'No summary captured.'}"</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <WhiteboardIcon className="w-3.5 h-3.5" />
                                                {session.whiteboardSnapshot ? 'PROOF ATTACHED' : 'NO VISUAL PROOF'}
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 underline">AUDIT PROOF</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            <SessionProofModal session={auditSession} onClose={() => setAuditSession(null)} />
        </div>
    );
};

export default AdminConnectionsManager;
