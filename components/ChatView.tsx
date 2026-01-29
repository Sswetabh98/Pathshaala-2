
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Message, Test } from '../types';
import EmojiPicker from './EmojiPicker';
import { PaperclipIcon, ReplyIcon, XIcon, ArrowLeftIcon, SmileyIcon, TestIcon, MicIcon, ThumbtackIcon, TrashIcon, DotsVerticalIcon, SpinnerIcon, ShareIcon, InfoCircleIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons/IconComponents';
import LoadingDots from './LoadingDots';
import { MessageContent } from '../types';
import { summarizeConversation } from '../services/geminiService';

interface ChatViewProps {
  currentUser: User; otherUser: User; otherUserSubtext?: string;
  messages: Message[]; onSendMessage: (content: MessageContent) => void;
  onDeleteMessage: (messageId: string, type: 'for_me' | 'for_everyone') => void;
  onClearChat: (otherUserId: string) => void;
  onMarkAsRead: () => void; onTyping: (isTyping: boolean) => void;
  isOtherUserTyping: boolean; onReactToMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string | null) => void; onBack: () => void;
  draft: string; onDraftChange: (text: string) => void;
  connectionId: string; pinnedMessageId?: string;
  tests: Test[];
  onNavigate: (view: string, params?: any) => void;
}

const PinnedMessage: React.FC<{ message: Message; onUnpin: () => void; onJump: () => void }> = ({ message, onUnpin, onJump }) => (
    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 border-b dark:border-slate-700 flex justify-between items-center animate-fadeIn">
        <div className="flex items-center gap-2 min-w-0">
            <ThumbtackIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Pinned Message</p>
                <p onClick={onJump} className="text-sm text-slate-600 dark:text-slate-400 truncate cursor-pointer hover:underline">{message.text}</p>
            </div>
        </div>
        <button onClick={onUnpin} className="p-1 rounded-full hover:bg-black/10" title="Unpin Message"><XIcon className="w-4 h-4 text-slate-500" /></button>
    </div>
);

const MessageMenu: React.FC<{ isSender: boolean; onDeleteMe: () => void; onDeleteEveryone: () => void; onReply: () => void; onPin: () => void; isPinned: boolean; }> = ({ isSender, onDeleteMe, onDeleteEveryone, onReply, onPin, isPinned }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-black/10 rounded-full transition-colors"><DotsVerticalIcon className="w-4 h-4 text-slate-400" /></button>
            {isOpen && (
                <div className={`absolute bottom-full mb-1 ${isSender ? 'right-0' : 'left-0'} w-40 bg-white dark:bg-slate-700 shadow-xl rounded-lg border dark:border-slate-600 z-30 py-1 animate-scaleIn`}>
                    <button onClick={() => { onPin(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2"><ThumbtackIcon className="w-4 h-4" /> {isPinned ? 'Unpin' : 'Pin'}</button>
                    <button onClick={() => { onReply(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2"><ReplyIcon className="w-4 h-4" /> Reply</button>
                    <button onClick={() => { onDeleteMe(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><TrashIcon className="w-4 h-4" /> Delete for me</button>
                    {isSender && <button onClick={() => { onDeleteEveryone(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 font-black hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><TrashIcon className="w-4 h-4" /> Delete for all</button>}
                </div>
            )}
        </div>
    );
};

const ChatView: React.FC<ChatViewProps> = ({ currentUser, otherUser, otherUserSubtext, messages, onSendMessage, onDeleteMessage, onClearChat, onMarkAsRead, onTyping, isOtherUserTyping, onReactToMessage, onPinMessage, onBack, draft, onDraftChange, connectionId, pinnedMessageId, tests, onNavigate }) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const visibleMessages = useMemo(() => messages.filter(m => !(m.deletedForUsers || []).includes(currentUser.id)), [messages, currentUser.id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [visibleMessages]);

    const handleSend = () => {
        if (!draft.trim()) return;
        onSendMessage({ text: draft.trim(), replyTo: replyingTo?.id });
        onDraftChange(''); setReplyingTo(null); onTyping(false);
    };

    const handleSummarize = async () => {
        if (visibleMessages.length < 2) return;
        setIsSummarizing(true);
        try {
            const chatText = visibleMessages.map(m => `${m.senderId === currentUser.id ? 'Me' : otherUser.name}: ${m.text}`).join('\n');
            const result = await summarizeConversation(chatText);
            setSummary(result);
        } catch (e) {
            alert("Failed to summarize.");
        } finally {
            setIsSummarizing(false);
        }
    };
    
    const pinnedMessage = useMemo(() => {
        if (!pinnedMessageId) return null;
        return visibleMessages.find(m => m.id === pinnedMessageId);
    }, [pinnedMessageId, visibleMessages]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800">
            <header className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden p-2 hover:bg-slate-100 rounded-full"><ArrowLeftIcon className="w-6 h-6"/></button>
                    <img src={otherUser.profilePicUrl} className="w-10 h-10 rounded-full object-cover" alt=""/>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white leading-none">{otherUser.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black mt-1">{otherUserSubtext || otherUser.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSummarize} disabled={isSummarizing || visibleMessages.length < 2} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-1.5" title="Summarize with AI">
                        {isSummarizing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <TestIcon className="w-5 h-5" />}
                        <span className="hidden sm:inline text-xs font-bold uppercase">Summarize</span>
                    </button>
                    <button onClick={() => window.confirm('Clear your chat history with this user?') && onClearChat(otherUser.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear Chat">
                        <TrashIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {pinnedMessage && (
                <PinnedMessage 
                    message={pinnedMessage} 
                    onUnpin={() => onPinMessage(null)}
                    onJump={() => {
                        const el = document.getElementById(`msg-${pinnedMessage.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el?.classList.add('animate-highlight-glow');
                        setTimeout(() => el?.classList.remove('animate-highlight-glow'), 2500);
                    }}
                />
            )}

            {summary && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 border-b dark:border-slate-700 relative animate-fadeIn">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase mb-2">
                        <InfoCircleIcon className="w-4 h-4"/> AI Conversation Summary
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">"{summary}"</p>
                    <button onClick={() => setSummary(null)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"><XIcon className="w-4 h-4"/></button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {visibleMessages.map(msg => {
                    const isSender = msg.senderId === currentUser.id;
                    const isDeleted = msg.isDeletedForEveryone;
                    const isWorkAssigned = !!msg.testId;
                    const testExists = isWorkAssigned ? tests.some(t => t.id === msg.testId) : false;

                    return (
                        <div id={`msg-${msg.id}`} key={msg.id} className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`group relative max-w-[80%] flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                                {isWorkAssigned ? (
                                    <div className={`p-4 rounded-2xl shadow-lg border-2 animate-scaleIn ${!testExists ? 'bg-slate-100 border-slate-300' : isSender ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white dark:bg-slate-700 border-indigo-100 dark:border-indigo-800 text-slate-800 dark:text-white rounded-tl-none animate-highlight-glow'}`}>
                                        {!testExists ? (
                                            <div className="flex items-center gap-2 text-slate-500 py-2">
                                                <ExclamationTriangleIcon className="w-5 h-5" />
                                                <p className="text-sm font-bold italic">Assignment Deleted or Unavailable</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                        <BookOpenIcon className={`w-6 h-6 ${isSender ? 'text-white' : 'text-indigo-600'}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isSender ? 'text-white' : 'text-slate-400'}`}>Work Assigned</p>
                                                        <p className="font-bold text-sm leading-tight truncate max-w-[180px]">{msg.text?.replace('Work Assigned: ', '')}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if (isSender) {
                                                            onNavigate('test_center', { testId: msg.testId });
                                                        } else {
                                                            onNavigate('tests', { testId: msg.testId });
                                                        }
                                                    }}
                                                    className={`w-full py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${isSender ? 'bg-white/10 text-white hover:bg-white/20 border border-white/30' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'}`}
                                                >
                                                    {isSender ? 'View Submissions' : 'Start Test Now'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isDeleted ? 'bg-slate-100 italic text-slate-400' : isSender ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                                        {isDeleted ? 'This message was deleted' : msg.text}
                                    </div>
                                )}
                                
                                {!isDeleted && (
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 ${isSender ? '-left-10' : '-right-10'}`}>
                                        <MessageMenu 
                                            isSender={isSender} 
                                            onReply={() => setReplyingTo(msg)} 
                                            onDeleteMe={() => onDeleteMessage(msg.id, 'for_me')} 
                                            onDeleteEveryone={() => onDeleteMessage(msg.id, 'for_everyone')}
                                            onPin={() => onPinMessage(msg.id === pinnedMessageId ? null : msg.id)}
                                            isPinned={msg.id === pinnedMessageId}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t dark:border-slate-700 space-y-3">
                {replyingTo && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center border-l-4 border-indigo-500 animate-fadeIn">
                        <p className="text-xs truncate">Replying to: {replyingTo.text}</p>
                        <XIcon className="w-4 h-4 cursor-pointer" onClick={() => setReplyingTo(null)} />
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                        <input 
                            ref={inputRef} 
                            type="text" 
                            value={draft} 
                            onChange={e => onDraftChange(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleSend()} 
                            placeholder="Message..." 
                            className="input-style flex-1" 
                        />
                        <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"><ShareIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ChatView;
