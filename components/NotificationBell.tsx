import React from 'react';
import { User, Notification } from '../types';
// FIX: Import BellIcon from the central icon components file.
import { BellIcon } from './icons/IconComponents';

interface NotificationBellProps {
    user: User;
    notifications: Notification[];
    onToggle: () => void;
}

const NotificationBell = React.forwardRef<HTMLButtonElement, NotificationBellProps>(
    ({ user, notifications, onToggle }, ref) => {
    
    const unreadCount = notifications.filter(n => n.userId === user.id && !n.isRead).length;

    return (
        <div className="relative">
            <button
                ref={ref}
                onClick={onToggle}
                className={`relative p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${
                    unreadCount > 0 ? 'animate-pulse-glow' : ''
                }`}
                aria-label="Toggle notifications"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
                )}
            </button>
        </div>
    );
});

export default NotificationBell;