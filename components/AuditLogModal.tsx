
import React, { FC, useMemo, useEffect } from 'react';
import { User, AuditLog } from '../types';

interface AuditLogModalProps {
    user: User;
    logs: AuditLog[];
    onClose: () => void;
}

const AuditLogModal: FC<AuditLogModalProps> = ({ user, logs, onClose }) => {
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const userLogs = useMemo(() => {
        return logs
            .filter(log => log.targetUserId === user.id)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [logs, user.id]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl animate-scaleIn max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Log</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Showing history for: <span className="font-semibold">{user.name}</span></p>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {userLogs.length > 0 ? (
                        userLogs.map(log => (
                            <div key={log.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {log.action}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {log.details}
                                    </p>
                                     <p className="text-xs text-slate-500 mt-1">
                                        Performed by: {log.adminName}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-10">No logs found for this user.</p>
                    )}
                </div>
                
                 <div className="mt-6 text-right">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogModal;