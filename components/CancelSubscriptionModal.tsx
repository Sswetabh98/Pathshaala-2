import React from 'react';
import { XIcon, ExclamationTriangleIcon } from './icons/IconComponents';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string;
    nextBillingDate: number;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({ isOpen, onClose, onConfirm, planName, nextBillingDate }) => {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Cancel Subscription</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to cancel your <span className="font-semibold">{planName}</span>?
                    </p>
                    <p className="mt-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                        Your subscription benefits will remain active until the end of the current billing period on {new Date(nextBillingDate).toLocaleDateString()}.
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-200 text-base font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                    >
                        Keep Subscription
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700"
                    >
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelSubscriptionModal;
