
import React from 'react';
import { User, Message, Role, Announcement } from '../types';
import { AnnouncementIcon, ArrowLeftIcon, SearchIcon } from './icons/IconComponents';

interface ConversationListProps {
    currentUser: User;
    contacts: User[];
    newContactSearchResults: User[];
    selectedUser: User | null;
    showAnnouncements: boolean;
    onSelectUser: (user: User) => void;
    onSelectAnnouncements: () => void;
    lastMessages: Record<string, Message>;
    unreadCounts: Record<string, number>;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    drafts: Record<string, string>;
    announcements: Announcement[];
}

const ContactItem: React.FC<{
    user: User;
    lastMessage?: Message;
    unreadCount: number;
    isSelected: boolean;
    onSelect: () => void;
    draftText: string;
}> = ({ user, lastMessage, unreadCount, isSelected, onSelect, draftText }) => {
    return (
        <button onClick={onSelect} className={`w-full text-left p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <div className="relative flex-shrink-0">
                <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${user.isOnline ? 'bg-green-500 animate-pulse-dot' : 'bg-slate-400'}`}></span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                    {lastMessage && !draftText && <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">{new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <div className="flex justify-between items-center mt-1">
                    {draftText ? (
                        <p className="text-sm truncate text-red-600 dark:text-red-400 font-semibold">
                            Draft: <span className="font-normal text-slate-500 dark:text-slate-400">{draftText}</span>
                        </p>
                    ) : (
                         <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {lastMessage ? (
                                lastMessage.senderId === user.id
                                    ? (lastMessage.text || 'Sent an attachment')
                                    : `You: ${lastMessage.text || 'Sent an attachment'}`
                            ) : `Start a conversation with ${user.name}`}
                        </p>
                    )}
                   
                    {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 ml-2">{unreadCount}</span>
                    )}
                </div>
            </div>
        </button>
    );
};


const ConversationList: React.FC<ConversationListProps> = ({
    currentUser,
    contacts,
    newContactSearchResults,
    selectedUser,
    showAnnouncements,
    onSelectUser,
    onSelectAnnouncements,
    lastMessages,
    unreadCounts,
    searchTerm,
    onSearchChange,
    drafts,
    announcements
}) => {
    const latestAnnouncement = announcements?.[0];

    return (
        <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h2>
                <div className="relative mt-3">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search or start new chat..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {currentUser.role === 'admin' ? (
                    <button onClick={onSelectAnnouncements} className={`w-full text-left p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 ${showAnnouncements ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-indigo-500 flex items-center justify-center">
                            <AnnouncementIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Broadcast Announcement</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">View announcement history</p>
                        </div>
                    </button>
                ) : (
                    <button onClick={onSelectAnnouncements} className={`w-full text-left p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 ${showAnnouncements ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-indigo-500 flex items-center justify-center">
                            <AnnouncementIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Broadcast Announcements</p>
                                {latestAnnouncement && <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">{new Date(latestAnnouncement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {latestAnnouncement ? `${latestAnnouncement.title}: ${latestAnnouncement.message}` : 'View platform announcements'}
                            </p>
                        </div>
                    </button>
                )}
                
                {contacts.map(user => (
                    <ContactItem
                        key={user.id}
                        user={user}
                        lastMessage={lastMessages[user.id]}
                        unreadCount={unreadCounts[user.id] || 0}
                        isSelected={selectedUser?.id === user.id}
                        onSelect={() => onSelectUser(user)}
                        draftText={drafts[user.id] || ''}
                    />
                ))}

                {newContactSearchResults.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-400 p-4 pb-2">Start a new conversation</h3>
                        {newContactSearchResults.map(user => (
                             <ContactItem
                                key={user.id}
                                user={user}
                                lastMessage={lastMessages[user.id]}
                                unreadCount={unreadCounts[user.id] || 0}
                                isSelected={selectedUser?.id === user.id}
                                onSelect={() => onSelectUser(user)}
                                draftText={drafts[user.id] || ''}
                            />
                        ))}
                    </div>
                )}

                {searchTerm && contacts.length === 0 && newContactSearchResults.length === 0 && (
                    <p className="text-center text-sm text-slate-500 p-8">No users found for "{searchTerm}"</p>
                )}
            </div>
        </>
    );
};

export default ConversationList;