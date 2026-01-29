import React, { useState, useMemo } from 'react';
import { Plan } from '../types';
import { XIcon, LockClosedIcon, CreditCardIcon, SpinnerIcon, CheckCircleIcon } from './icons/IconComponents';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: Plan | null;
    onPaymentSuccess: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, plan, onPaymentSuccess }) => {
    const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvc: '' });
    const [isFlipped, setIsFlipped] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen || !plan) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') {
            formattedValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (name === 'expiry') {
            formattedValue = value.replace(/[^\d]/g, '').replace(/(.{2})/, '$1/').trim().slice(0, 5);
        } else if (name === 'cvc') {
            formattedValue = value.replace(/[^\d]/g, '').slice(0, 3);
        } else if (name === 'name') {
            formattedValue = value.toUpperCase();
        }
        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    };

    const cardType = useMemo(() => {
        if (cardDetails.number.startsWith('4')) return 'VISA';
        if (cardDetails.number.startsWith('5')) return 'MASTERCARD';
        return 'CARD';
    }, [cardDetails.number]);

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
                onPaymentSuccess();
                // Reset state for next time
                setIsSuccess(false);
                setCardDetails({ number: '', name: '', expiry: '', cvc: '' });
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors z-20">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="p-8">
                    {isSuccess ? (
                        <div className="text-center py-12">
                            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto animate-scaleIn" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Payment Successful!</h2>
                            <p className="mt-2 text-slate-500">Your account has been updated.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Secure Checkout</h2>
                            
                            <div className="my-6 card-flipper h-56"
                                onMouseEnter={() => setIsFlipped(true)}
                                onMouseLeave={() => setIsFlipped(false)}
                            >
                                <div className={`card-flipper-inner ${isFlipped ? 'flipped' : ''}`}>
                                    {/* Card Front */}
                                    <div className="card-front bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-8 bg-yellow-400 rounded-md"></div>
                                            <p className="font-mono text-white text-lg font-bold">{cardType}</p>
                                        </div>
                                        <div className="text-white">
                                            <p className="font-mono text-2xl tracking-widest">{cardDetails.number || '#### #### #### ####'}</p>
                                            <div className="flex justify-between items-end mt-4">
                                                <div>
                                                    <p className="text-[8px] uppercase font-bold opacity-70">Card Holder</p>
                                                    <p className="font-mono font-semibold tracking-wider">{cardDetails.name || 'FULL NAME'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] uppercase font-bold opacity-70">Expires</p>
                                                    <p className="font-mono font-semibold">{cardDetails.expiry || 'MM/YY'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Card Back */}
                                    <div className="card-back bg-gradient-to-br from-indigo-500 to-purple-600 p-4 flex flex-col">
                                        <div className="w-full h-10 bg-black mt-4"></div>
                                        <div className="w-full h-8 bg-slate-200 mt-4 flex items-center justify-end pr-4 text-slate-800 italic font-mono">
                                            <p>{cardDetails.cvc.padEnd(3, '*')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <form onSubmit={handlePayment} className="space-y-3">
                                <input name="number" value={cardDetails.number} onChange={handleInputChange} className="input-style" placeholder="Card Number" required />
                                <input name="name" value={cardDetails.name} onChange={handleInputChange} className="input-style" placeholder="Name on Card" required />
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="expiry" value={cardDetails.expiry} onChange={handleInputChange} className="input-style" placeholder="MM/YY" required />
                                    <input name="cvc" value={cardDetails.cvc} onChange={handleInputChange} onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)} className="input-style" placeholder="CVC" required />
                                </div>
                                <button type="submit" disabled={isProcessing} className="w-full btn-primary py-3 text-base">
                                    {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <><LockClosedIcon className="w-5 h-5 mr-2" /> Pay ₹{plan.price} Securely</>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;