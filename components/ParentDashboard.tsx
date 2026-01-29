
import React, { useState, useMemo } from 'react';
import { User, Message, Notification, Connection, Announcement, AuditLog, Test, MessageContent, ParentProfile, StudentProfile } from '../types';
import { DashboardIcon, MessageIcon, LogoutIcon, SettingsIcon, MenuIcon, XIcon, UserIcon, CreditCardIcon, ChartBarIcon } from './icons/IconComponents';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationBell from './NotificationBell';
import NotificationPanel from './NotificationPanel';
import MessagingCenter from './MessagingCenter';
import SettingsPage from './SettingsPage';

interface ParentDashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  child: User | undefined;
  allUsers: User[];
  messages: Message[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  typingUsers: Record<string, boolean>;
  onSendMessage: (receiverId: string, content: MessageContent) => void;
  onDeleteMessage: (messageId: string, type: 'for_me' | 'for_everyone') => void;
  onClearChat: (otherUserId: string) => void;
  onMarkAsRead: (otherUserId: string) => void;
  onTyping: (receiverId: string, isTyping: boolean) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (connectionId: string, messageId: string | null) => void;
  hasUnreadMessages: boolean;
  connections: Connection[];
  onConnectionResponse: (notification: Notification, response: 'accepted' | 'rejected') => void;
  announcements: Announcement[];
  auditLogs: AuditLog[];
  tests: Test[];
  onMarkReportAsViewed: (studentId: string, reportId: string) => void;
  onDismissClassInvite: (notificationId: string) => void;
  onAppReset: () => void;
  handleWithdrawCredits: (amount: number) => Promise<boolean>;
  onCancelSubscription: (studentId: string) => void;
}

type ParentView = 'dashboard' | 'messages' | 'settings' | 'child_progress' | 'billing';

const ParentDashboard: React.FC<ParentDashboardProps> = ({
  user,
  onLogout,
  onUpdateUser,
  child,
  allUsers,
  messages,
  notifications,
  setNotifications,
  typingUsers,
  onSendMessage,
  onDeleteMessage,
  onClearChat,
  onMarkAsRead,
  onTyping,
  onReactToMessage,
  onPinMessage,
  hasUnreadMessages,
  connections,
  onConnectionResponse,
  announcements,
  auditLogs,
  tests,
  onMarkReportAsViewed,
  onDismissClassInvite,
  onAppReset,
  handleWithdrawCredits,
  onCancelSubscription
}) => {
  const [activeView, setActiveView] = useState<ParentView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'child_progress', label: 'Child Progress', icon: ChartBarIcon },
    { id: 'messages', label: 'Messages', icon: MessageIcon, badge: hasUnreadMessages },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCardIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Parent Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Child Status</h3>
                {child ? (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Name: {child.name}</p>
                    <p className="text-slate-600 dark:text-slate-400">Status: {child.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No child account linked.</p>
                )}
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Recent Notifications</h3>
                <p className="text-slate-600 dark:text-slate-400">You have {notifications.filter(n => !n.isRead).length} unread notifications.</p>
              </div>
            </div>
          </div>
        );
      case 'messages':
        return (
          <MessagingCenter
            currentUser={user}
            connections={connections}
            messages={messages}
            typingUsers={typingUsers}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
            onClearChat={onClearChat}
            onMarkAsRead={onMarkAsRead}
            onTyping={onTyping}
            onReactToMessage={onReactToMessage}
            onPinMessage={onPinMessage}
            onUpdateConnection={(c) => {}} // Placeholder as parent might not update connections directly
          />
        );
      case 'settings':
        return (
          <SettingsPage
            user={user}
            onUpdateUser={onUpdateUser}
            onAppReset={onAppReset}
          />
        );
      case 'child_progress':
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Academic Progress</h3>
                {child ? (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">Detailed reports for {child.name} will appear here.</p>
                        {/* Add more detailed progress visualization here */}
                    </div>
                ) : (
                    <p className="text-slate-500">Link a child account to view progress.</p>
                )}
            </div>
        );
      case 'billing':
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Billing & Subscription</h3>
                <p className="text-slate-600 dark:text-slate-300">Manage your subscription and billing details.</p>
            </div>
        );
      default:
        return <div>Select an item from the menu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Pathshaala
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium">
              Parent
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ParentView);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                    {user.name.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogoutIcon className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="ml-2 lg:ml-0 text-xl font-bold text-slate-800 dark:text-white capitalize">
              {activeView.replace('_', ' ')}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            <div className="relative">
                <NotificationBell 
                    hasUnread={notifications.some(n => !n.isRead)} 
                    onClick={() => setShowNotifications(!showNotifications)} 
                />
                {showNotifications && (
                    <NotificationPanel
                        notifications={notifications}
                        onClose={() => setShowNotifications(false)}
                        onMarkAsRead={() => {
                            const updated = notifications.map(n => ({ ...n, isRead: true }));
                            setNotifications(updated);
                        }}
                        onClearAll={() => setNotifications([])}
                        onDismissInvite={onDismissClassInvite}
                        onConnectionResponse={onConnectionResponse}
                    />
                )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;
