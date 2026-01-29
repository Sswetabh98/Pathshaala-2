import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, SpinnerIcon, ExclamationTriangleIcon, EyeIcon, EyeOffIcon } from './icons/IconComponents';

interface SuspendAccountModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSuspend: () => void;
    onLogout: () => void;
}

const SuspendAccountModal: React.FC<SuspendAccountModalProps> = ({ user, isOpen, onClose, onSuspend, onLogout }) => {
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [isSuspending, setIsSuspending] = useState(false);

    const handleSuspend = () => {
        if (pin !== user.pin) {
            setError('Incorrect PIN. Please try again.');
            return;
        }
        setError('');
        setIsSuspending(true);
        // Simulate network delay
        setTimeout(() => {
            onSuspend();
            setIsSuspending(false);
            handleClose();
            onLogout();
        }, 1000);
    };

    const handleClose = () => {
        setPin('');
        setError('');
        setIsSuspending(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Suspend Account</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        You will be logged out and will need an administrator to reactivate your account. Are you sure you want to proceed?
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                     <div>
                        <label htmlFor="pin-confirm-suspend" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            To confirm, please enter your 6-digit PIN:
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="pin-confirm-suspend"
                                type={showPin ? 'text' : 'password'}
                                maxLength={6}
                                value={pin}
                                onChange={(e) => { setPin(e.target.value); setError(''); }}
                                className="input-style w-full pr-10"
                            />
                            <button
                                type="button"
                                onMouseDown={() => setShowPin(true)}
                                onMouseUp={() => setShowPin(false)}
                                onMouseLeave={() => setShowPin(false)}
                                onTouchStart={(e) => { e.preventDefault(); setShowPin(true); }}
                                onTouchEnd={(e) => { e.preventDefault(); setShowPin(false); }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPin ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <button
                            type="button"
                            onClick={handleClose}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-200 text-base font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSuspend}
                            disabled={isSuspending}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 disabled:bg-amber-400"
                        >
                            {isSuspending ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Suspend Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuspendAccountModal;