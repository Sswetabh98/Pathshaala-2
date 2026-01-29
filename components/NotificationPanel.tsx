import React, { useRef, useEffect, useState } from 'react';
import { Notification, AnnouncementPriority, User } from '../types';
import { XIcon, UsersIcon, ExclamationTriangleIcon, InfoCircleIcon } from './icons/IconComponents';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onConnectionResponse: (notification: Notification, response: 'accepted' | 'rejected') => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onViewAll: () => void;
  onNavigate: (view: string, params?: { userId?: string, subView?: string }) => void;
  onDismissInvite?: (notificationId: string) => void; // Made optional for Admin
}

const priorityStyles: { [key in AnnouncementPriority]: { border: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; iconColor: string } } = {
    normal: { border: '', icon: () => null, iconColor: '' },
    important: { border: 'border-l-4 border-amber-500', icon: InfoCircleIcon, iconColor: 'text-amber-500' },
    urgent: { border: 'border-l-4 border-red-500', icon: ExclamationTriangleIcon, iconColor: 'text-red-500' },
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, user, notifications, setNotifications, onConnectionResponse, anchorRef, onViewAll, onNavigate, onDismissInvite }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: string, left: string } | null>(null);

    const userNotifications = notifications.filter(n => n.userId === user.id);
    const unreadCount = userNotifications.filter(n => !n.isRead).length;
    const sortedNotifications = [...userNotifications].sort((a, b) => b.timestamp - a.timestamp);

    useEffect(() => {
        if (isOpen && anchorRef.current) {
            const calculatePosition = () => {
                if (!anchorRef.current || !panelRef.current) return;
                
                const bellRect = anchorRef.current.getBoundingClientRect();
                const panelRect = panelRef.current.getBoundingClientRect();

                if (panelRect.height === 0 || panelRect.width === 0) {
                    requestAnimationFrame(calculatePosition);
                    return;
                }

                let top = bellRect.bottom + 8;
                let left = bellRect.right - panelRect.width;

                if (left < 16) left = 16;
                if (left + panelRect.width > window.innerWidth - 16) {
                    left = window.innerWidth - panelRect.width - 16;
                }
                
                if (top + panelRect.height > window.innerHeight - 16) {
                    top = bellRect.top - panelRect.height - 8;
                }
                if (top < 16) top = 16;

                setPosition({ top: `${top}px`, left: `${left}px` });
            };
            requestAnimationFrame(calculatePosition);
        }
    }, [isOpen, anchorRef]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current && !panelRef.current.contains(event.target as Node) &&
                anchorRef.current && !anchorRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef]);
    
    const handleMarkAsRead = (notificationId: string) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n));
    };
    
    const handleNavigate = (n: Notification) => {
        handleMarkAsRead(n.id);
        let view: string | null = null;
        let params: { userId?: string, subView?: string } | undefined;
        
        switch(n.type) {
            case 'new_message':
                view = 'messages';
                params = { userId: n.fromUserId };
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
             case 'class_invite':
                if (user.role === 'student') view = 'classroom';
                break;
            case 'class_scheduled':
                if (user.role === 'student' || user.role === 'teacher') {
                    view = 'scheduler';
                }
                break;
            case 'security_alert':
                if (user.role === 'admin') view = 'platform_tools';
                break;
            case 'announcement':
                if (user.role === 'admin') view = 'announcements';
                else view = 'messages'; // For others, it shows in messages
                break;
            case 'insufficient_credits':
                if (user.role === 'student' || user.role === 'parent') {
                    view = 'pricing';
                }
                break;
        }
        
        if (view) {
            onNavigate(view, params);
        }
        onClose();
    };

    const handleViewAllClick = () => {
        onClose();
        onViewAll();
    };

    if (!isOpen) return null;

    return (
      <div
        ref={panelRef}
        className="fixed w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col text-sm animate-scaleIn"
        style={{
            zIndex: 50,
            top: position?.top ?? '-9999px',
            left: position?.left ?? '-9999px',
            visibility: position ? 'visible' : 'hidden'
        }}
      >
        <div className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {sortedNotifications.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto max-h-80">
              {sortedNotifications.slice(0, 10).map(n => {
                const priority = n.priority || 'normal';
                const styles = priorityStyles[priority];
                const Icon = styles.icon;

                return (
                    <div 
                        key={n.id}
                        className={`w-full text-left p-3 border-b border-slate-100 dark:border-slate-700/50 ${!n.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} ${styles.border}`}
                    >
                      <div className="flex items-start gap-2">
                         {priority !== 'normal' && <Icon className={`w-5 h-5 mt-0.5 ${styles.iconColor}`} />}
                         <div className="flex-1 cursor-pointer" onClick={() => handleNavigate(n)}>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{n.title}</p>
                            <p className="text-slate-600 dark:text-slate-400">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                         </div>
                      </div>
                      
                      {n.type === 'connection_request' && !n.isActioned && (
                        <div className="mt-2 flex gap-2 pl-7">
                            <button onClick={(e) => { e.stopPropagation(); onConnectionResponse(n, 'accepted'); }} className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Accept</button>
                            <button onClick={(e) => { e.stopPropagation(); onConnectionResponse(n, 'rejected'); }} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Reject</button>
                        </div>
                      )}
                      {n.type === 'class_invite' && !n.isDismissed && onDismissInvite && (
                        <div className="mt-2 flex gap-2 pl-7">
                            <button onClick={(e) => { e.stopPropagation(); handleNavigate(n); }} className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Join</button>
                            <button onClick={(e) => { e.stopPropagation(); onDismissInvite(n.id); }} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Dismiss</button>
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
             <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs text-indigo-600 hover:underline font-semibold">
                        Mark all as read
                    </button>
                )}
                <button onClick={handleViewAllClick} className="text-xs text-slate-600 dark:text-slate-300 hover:underline font-semibold ml-auto">
                    View All
                </button>
            </div>
          </>
        ) : (
          <div className="p-10 text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-slate-500">You're all caught up!</p>
          </div>
        )}
      </div>
    );
  }

export default NotificationPanel;