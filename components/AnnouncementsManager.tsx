import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Announcement, User, Role, AnnouncementPriority } from '../types';
import { AnnouncementIcon, UsersIcon, ClockIcon, ExclamationTriangleIcon, InfoCircleIcon, XIcon, ArrowLeftIcon, TrashIcon, SpinnerIcon, TestIcon } from './icons/IconComponents';
import { generateAnnouncementTitle } from '../services/geminiService';

interface AnnouncementsManagerProps {
    announcements: Announcement[];
    onCreateAnnouncement?: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
    currentUser: User;
    allUsers: User[];
    onBack?: () => void;
    isReadOnly?: boolean;
    allowFollowUp?: boolean;
}

const RecipientPill: React.FC<{text: string, onRemove: () => void}> = ({text, onRemove}) => (
    <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1">
        <span>{text}</span>
        <button onClick={onRemove} className="text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200"><XIcon className="w-3 h-3" /></button>
    </div>
);

const RecipientSelector: React.FC<{
    allUsers: User[],
    recipientType: 'all' | 'role' | 'individual',
    setRecipientType: (type: 'all' | 'role' | 'individual') => void,
    selectedRoles: Set<Role>,
    handleRoleToggle: (role: Role) => void,
    selectedUsers: Set<string>,
    handleUserToggle: (userId: string) => void,
}> = ({ allUsers, recipientType, setRecipientType, selectedRoles, handleRoleToggle, selectedUsers, handleUserToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const usersForSelection = useMemo(() => {
        const nonAdmins = allUsers.filter(u => u.role !== 'admin');
        if (!userSearch) return nonAdmins;
        return nonAdmins.filter(u => 
            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [allUsers, userSearch]);
    
    const renderSummary = () => {
        if (recipientType === 'all') {
            return <span className="text-slate-500">All Users (Students, Teachers, Parents)</span>;
        }
        const roles = Array.from(selectedRoles);
        const users = allUsers.filter(u => selectedUsers.has(u.id));

        const hasSelection = roles.length > 0 || users.length > 0;
        
        return (
            <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                {roles.map(role => <RecipientPill key={role} text={`${role}s`} onRemove={() => handleRoleToggle(role)} />)}
                {users.map(user => <RecipientPill key={user.id} text={user.name} onRemove={() => handleUserToggle(user.id)} />)}
                {!hasSelection && <span className="text-slate-500">Select recipients...</span>}
            </div>
        )
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Send To</label>
            <div onClick={() => setIsOpen(!isOpen)} className="input-style mt-1 w-full text-left flex justify-between items-center cursor-pointer">
                {renderSummary()}
                <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10 animate-scaleIn">
                    <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-t-lg">
                        {(['all', 'role', 'individual'] as const).map(type => (
                            <button type="button" key={type} onClick={() => setRecipientType(type)} className={`w-full py-1.5 text-sm font-medium rounded-md capitalize transition-colors duration-200 ${recipientType === type ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>{type}</button>
                        ))}
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {recipientType === 'role' && (
                            <div className="space-y-1">
                                {(['student', 'teacher', 'parent'] as Role[]).map(role => (
                                    <label key={role} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                        <input type="checkbox" checked={selectedRoles.has(role)} onChange={() => handleRoleToggle(role)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="ml-3 text-slate-700 dark:text-slate-300 capitalize">{role}s</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {recipientType === 'individual' && (
                            <div className="flex flex-col">
                                <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full p-2 border-b dark:border-slate-700 bg-transparent focus:outline-none text-sm sticky top-0" />
                                <div className="space-y-1 mt-1">
                                    {usersForSelection.map(user => (
                                        <label key={user.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                            <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => handleUserToggle(user.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                            <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-6 h-6 rounded-full mx-2" />
                                            <span className="text-slate-700 dark:text-slate-300 text-sm truncate">{user.name} <span className="text-xs text-slate-400">({user.role})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {recipientType === 'all' && (
                             <p className="p-4 text-center text-sm text-slate-500">The announcement will be sent to all students, teachers, and parents.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({ announcements, onCreateAnnouncement, currentUser, allUsers, onBack, isReadOnly = false, allowFollowUp = false }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [priority, setPriority] = useState<AnnouncementPriority>('normal');
    const [followUpMessage, setFollowUpMessage] = useState('');
    
    const [recipientType, setRecipientType] = useState<'all' | 'role' | 'individual'>('all');
    const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(new Set());
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    const [isTitleGenerating, setIsTitleGenerating] = useState(false);
    const aiTitleGeneratedRef = useRef(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isChatView = isReadOnly || allowFollowUp;

    const displayAnnouncements = useMemo(() => {
        if (isChatView) {
            return [...announcements].sort((a, b) => a.timestamp - b.timestamp);
        }
        return announcements;
    }, [announcements, isChatView]);

    useEffect(() => {
        if (isChatView) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [displayAnnouncements, isChatView]);

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        aiTitleGeneratedRef.current = false; // Reset AI generation flag when user types
    };

    const handleMessageBlur = async () => {
        if (message.trim().split(' ').length > 10 && !title.trim() && !aiTitleGeneratedRef.current && !isReadOnly) {
            setIsTitleGenerating(true);
            try {
                const generatedTitle = await generateAnnouncementTitle(message);
                setTitle(generatedTitle);
                aiTitleGeneratedRef.current = true;
            } catch (e) {
                console.error("Failed to generate title:", e);
            } finally {
                setIsTitleGenerating(false);
            }
        }
    };

    const handleRoleToggle = (role: Role) => {
        const newRoles = new Set(selectedRoles);
        if (newRoles.has(role)) newRoles.delete(role); else newRoles.add(role);
        setSelectedRoles(newRoles);
    };
    
    const handleUserToggle = (userId: string) => {
        const newUsers = new Set(selectedUsers);
        if (newUsers.has(userId)) newUsers.delete(userId); else newUsers.add(userId);
        setSelectedUsers(newUsers);
    };

    const clearForm = () => {
        setTitle('');
        setMessage('');
        setScheduleDate('');
        setScheduleTime('');
        setPriority('normal');
        setRecipientType('all');
        setSelectedRoles(new Set());
        setSelectedUsers(new Set());
        aiTitleGeneratedRef.current = false;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onCreateAnnouncement) return;

        if (!title.trim() || !message.trim()) {
            alert('Please provide both a title and a message.');
            return;
        }

        let recipientIds: string[] | undefined = undefined;
        if (recipientType === 'role') {
            if (selectedRoles.size === 0) { alert('Please select at least one role.'); return; }
            recipientIds = allUsers.filter(u => selectedRoles.has(u.role)).map(u => u.id);
        } else if (recipientType === 'individual') {
             if (selectedUsers.size === 0) { alert('Please select at least one user.'); return; }
            recipientIds = Array.from(selectedUsers);
        }
        
        const scheduleString = scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : '';
        const scheduleTimestamp = scheduleString ? new Date(scheduleString).getTime() : undefined;

        if (scheduleTimestamp && scheduleTimestamp < Date.now()) {
            alert("Scheduled time cannot be in the past.");
            return;
        }

        onCreateAnnouncement({
            title,
            message,
            createdBy: currentUser.name,
            recipientIds,
            scheduledAt: scheduleTimestamp,
            priority,
        });
        
        clearForm();
    };
    
    const handleSendFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onCreateAnnouncement || !followUpMessage.trim()) return;

        onCreateAnnouncement({
            title: "Follow-up",
            message: followUpMessage.trim(),
            createdBy: currentUser.name,
            priority: 'normal',
            isFollowUp: true,
        });
        
        setFollowUpMessage('');
    };

    const clearSchedule = () => {
        setScheduleDate('');
        setScheduleTime('');
    };

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                {onBack && (
                     <button onClick={onBack} className="md:hidden -ml-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                )}
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {isReadOnly ? 'Announcement History' : 'Broadcast Announcements'}
                </h2>
            </header>
            <div className={`grid grid-cols-1 ${!isReadOnly ? 'lg:grid-cols-3' : ''} gap-6 flex-1 min-h-0 ${isReadOnly ? 'p-0' : 'p-6'}`}>
                {!isReadOnly && onCreateAnnouncement && (
                    <div className="lg:col-span-1">
                        <form onSubmit={handleSubmit} className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                            <h3 className="text-xl font-semibold">New Announcement</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                                <div className="relative">
                                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-style mt-1 w-full" />
                                    {isTitleGenerating && <SpinnerIcon className="w-5 h-5 text-indigo-500 animate-spin absolute right-2 top-1/2 -translate-y-1/2 mt-0.5"/>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                                <textarea id="message" value={message} onChange={handleMessageChange} onBlur={handleMessageBlur} required rows={3} className="input-style mt-1" />
                            </div>
                            
                            <RecipientSelector allUsers={allUsers} recipientType={recipientType} setRecipientType={setRecipientType} selectedRoles={selectedRoles} handleRoleToggle={handleRoleToggle} selectedUsers={selectedUsers} handleUserToggle={handleUserToggle} />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mt-1">
                                    {(['normal', 'important', 'urgent'] as const).map(p => (
                                        <button type="button" key={p} onClick={() => setPriority(p)} className={`w-full py-1.5 text-sm font-medium rounded-md capitalize transition-colors duration-200 ${priority === p ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Schedule (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="date" className="text-xs text-slate-500">Date</label>
                                        <input id="date" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="input-style w-full text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="time" className="text-xs text-slate-500">Time</label>
                                        <input id="time" type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="input-style w-full text-sm"/>
                                    </div>
                                </div>
                                {(scheduleDate || scheduleTime) && <button type="button" onClick={clearSchedule} className="text-xs text-indigo-600 hover:underline mt-1">Clear Schedule</button>}
                            </div>
                             <div className="pt-2 flex items-center gap-2">
                                <button type="submit" className="btn-primary flex-grow">
                                    {scheduleDate && scheduleTime ? 'Schedule' : 'Broadcast'}
                                </button>
                                <button type="button" onClick={clearForm} className="btn-secondary flex-shrink-0">
                                    Clear Form
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                <div className={`${!isReadOnly ? 'lg:col-span-2' : 'lg:col-span-3'} ${isChatView ? '' : 'bg-slate-50 dark:bg-slate-900/50'} rounded-lg flex flex-col`}>
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 pr-2">
                         {!isReadOnly && <h3 className="text-xl font-semibold mb-3">History</h3>}
                        {displayAnnouncements.length > 0 ? (
                            displayAnnouncements.map(ann => {
                                const isFollowUp = ann.isFollowUp;
                                return(
                                <div key={ann.id} className={`group relative ${isChatView ? '' : 'bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm'}`}>
                                    {isFollowUp && isChatView ? (
                                        <div className="flex items-start gap-3">
                                            <img src={allUsers.find(u=>u.name === ann.createdBy)?.profilePicUrl || `https://i.pravatar.cc/150?u=admin1`} alt={ann.createdBy} className="w-8 h-8 rounded-full"/>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{ann.createdBy}</p>
                                                <div className="mt-1 bg-slate-200 dark:bg-slate-700 p-3 rounded-lg rounded-tl-none">
                                                    <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{ann.message}</p>
                                                </div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(ann.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-indigo-500">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{ann.title}</p>
                                                <div className="flex items-center gap-2">
                                                    {ann.priority === 'urgent' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400"><ExclamationTriangleIcon className="w-4 h-4"/> URGENT</span>}
                                                    {ann.priority === 'important' && <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400"><InfoCircleIcon className="w-4 h-4"/> IMPORTANT</span>}
                                                </div>
                                            </div>
                                            <p className="text-lg text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{ann.message}</p>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex justify-between items-center">
                                                <span>Sent by {ann.createdBy} on {new Date(ann.timestamp).toLocaleDateString()}</span>
                                                {ann.scheduledAt && <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Scheduled for {new Date(ann.scheduledAt).toLocaleTimeString()}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})
                        ) : (
                            <div className="text-center py-16">
                                <AnnouncementIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="mt-4 text-slate-500">No announcements have been sent yet.</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                     {allowFollowUp && onCreateAnnouncement && (
                        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <form onSubmit={handleSendFollowUp} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={followUpMessage}
                                    onChange={(e) => setFollowUpMessage(e.target.value)}
                                    placeholder="Send a follow-up message to all users..."
                                    className="input-style flex-1"
                                />
                                <button type="submit" disabled={!followUpMessage.trim()} className="btn-primary flex-shrink-0">
                                    Send
                                </button>
                            </form>
                        </footer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsManager;