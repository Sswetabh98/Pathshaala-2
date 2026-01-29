import React, { useState, useEffect, useMemo } from 'react';
import { User, Connection, ClassSession, CalendarEvent, Notification, ClassChatMessage } from '../types';
import { ClassroomIcon, XIcon, CalendarIcon } from './icons/IconComponents';
import { VirtualClassroom } from './VirtualClassroom';
import SchedulingManager from './SchedulingManager';

interface UpcomingClassReminderProps {
    event: CalendarEvent;
    onClose: () => void;
}

const UpcomingClassReminder: React.FC<{ event: CalendarEvent; onClose: () => void }> = ({ event, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(event.start - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = event.start - Date.now();
            if (remaining <= 0) {
                clearInterval(timer);
                onClose(); // Auto-close when time is up
            }
            setTimeLeft(remaining);
        }, 1000);
        return () => clearInterval(timer);
    }, [event.start, onClose]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    const isUrgent = timeLeft < 15 * 60 * 1000; // 15 minutes

    return (
        <div className={`relative p-4 rounded-lg border-l-4 flex items-center justify-between gap-4 mb-6 transition-all duration-300 ${isUrgent ? 'bg-red-50 dark:bg-red-900/50 border-red-500 animate-pulse-glow' : 'bg-blue-50 dark:bg-blue-900/50 border-blue-500'}`}>
            <div>
                <p className={`font-bold ${isUrgent ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}>Class Reminder</p>
                <p className={`text-sm ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>Your session "{event.title}" is starting soon.</p>
            </div>
            <div className="text-center">
                 <p className={`text-2xl font-bold font-mono ${isUrgent ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                 </p>
            </div>
             <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10"><XIcon className="w-4 h-4" /></button>
        </div>
    );
};


interface ClassroomViewProps {
    isTeacher: boolean;
    user: User;
    allUsers: User[];
    classSession: ClassSession | null;
    onLeaveClass: (chatHistory: ClassChatMessage[], whiteboardSnapshot: string | null) => void;
    onViewChange?: (view: 'video' | 'whiteboard') => void;
    onUnmount?: (snapshot: { type: 'video' | 'whiteboard', data: string | null }) => void;
    onJoinClass?: () => void;
    onStartClass?: () => void;
    onGoToDashboard: () => void;
    calendarEvents: CalendarEvent[];
    notifications: Notification[];
    connections: Connection[];
    onUpdateConnection: (connection: Connection) => void;
    onConfirmSchedule: (connectionId: string, slotString: string, weekOffset: number) => void;
    onUpdateUser: (user: User) => void;
    initialWhiteboardState?: string | null;
    onWhiteboardUpdate?: (data: string) => void;
    onUpdateClassSession: (session: ClassSession | null) => void;
    onLiveRoomActive?: (isActive: boolean) => void;
    onNavigate?: (view: string, params?: any) => void;
}

const StudentClassroomLobby: React.FC<{ onJoinClass: () => void; classInvite?: Notification; hasSession: boolean }> = ({ onJoinClass, classInvite, hasSession }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="relative mb-6">
            <ClassroomIcon className={`w-24 h-24 ${hasSession ? 'text-indigo-600 animate-pulse' : 'text-indigo-200 dark:text-indigo-800'}`} />
            {hasSession && <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-green-500 ring-4 ring-white dark:ring-slate-900 animate-ping"></span>}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Virtual Classroom</h2>
        {(classInvite || hasSession) ? (
            <div className="animate-fadeIn">
                <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Your Mentor has opened the classroom doors. Secure your slot on the class stage now.</p>
                <button 
                    onClick={onJoinClass} 
                    className="btn-primary mt-8 py-4 px-10 text-xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                    ENTER CLASSROOM STAGE
                </button>
            </div>
        ) : (
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No active classes right now. Use the <strong>Scheduler</strong> tab to propose a new slot or wait for your teacher to initiate a live session.
            </p>
        )}
    </div>
);

const TeacherClassroomLobby: React.FC<{ onStartClass: () => void }> = ({ onStartClass }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <ClassroomIcon className="w-24 h-24 text-indigo-200 dark:text-indigo-800" />
        <h2 className="mt-6 text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Virtual Classroom</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
            Ready to mentor? Start a live session to sync whiteboard and video with your connected students.
        </p>
        <button 
            onClick={() => onStartClass()} 
            className="btn-primary mt-8 py-4 px-10 text-xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all"
        >
            LAUNCH LIVE SESSION
        </button>
    </div>
);


const ClassroomView: React.FC<ClassroomViewProps> = (props) => {
    const { isTeacher, classSession, onStartClass, onJoinClass, notifications, onGoToDashboard, initialWhiteboardState, onWhiteboardUpdate, onUpdateClassSession, onLiveRoomActive, onNavigate, ...restProps } = props;

    const newProposalForStudent = useMemo(() => props.connections.some(c => c.studentId === props.user.id && c.newProposalForStudent), [props.connections, props.user.id]);
    const newSelectionForTeacher = useMemo(() => props.connections.some(c => c.teacherId === props.user.id && c.newSelectionForTeacher), [props.connections, props.user.id]);
    const hasSchedulingUpdate = isTeacher ? newSelectionForTeacher : newProposalForStudent;

    const [activeTab, setActiveTab] = useState<'live' | 'scheduler'>(hasSchedulingUpdate ? 'scheduler' : 'live');
    const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

    // UNREAD CHAT LOGIC FOR TOP NAVIGATION TABS
    const [lastReadChatCount, setLastReadChatCount] = useState(classSession?.chatHistory?.length || 0);

    useEffect(() => {
        if (activeTab === 'live' && classSession) {
            setLastReadChatCount(classSession.chatHistory?.length || 0);
        }
    }, [activeTab, classSession?.chatHistory?.length, classSession]);

    const hasUnreadChat = useMemo(() => {
        if (!classSession) return false;
        return (classSession.chatHistory?.length || 0) > lastReadChatCount && activeTab !== 'live';
    }, [classSession, lastReadChatCount, activeTab]);

    // Fix: Explicitly check if the user is a student and is actually invited to the current session
    const isStudentInvited = useMemo(() => {
        if (!classSession || isTeacher) return false;
        return classSession.studentIds.includes(props.user.id);
    }, [classSession, isTeacher, props.user.id]);

    const classInvite = useMemo(() => notifications.find(n => n.type === 'class_invite' && n.userId === props.user.id && !n.isRead && !n.isDismissed), [notifications, props.user.id]);

    const upcomingEvent = useMemo(() => {
        if (!props.calendarEvents) return null;
        const now = Date.now();
        const thirtyMinutesFromNow = now + 30 * 60 * 1000;
        return props.calendarEvents
            .filter(e => e.participants.some(p => p.userId === props.user.id))
            .filter(e => e.start > now && e.start < thirtyMinutesFromNow)
            .sort((a, b) => a.start - b.start)[0];
    }, [props.calendarEvents, props.user.id]);

    // Handle Live state feedback for sidebar suppression
    useEffect(() => {
        if (onLiveRoomActive) {
            if (activeTab === 'live' && classSession && (isTeacher || isStudentInvited)) {
                onLiveRoomActive(true);
            } else {
                onLiveRoomActive(false);
            }
        }
    }, [activeTab, classSession, onLiveRoomActive, isTeacher, isStudentInvited]);

    const renderLiveContent = () => {
         if (classSession && (isTeacher || isStudentInvited)) {
            return <VirtualClassroom 
                {...restProps} 
                onGoToDashboard={onGoToDashboard} 
                session={classSession} 
                isTeacher={isTeacher} 
                initialWhiteboardState={initialWhiteboardState}
                onWhiteboardUpdate={onWhiteboardUpdate}
                onUpdateSession={onUpdateClassSession}
                onLiveRoomActive={onLiveRoomActive}
            />;
        }
        if (isTeacher) {
            return <TeacherClassroomLobby onStartClass={onStartClass!} />;
        }
        return <StudentClassroomLobby onJoinClass={onJoinClass!} classInvite={classInvite} hasSession={!!classSession && isStudentInvited} />;
    }

    return (
        <div className="h-full flex flex-col">
             <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('live')} className={`${activeTab === 'live' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all relative`}>
                       <ClassroomIcon className="w-5 h-5" /> Live Session
                       <div className="flex items-center gap-1.5 ml-1">
                            {classSession && (isTeacher || isStudentInvited) && (
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse ring-2 ring-white dark:ring-slate-900" title="Session Active"></span>
                            )}
                            {hasUnreadChat && (
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce ring-2 ring-white dark:ring-slate-900" title="Unread Chat"></span>
                            )}
                       </div>
                    </button>
                    <button onClick={() => setActiveTab('scheduler')} className={`${activeTab === 'scheduler' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all`}>
                       <CalendarIcon className="w-5 h-5" /> Scheduler
                       {hasSchedulingUpdate && <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>}
                    </button>
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto mt-4">
                {upcomingEvent && !classSession && !dismissedReminders.has(upcomingEvent.id) && (
                    <UpcomingClassReminder
                        event={upcomingEvent}
                        onClose={() => setDismissedReminders(prev => new Set(prev).add(upcomingEvent.id))}
                    />
                )}
                {activeTab === 'live' && renderLiveContent()}
                {activeTab === 'scheduler' && <SchedulingManager {...props} currentUser={props.user} onNavigate={onNavigate} />}
            </div>
        </div>
    );
};

export default ClassroomView;