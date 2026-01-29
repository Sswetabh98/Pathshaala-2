import React, { useState, useMemo } from 'react';
import { XIcon, SpinnerIcon, ExclamationTriangleIcon, CurrencyRupeeIcon } from './icons/IconComponents';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentCredits: number;
    onWithdraw: (amountInr: number) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, studentCredits, onWithdraw }) => {
    const [amountInr, setAmountInr] = useState('');
    const [error, setError] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const maxInr = studentCredits / 10;

    const amountInrNum = useMemo(() => {
        const num = parseFloat(amountInr);
        return isNaN(num) ? 0 : num;
    }, [amountInr]);

    const creditsToWithdraw = useMemo(() => amountInrNum * 10, [amountInrNum]);
    const remainingCredits = useMemo(() => studentCredits - creditsToWithdraw, [studentCredits, creditsToWithdraw]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        const value = e.target.value;
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setAmountInr(value);
        }
    };

    const handleWithdraw = () => {
        if (amountInrNum <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (creditsToWithdraw > studentCredits) {
            setError('Withdrawal amount cannot exceed current balance.');
            return;
        }

        setError('');
        setIsWithdrawing(true);
        // Simulate network delay
        setTimeout(() => {
            onWithdraw(amountInrNum);
            setIsWithdrawing(false);
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                        <CurrencyRupeeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Withdraw Credits</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Enter the amount in INR to withdraw. The equivalent credits will be deducted and the amount will be refunded to the original payment method.
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                     <div>
                        <label htmlFor="withdraw-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Amount to Withdraw (INR)
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="withdraw-amount"
                                type="text"
                                inputMode="decimal"
                                value={amountInr}
                                onChange={handleAmountChange}
                                className="input-style w-full pl-10"
                                placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <span className="text-slate-500 sm:text-sm">₹</span>
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button type="button" onClick={() => setAmountInr(String(maxInr))} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                                    MAX
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                    
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Current Balance:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{studentCredits.toLocaleString()} Credits</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">To Withdraw:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">-{creditsToWithdraw.toLocaleString()} Credits</span>
                        </div>
                         <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                            <span className="text-slate-800 dark:text-white">Remaining Balance:</span>
                            <span className="text-slate-800 dark:text-white">{remainingCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                         <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-200 text-base font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || !amountInr || amountInrNum <= 0}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {isWithdrawing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : `Withdraw ₹${amountInrNum.toLocaleString()}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawModal;