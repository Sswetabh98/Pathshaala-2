
import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, Message, ParentProfile, Connection, Announcement, MessageContent, Test } from '../types';
import ChatView from './ChatView';
import ConversationList from './ConversationList';
import AnnouncementsManager from './AnnouncementsManager';

interface MessagingCenterProps {
    currentUser: User;
    allUsers: User[];
    messages: Message[];
    typingUsers: Record<string, boolean>;
    onSendMessage: (receiverId: string, content: MessageContent) => void;
    onDeleteMessage: (messageId: string, type: 'for_me' | 'for_everyone') => void;
    onClearChat: (otherUserId: string) => void;
    onMarkAsRead: (otherUserId: string) => void;
    onTyping: (receiverId: string, isTyping: boolean) => void;
    onReactToMessage: (messageId: string, emoji: string) => void;
    onPinMessage: (connectionId: string, messageId: string | null) => void;
    connections: Connection[];
    announcements?: Announcement[];
    onCreateAnnouncement?: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
    initialChatUserId?: string | null;
    onChatUserSelected?: () => void;
    tests: Test[];
    onNavigate: (view: string, params?: any) => void;
}

const MessagingCenter: FC<MessagingCenterProps> = ({ 
    currentUser, allUsers, messages, typingUsers, onSendMessage, onDeleteMessage, onClearChat,
    onMarkAsRead, onTyping, onReactToMessage, onPinMessage, connections, announcements, 
    onCreateAnnouncement, initialChatUserId, onChatUserSelected, tests, onNavigate
}) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialChatUserId) {
            const userToSelect = allUsers.find(u => u.id === initialChatUserId);
            if (userToSelect) {
                setShowAnnouncements(false);
                setSelectedUser(userToSelect);
                onMarkAsRead(userToSelect.id);
            }
            if (onChatUserSelected) onChatUserSelected();
        }
    }, [initialChatUserId, allUsers, onChatUserSelected, onMarkAsRead]);

    const activeConversationUsers = useMemo(() => {
        const partnerIds = new Set<string>();
        messages.forEach(m => {
            if (m.senderId === currentUser.id) partnerIds.add(m.receiverId);
            else if (m.receiverId === currentUser.id) partnerIds.add(m.senderId);
        });
        allUsers.forEach(u => { if (u.role === 'admin') partnerIds.add(u.id); });
        connections.forEach(c => {
            if (c.status === 'active') {
                if (c.studentId === currentUser.id) partnerIds.add(c.teacherId);
                if (c.teacherId === currentUser.id) partnerIds.add(c.studentId);
            }
        });
        return allUsers.filter(u => partnerIds.has(u.id) && u.id !== currentUser.id);
    }, [allUsers, messages, connections, currentUser.id]);

    const lastMessages = useMemo(() => {
        const lastMsgMap: Record<string, Message> = {};
        messages.forEach(msg => {
            const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (!lastMsgMap[otherUserId] || msg.timestamp > lastMsgMap[otherUserId].timestamp) lastMsgMap[otherUserId] = msg;
        });
        return lastMsgMap;
    }, [messages, currentUser.id]);

    const conversationMessages = useMemo(() => {
        if (!selectedUser) return [];
        return messages.filter(
            msg => (msg.senderId === currentUser.id && msg.receiverId === selectedUser.id) ||
                   (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id)
        ).sort((a, b) => a.timestamp - b.timestamp);
    }, [messages, currentUser.id, selectedUser]);
    
    const selectedConnection = useMemo(() => {
        if (!selectedUser) return null;
        return connections.find(c => 
            (c.status === 'active' &&
            ((c.studentId === currentUser.id && c.teacherId === selectedUser.id) ||
            (c.studentId === selectedUser.id && c.teacherId === currentUser.id)))
        );
    }, [connections, currentUser, selectedUser]);

    return (
        <div className="h-full flex overflow-hidden">
            <aside className={`w-full md:w-96 md:flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 ${selectedUser || showAnnouncements ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList
                    currentUser={currentUser}
                    contacts={activeConversationUsers}
                    newContactSearchResults={[]}
                    selectedUser={selectedUser}
                    showAnnouncements={showAnnouncements}
                    onSelectUser={(u) => { setShowAnnouncements(false); setSelectedUser(u); onMarkAsRead(u.id); }}
                    onSelectAnnouncements={() => { setSelectedUser(null); setShowAnnouncements(true); }}
                    lastMessages={lastMessages}
                    unreadCounts={{}}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    drafts={drafts}
                    announcements={announcements || []}
                />
            </aside>
            <main className={`w-full flex-1 flex-col ${selectedUser || showAnnouncements ? 'flex' : 'hidden md:flex'}`}>
                {selectedUser ? (
                    <ChatView
                        currentUser={currentUser} 
                        otherUser={selectedUser} 
                        messages={conversationMessages}
                        onSendMessage={(c) => { onSendMessage(selectedUser.id, c); setDrafts(prev => ({...prev, [selectedUser.id]: ''})); }}
                        onDeleteMessage={onDeleteMessage} onClearChat={onClearChat}
                        onMarkAsRead={() => onMarkAsRead(selectedUser.id)}
                        onTyping={(t) => onTyping(selectedUser.id, t)}
                        isOtherUserTyping={typingUsers[`${selectedUser.id}_${currentUser.id}`] || false}
                        onReactToMessage={onReactToMessage}
                        onPinMessage={(messageId) => {
                            if (selectedConnection) {
                                onPinMessage(selectedConnection.id, messageId);
                            }
                        }}
                        onBack={() => setSelectedUser(null)} draft={drafts[selectedUser.id] || ''}
                        onDraftChange={(t) => setDrafts(prev => ({...prev, [selectedUser.id]: t}))}
                        connectionId={selectedConnection?.id || ''}
                        pinnedMessageId={selectedConnection?.pinnedMessageId}
                        tests={tests}
                        onNavigate={onNavigate}
                    />
                ) : showAnnouncements && announcements ? (
                    <AnnouncementsManager isReadOnly={true} announcements={announcements} currentUser={currentUser} allUsers={allUsers} onBack={() => setShowAnnouncements(false)} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Select a chat to start messaging</div>
                )}
            </main>
        </div>
    );
};

export default MessagingCenter;
