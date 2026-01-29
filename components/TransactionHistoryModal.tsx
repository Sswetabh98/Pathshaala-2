
import React from 'react';
import { Notification, NotificationType } from '../types';
import { XIcon, CreditCardIcon, CalendarIcon, CurrencyRupeeIcon, FolderOpenIcon } from './icons/IconComponents';

const transactionIcons: { [key in NotificationType]?: React.FC<any> } = {
    credit_purchase: CreditCardIcon,
    subscription_renewal: CreditCardIcon,
    class_scheduled: CalendarIcon,
    credit_withdrawal: CurrencyRupeeIcon,
};

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Notification[];
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, transactions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <FolderOpenIcon className="w-6 h-6 text-slate-700 dark:text-slate-300"/>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6 text-slate-500" /></button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                     <div className="space-y-3">
                        {transactions.length > 0 ? transactions.map(n => {
                            const Icon = transactionIcons[n.type];
                            const isCredit = n.creditChange && n.creditChange > 0;
                            return (
                                <div key={n.id} className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {Icon && (
                                            <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                                <Icon className={`w-5 h-5 ${isCredit ? 'text-green-600' : 'text-red-600'}`} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{n.title}</p>
                                            <p className="text-xs text-slate-500">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                            {n.creditChange && n.creditChange > 0 ? '+' : ''}{n.creditChange?.toLocaleString()} credits
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {n.inrChange ? `(${n.inrChange > 0 ? '+' : ''}₹${Math.abs(n.inrChange).toLocaleString()})` : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        }) : <p className="text-sm text-center text-slate-500 py-8">No transactions found.</p>}
                    </div>
                </div>

                <footer className="p-4 flex justify-end gap-3 border-t dark:border-slate-700">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default TransactionHistoryModal;
