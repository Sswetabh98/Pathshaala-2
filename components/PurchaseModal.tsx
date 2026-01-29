import React from 'react';
import { XIcon } from './icons/IconComponents';
import PricingPage from './PricingPage';
import { Plan, User } from '../types';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (plan: Plan) => void;
    child?: User;
    user: User;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSelectPlan, child, user }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-2xl flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Purchase Credits or Subscription</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <PricingPage onSelectPlan={onSelectPlan} child={child} user={user} />
                </div>
            </div>
        </div>
    );
};

export default PurchaseModal;
