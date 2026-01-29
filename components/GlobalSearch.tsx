import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Message, StudentTask } from '../types';
import { SearchIcon, XIcon, UsersIcon, MessageIcon, TestIcon } from './icons/IconComponents';

interface NavItem {
    id: string;
    label: string;
    icon: React.FC<any>;
}

interface SearchResult {
    category: string;
    items: {
        id: string;
        label: string;
        sublabel?: string;
        icon: React.FC<any>;
        onClick: () => void;
    }[];
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    allUsers: User[];
    messages: Message[];
    navItems: NavItem[];
    onNavigate: (view: string, params?: { userId?: string }) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
    isOpen,
    onClose,
    currentUser,
    allUsers,
    messages,
    navItems,
    onNavigate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const searchResults = useMemo((): SearchResult[] => {
        if (!searchTerm.trim()) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const results: SearchResult[] = [];

        // 1. Search Navigation
        const navResults = navItems
            .filter(item => item.label.toLowerCase().includes(lowerCaseSearchTerm))
            .map(item => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                onClick: () => onNavigate(item.id)
            }));
        if (navResults.length > 0) {
            results.push({ category: 'Navigation', items: navResults });
        }
        
        // 2. Search Users (for messaging)
        const userResults = allUsers
            .filter(user => user.id !== currentUser.id && user.name.toLowerCase().includes(lowerCaseSearchTerm))
            .map(user => ({
                id: user.id,
                label: user.name,
                sublabel: user.role,
                icon: UsersIcon,
                onClick: () => onNavigate('messages', { userId: user.id })
            }));
        if (userResults.length > 0) {
            results.push({ category: 'Users', items: userResults });
        }
        
        // 3. Search Messages
        const messagePartners = new Map<string, { user: User, message: Message }>();
        messages.forEach(message => {
            if (message.text && message.text.toLowerCase().includes(lowerCaseSearchTerm)) {
                const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
                if (!messagePartners.has(otherUserId)) {
                    const otherUser = allUsers.find(u => u.id === otherUserId);
                    if (otherUser) {
                        messagePartners.set(otherUserId, { user: otherUser, message });
                    }
                }
            }
        });
        const messageResults = Array.from(messagePartners.values()).map(({ user, message }) => ({
            id: message.id,
            label: `Message with ${user.name}`,
            sublabel: `"...${message.text!.substring(0, 40)}..."`,
            icon: MessageIcon,
            onClick: () => onNavigate('messages', { userId: user.id })
        }));

        if (messageResults.length > 0) {
            results.push({ category: 'Messages', items: messageResults });
        }

        // 4. Search Tasks (if student)
        if (currentUser.role === 'student') {
            const tasks = (currentUser.profile as any).tasks || [];
            const taskResults = tasks
                .filter((task: StudentTask) => task.text.toLowerCase().includes(lowerCaseSearchTerm))
                .map((task: StudentTask) => ({
                    id: task.id,
                    label: task.text,
                    sublabel: task.completed ? 'Completed' : 'Pending',
                    icon: TestIcon,
                    onClick: () => onNavigate('tasks')
                }));
            
            if (taskResults.length > 0) {
                results.push({ category: 'Tasks', items: taskResults });
            }
        }
        
        return results;
    }, [searchTerm, navItems, allUsers, messages, currentUser, onNavigate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto mt-20 animate-scaleIn flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
                    <SearchIcon className="w-6 h-6 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search across Pathshaala..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-lg focus:outline-none text-slate-800 dark:text-white"
                    />
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {searchResults.length > 0 ? (
                        searchResults.map(result => (
                            <div key={result.category}>
                                <h3 className="text-xs font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 sticky top-0">
                                    {result.category}
                                </h3>
                                <ul>
                                    {result.items.map(item => (
                                        <li key={item.id}>
                                            <button onClick={item.onClick} className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
                                                    {item.sublabel && <p className="text-sm text-slate-500 dark:text-slate-400 capitalize truncate">{item.sublabel}</p>}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        searchTerm.trim() && (
                            <p className="text-center text-slate-500 py-10">No results found for "{searchTerm}"</p>
                        )
                    )}
                </div>
                 {searchTerm.trim() === '' && (
                    <div className="p-10 text-center text-slate-400">
                        <p>Search for users, messages, tasks, and more.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
