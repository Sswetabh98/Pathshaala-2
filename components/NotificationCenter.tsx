
import React, { useState, useMemo } from 'react';
import { User, Notification, NotificationType } from '../types';
import { XIcon, SearchIcon, MessageIcon, TestIcon, UsersIcon, ShieldCheckIcon, AnnouncementIcon, TrashIcon, CheckAllIcon, CheckIcon, ClassroomIcon, LinkIcon, CalendarIcon, CurrencyRupeeIcon, CreditCardIcon } from './icons/IconComponents';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onNavigate: (view: string, params?: { userId?: string, subView?: string }) => void;
}

const typeFilters: { id: NotificationType | 'all', label: string }[] = [
    { id: 'new_message', label: 'Messages' },
    { id: 'task_update', label: 'Tasks' },
    { id: 'new_test', label: 'Tests' },
    { id: 'new_report', label: 'Reports' },
    { id: 'connection_request', label: 'Connections' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'security_alert', label: 'Security' },
];

// FIX: Added missing 'credit_withdrawal' property to the typeIcons object to satisfy the NotificationType union.
const typeIcons: { [key in NotificationType]: React.FC<any> } = {
    new_message: MessageIcon,
    task_update: TestIcon,
    connection_request: UsersIcon,
    connection_accepted: UsersIcon,
    security_alert: ShieldCheckIcon,
    announcement: AnnouncementIcon,
    new_test: TestIcon,
    test_submitted: TestIcon,
    new_report: ShieldCheckIcon,
    class_invite: ClassroomIcon,
    new_connection: LinkIcon,
    class_scheduled: CalendarIcon,
    insufficient_credits: MessageIcon, // Re-using icons for new types
    booking_failed_teacher: MessageIcon,
    credit_withdrawal: CurrencyRupeeIcon,
    // FIX: Added missing 'subscription_update' property to satisfy the NotificationType union.
    subscription_update: ShieldCheckIcon,
    credit_purchase: CreditCardIcon,
    subscription_renewal: CreditCardIcon,
    // FIX: Added missing 'escrow_payment_received' property to satisfy the NotificationType union and resolve TS error.
    escrow_payment_received: CurrencyRupeeIcon,
};

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = { Today: [], Yesterday: [], 'Last 7 Days': [], Older: [] };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 6);

  notifications.forEach(n => {
    const nDate = new Date(n.timestamp);
    if (nDate >= today) groups.Today.push(n);
    else if (nDate >= yesterday) groups.Yesterday.push(n);
    else if (nDate >= last7Days) groups['Last 7 Days'].push(n);
    else groups.Older.push(n);
  });
  return groups;
};


const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, user, notifications, setNotifications, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const userNotifications = useMemo(() => {
        return notifications
            .filter(n => n.userId === user.id)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [notifications, user.id]);

    const filteredNotifications = useMemo(() => {
        return userNotifications.filter(n => {
            const filterMatch = activeFilter === 'all' || n.type === activeFilter || (activeFilter === 'connection_request' && n.type === 'connection_accepted');
            const searchMatch = !searchTerm || n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase());
            return filterMatch && searchMatch;
        });
    }, [userNotifications, activeFilter, searchTerm]);

    const groupedNotifications = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);

    const handleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredNotifications.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
        }
    };
    
    const handleMarkSelectedRead = (read: boolean) => {
        setNotifications(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, isRead: read } : n));
        setSelectedIds(new Set());
    };
    
    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} notifications?`)) {
            setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
            setSelectedIds(new Set());
        }
    };

    const handleNavigate = (notification: Notification) => {
        let view: string | null = null;
        let params: { userId?: string; subView?: string } | undefined;
        
        switch(notification.type) {
            case 'new_message':
                view = 'messages';
                params = { userId: notification.fromUserId };
                break;
            case 'connection_request':
                view = 'connections';
                break;
            case 'connection_accepted':
                view = 'connections';
                params = { subView: 'active' };
                break;
            case 'new_connection':
                if (user.role === 'admin') view = 'connections';
                break;
            case 'task_update':
                if (user.role === 'student') view = 'tasks';
                if (user.role === 'teacher') view = 'assign_tasks';
                if (user.role === 'parent') view = 'progress';
                break;
            case 'new_test':
                if (user.role === 'student') {
                    view = 'tests';
                } else if (user.role === 'teacher') {
                    view = 'test_center';
                }
                break;
            case 'test_submitted':
                if (user.role === 'teacher') {
                    view = 'test_center';
                }
                break;
            case 'new_report':
                if (user.role === 'student') {
                    view = 'tasks';
                    params = { subView: 'reports' };
                } else if (user.role === 'parent') {
                    view = 'progress';
                    params = { subView: 'reports' };
                }
                break;
            case 'security_alert':
                if (user.role === 'admin') view = 'platform_tools';
                break;
            case 'announcement':
                if (user.role === 'admin') view = 'announcements';
                 else view = 'messages'; // For others, it shows in messages
                break;
            case 'class_invite':
                if (user.role === 'student') {
                    view = 'classroom';
                }
                break;
            case 'class_scheduled':
                if (user.role === 'student' || user.role === 'teacher') {
                    view = 'scheduler';
                }
                break;
            case 'insufficient_credits':
            case 'credit_purchase':
            case 'subscription_renewal':
            case 'credit_withdrawal':
                if (user.role === 'student' || user.role === 'parent') {
                    view = 'settings';
                    params = { subView: 'billing' };
                }
                break;
        }
        
        if (view) {
            onNavigate(view, params);
        }
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-scaleIn">
                <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Center</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>
                
                <div className="p-4 border-b dark:border-slate-700 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-grow w-full sm:w-auto">
                            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style w-full pl-10" />
                        </div>
                        <div className="flex-shrink-0 overflow-x-auto">
                           <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                                <button onClick={() => setActiveFilter('all')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>All</button>
                                {typeFilters.map(filter => (
                                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeFilter === filter.id ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>{filter.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center">
                        <input id="select-all" type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="select-all" className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                            {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleMarkSelectedRead(true)} disabled={selectedIds.size === 0} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
                            <CheckAllIcon className="w-5 h-5" /> Mark as Read
                        </button>
                        <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
                            <TrashIcon className="w-5 h-5" /> Delete
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                        <div>
                            {Object.entries(groupedNotifications).map(([group, notifs]) => {
                                const notificationsInGroup = notifs as Notification[];
                                if (notificationsInGroup.length === 0) return null;
                                return (
                                <div key={group}>
                                    <h3 className="text-sm font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 sticky top-0 z-10">{group}</h3>
                                    {notificationsInGroup.map(n => {
                                        const Icon = typeIcons[n.type];
                                        return (
                                            <div key={n.id} className={`flex items-start gap-4 p-4 border-b dark:border-slate-700 transition-colors ${!n.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                <input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => handleSelect(n.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1" />
                                                <div className="flex-1 cursor-pointer" onClick={() => handleNavigate(n)}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon className="w-4 h-4 text-slate-500"/>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-slate-500">No notifications match your criteria.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NotificationCenter;
