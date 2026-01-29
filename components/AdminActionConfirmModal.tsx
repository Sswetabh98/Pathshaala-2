import React from 'react';
import { User } from '../types';
import { XIcon, ExclamationTriangleIcon } from './icons/IconComponents';

interface AdminActionConfirmModalProps {
    user: User | null;
    actionText: string;
    actionColor: 'red' | 'green' | 'blue';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const AdminActionConfirmModal: React.FC<AdminActionConfirmModalProps> = ({ user, actionText, actionColor, isOpen, onClose, onConfirm }) => {
    if (!isOpen || !user) return null;

    const colorClasses = {
        red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
        green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', iconBg: 'bg-green-100', iconText: 'text-green-600' },
        blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
    };
    const colors = colorClasses[actionColor];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${colors.iconBg} dark:bg-opacity-20`}>
                        <ExclamationTriangleIcon className={`h-6 w-6 ${colors.iconText}`} />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Confirm Action</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to <span className="font-bold">{actionText.toLowerCase()}</span>?
                    </p>
                </div>
                
                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-left">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-200 text-base font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${colors.bg} text-base font-medium text-white ${colors.hover}`}
                    >
                        {actionText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminActionConfirmModal;