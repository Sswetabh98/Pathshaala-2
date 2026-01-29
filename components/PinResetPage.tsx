import React, { useState } from 'react';
import { User } from '../types';
import { EyeIcon, EyeOffIcon, SpinnerIcon } from './icons/IconComponents';

interface PinResetPageProps {
  user: User;
  onPinReset: (userId: string, newPin: string) => void;
  onLogout: () => void;
}

const PinResetPage: React.FC<PinResetPageProps> = ({ user, onPinReset, onLogout }) => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            setError('PIN must be exactly 6 digits.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PINs do not match.');
            return;
        }
        setError('');
        setIsLoading(true);
        // Simulate network request
        setTimeout(() => {
            onPinReset(user.id, newPin);
            // App.tsx will handle logout and redirection
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900 dark:to-gray-800">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl dark:bg-slate-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Reset Your PIN
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Hello {user.name}, please create a new 6-digit PIN for your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="new-pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New 6-Digit PIN</label>
                        <div className="relative mt-1">
                            <input
                                id="new-pin"
                                type={showPin ? 'text' : 'password'}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                required
                                maxLength={6}
                                className="input-style w-full pr-10"
                                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                            />
                             <button type="button" onMouseDown={() => setShowPin(true)} onMouseUp={() => setShowPin(false)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                                {showPin ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirm-pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New PIN</label>
                        <input
                            id="confirm-pin"
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            required
                            maxLength={6}
                            className="input-style w-full mt-1"
                            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Set New PIN'}
                    </button>
                </form>
                <button
                    onClick={onLogout}
                    className="w-full text-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500"
                >
                    Cancel and Logout
                </button>
            </div>
        </div>
    );
};

export default PinResetPage;
