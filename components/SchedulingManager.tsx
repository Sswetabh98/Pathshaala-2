
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Connection, TeacherProfile, CalendarEvent, StudentProfile } from '../types';
import { CheckIcon, CheckCircleIcon, XIcon, SpinnerIcon, CalendarIcon, ClockIcon, ClassroomIcon, CurrencyRupeeIcon, ArrowLeftIcon, ArrowRightIcon, UsersIcon, RefreshIcon, UndoIcon, ShieldCheckIcon, ExclamationTriangleIcon, HandIcon, BanknotesIcon, LockClosedIcon } from './icons/IconComponents';

interface SchedulingManagerProps {
    currentUser: User;
    allUsers: User[];
    connections: Connection[];
    onUpdateUser: (user: User) => void;
    onUpdateConnection: (connection: Connection) => void;
    calendarEvents: CalendarEvent[];
    onConfirmSchedule: (connectionId: string, slotString: string, weekOffset: number) => void;
    onNavigate?: (view: string, params?: any) => void;
}

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, '0')}:00`);

const getTimestampForSlot = (dayName: string, hour: number, weekOffset: number): number => {
    const now = new Date();
    const dayOfWeek = WEEK_DAYS.indexOf(dayName);
    
    // We anchor on Sunday of the week determined by weekOffset
    const anchorDate = new Date();
    anchorDate.setDate(now.getDate() - now.getDay());
    anchorDate.setHours(hour, 0, 0, 0);
    
    const targetDate = new Date(anchorDate);
    targetDate.setDate(anchorDate.getDate() + dayOfWeek + (weekOffset * 7));
    return targetDate.getTime();
};

const getShortDateString = (dayName: string, weekOffset: number) => {
    const timestamp = getTimestampForSlot(dayName, 12, weekOffset);
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onTopUp?: () => void;
    partnerName: string;
    isConfirming: boolean;
    cost: number;
    hasCredits: boolean;
    selectedCount: number;
    uniqueDays: number;
}> = ({ isOpen, onClose, onConfirm, onTopUp, partnerName, isConfirming, cost, hasCredits, selectedCount, uniqueDays }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CurrencyRupeeIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mt-4">Confirm & Pay</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                        You've selected <span className="font-bold text-indigo-600">{selectedCount} slots</span> across <span className="font-bold text-indigo-600">{uniqueDays} session day(s)</span> with <span className="font-semibold">{partnerName}</span>.
                    </p>
                    
                    <div className="my-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Escrow Amount</span>
                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{cost.toLocaleString()} Credits</span>
                        </div>
                        <p className="text-[10px] text-slate-500 text-left leading-relaxed">
                            Payment is locked in escrow for one class per day. Your tutor will finalize exactly one time per day from your selections.
                        </p>
                    </div>

                    {!hasCredits && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div className="text-left">
                                <p className="text-xs font-bold text-red-600">Insufficient Balance</p>
                                <p className="text-[10px] text-red-500 mt-0.5">Please top up your credits to proceed with booking.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 mt-6">
                        {hasCredits ? (
                            <button 
                                onClick={onConfirm} 
                                disabled={isConfirming} 
                                className="btn-primary w-full py-3 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                            >
                                {isConfirming ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Pay & Confirm'}
                            </button>
                        ) : (
                            <button 
                                onClick={onTopUp}
                                className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                            >
                                <BanknotesIcon className="w-5 h-5 mr-2"/>
                                Top Up Credits
                            </button>
                        )}
                        <button onClick={onClose} className="btn-secondary w-full py-2 text-sm border-transparent hover:bg-slate-100">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeacherFinalizeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    studentName: string;
    slotString: string;
}> = ({ isOpen, onClose, onConfirm, studentName, slotString }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mt-4">Finalize Session</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                        You are about to confirm the session with <span className="font-semibold">{studentName}</span> for:
                    </p>
                    
                    <div className="my-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{slotString}</p>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                        Confirming will schedule this class and clear all other options for this day. The student will be notified. This action cannot be undone.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button onClick={onClose} className="btn-secondary w-full py-3">Cancel</button>
                        <button 
                            onClick={onConfirm} 
                            className="btn-primary w-full py-3 bg-green-600 hover:bg-green-700"
                        >
                            Confirm & Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomPartnerSelector: React.FC<{
    partners: User[];
    selectedId: string;
    onSelect: (id: string) => void;
    isTeacher: boolean;
}> = ({ partners, selectedId, onSelect, isTeacher }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedPartner = partners.find(p => p.id === selectedId);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full max-w-xl">
            <button onClick={() => setIsOpen(!isOpen)} className="input-style w-full text-left flex justify-between items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-14 px-5 rounded-2xl shadow-md hover:border-indigo-500 transition-all">
                {selectedPartner ? (
                    <div className="flex items-center gap-4">
                        <img 
                            src={selectedPartner.profilePicUrl || `https://i.pravatar.cc/150?u=${selectedPartner.id}`} 
                            alt={selectedPartner.name} 
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30" 
                        />
                        <div className="min-w-0">
                            <span className="font-extrabold text-base text-slate-800 dark:text-white truncate block">{selectedPartner.name}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Linked {selectedPartner.role}</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400 text-sm font-bold tracking-tight italic">Select student or tutor to schedule sessions...</span>
                )}
                <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg z-[60] max-h-72 overflow-y-auto animate-scaleIn p-1 border-t-4 border-t-indigo-600">
                    {partners.length > 0 ? partners.map(partner => (
                        <button
                            key={partner.id}
                            onClick={() => { onSelect(partner.id); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors rounded-lg"
                        >
                            <img 
                                src={partner.profilePicUrl || `https://i.pravatar.cc/150?u=${partner.id}`} 
                                alt={partner.name} 
                                className="w-8 h-8 rounded-full object-cover" 
                            />
                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate block">{partner.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{partner.role}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {partner.studentId || partner.teacherId}</span>
                                </div>
                            </div>
                        </button>
                    )) : (
                        <div className="p-12 text-center">
                            <UsersIcon className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No Active Connections Found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SchedulingManager: React.FC<SchedulingManagerProps> = ({ currentUser, allUsers, connections, onUpdateUser, onUpdateConnection, calendarEvents, onConfirmSchedule, onNavigate }) => {
    const isTeacher = currentUser.role === 'teacher';
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0); 
    const [slotToConfirm, setSlotToConfirm] = useState<{ day: string; slot: string; } | null>(null);

    const partners = useMemo(() => {
        return connections
            .filter(c => c.status === 'active' && (isTeacher ? c.teacherId === currentUser.id : c.studentId === currentUser.id))
            .map(c => allUsers.find(u => u.id === (isTeacher ? c.studentId : c.teacherId)))
            .filter((u): u is User => !!u);
    }, [connections, allUsers, isTeacher, currentUser.id]);

    const selectedConnection = useMemo(() => {
        if (!selectedPartnerId) return null;
        return connections.find(c => 
            c.status === 'active' &&
            ((isTeacher && c.teacherId === currentUser.id && c.studentId === selectedPartnerId) ||
            (!isTeacher && c.studentId === currentUser.id && c.teacherId === selectedPartnerId))
        );
    }, [connections, selectedPartnerId, currentUser.id, isTeacher]);

    const sessionFee = useMemo(() => {
        if (!selectedPartnerId) return 0;
        const teacher = isTeacher ? currentUser : allUsers.find(u => u.id === selectedPartnerId);
        const profile = teacher?.profile as TeacherProfile;
        return (profile?.perSessionFee || 1500);
    }, [isTeacher, currentUser, allUsers, selectedPartnerId]);

    const selectedCount = (selectedConnection?.studentSelectedSlots || []).reduce((acc, curr) => acc + curr.slots.length, 0);

    const uniqueDaysCount = useMemo(() => {
        if (!selectedConnection?.studentSelectedSlots) return 0;
        const daySet = new Set(selectedConnection.studentSelectedSlots.map(s => `${s.weekOffset}-${s.day}`));
        return daySet.size;
    }, [selectedConnection?.studentSelectedSlots]);

    const totalEscrowCost = useMemo(() => uniqueDaysCount * sessionFee, [uniqueDaysCount, sessionFee]);

    const studentCredits = useMemo(() => {
        const student = isTeacher ? allUsers.find(u => u.id === selectedPartnerId)! : currentUser;
        return (student?.profile as StudentProfile)?.credits || 0;
    }, [isTeacher, allUsers, selectedPartnerId, currentUser]);

    const handleToggleSlot = (day: string, slot: string) => {
        if (!selectedConnection) return;

        const slotTime = getTimestampForSlot(day, parseInt(slot), weekOffset);
        
        // Block interaction if slot has passed
        if (slotTime < Date.now()) return;

        const slotDate = new Date(slotTime);

        const hasSessionOnThisDay = calendarEvents.some(event => {
            if (event.connectionId !== selectedConnection.id) return false;
            return isSameDay(new Date(event.start), slotDate);
        });

        if (hasSessionOnThisDay) {
            alert(`A session is already finalized on this day. Only one session per day is allowed.`);
            return;
        }

        const isProposed = selectedConnection.teacherProposedSlots?.some(s => s.day === day && s.slots.includes(slot) && s.weekOffset === weekOffset);
        if (!isTeacher && !isProposed) return;

        const key = isTeacher ? 'teacherProposedSlots' : 'studentSelectedSlots';
        const currentSlots = (selectedConnection[key] as any[]) || [];
        const daySlotsObj = currentSlots.find(s => s.day === day && s.weekOffset === weekOffset);
        
        let updatedSlots;
        if (daySlotsObj) {
            if (daySlotsObj.slots.includes(slot)) {
                updatedSlots = currentSlots.map(s => (s.day === day && s.weekOffset === weekOffset) ? { ...s, slots: s.slots.filter((x: string) => x !== slot) } : s).filter(s => s.slots.length > 0);
            } else {
                updatedSlots = currentSlots.map(s => (s.day === day && s.weekOffset === weekOffset) ? { ...s, slots: [...s.slots, slot] } : s);
            }
        } else {
            updatedSlots = [...currentSlots, { weekOffset, day, slots: [slot] }];
        }

        const updatedConnection = { 
            ...selectedConnection, 
            [key]: updatedSlots,
            newProposalForStudent: isTeacher ? true : selectedConnection.newProposalForStudent,
            newSelectionForTeacher: !isTeacher ? true : selectedConnection.newSelectionForTeacher,
            isEscrowPaid: !isTeacher ? false : selectedConnection.isEscrowPaid 
        };
        onUpdateConnection(updatedConnection);
    };

    const handleFinalizeSelection = () => {
        if (!selectedConnection) return;
        setIsConfirmModalOpen(true);
    };

    const handleTopUp = () => {
        if (onNavigate) {
            onNavigate('settings', { subView: 'billing' });
            setIsConfirmModalOpen(false);
        }
    };

    const confirmPayment = () => {
        if (!selectedConnection) return;
        
        setIsConfirming(true);
        const student = isTeacher ? allUsers.find(u => u.id === selectedPartnerId)! : currentUser;
        const studentProfile = student.profile as StudentProfile;
        
        const updatedStudent = { 
            ...student, 
            profile: { 
                ...studentProfile, 
                credits: studentProfile.credits - totalEscrowCost 
            } 
        };

        const updatedConnection = { 
            ...selectedConnection, 
            isEscrowPaid: true, 
            newSelectionForTeacher: true 
        };

        setTimeout(() => {
            onUpdateUser(updatedStudent);
            onUpdateConnection(updatedConnection);
            setIsConfirming(false);
            setIsConfirmModalOpen(false);
        }, 1200);
    };

    const handleTeacherFinalize = (day: string, slot: string) => {
        if (!selectedConnection) return;
        const dateStr = getShortDateString(day, weekOffset);
        const slotString = `${day}, ${dateStr} @ ${slot}`;
        onConfirmSchedule(selectedConnection.id, slotString, weekOffset);
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <div className="w-full sm:w-auto">
                    <CustomPartnerSelector partners={partners} selectedId={selectedPartnerId} onSelect={setSelectedPartnerId} isTeacher={isTeacher} />
                </div>
                
                {selectedPartnerId && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm px-5">
                            <div className="flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-slate-700">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                    <CurrencyRupeeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Fee</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{sessionFee.toLocaleString()} CR</p>
                                </div>
                            </div>
                            {!isTeacher && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                                        <BanknotesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Your Credits</p>
                                        <p className={`text-sm font-black ${studentCredits < sessionFee ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{studentCredits.toLocaleString()} CR</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedPartnerId ? (
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-0 animate-fadeIn">
                        <header className="flex-shrink-0 p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                            <div className="flex items-center gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-2xl">
                                <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"><ArrowLeftIcon className="w-4 h-4"/></button>
                                <div className="text-center px-6 min-w-[140px]">
                                    <span className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white">{weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? `+${weekOffset} Week(s)` : `${weekOffset} Week(s)`}</span>
                                </div>
                                <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"><ArrowRightIcon className="w-4 h-4"/></button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-blue-400"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposed</span></div>
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-indigo-500"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected</span></div>
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-emerald-500"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</span></div>
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-amber-500"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finalized</span></div>
                            </div>
                        </header>
                        
                        <div className="flex-1 overflow-x-auto overflow-y-auto participant-list-scrollbar">
                            <table className="w-full border-collapse table-fixed">
                                <thead className="sticky top-0 z-20">
                                    <tr>
                                        <th className="p-3 border-r border-b dark:border-slate-800 bg-slate-100 dark:bg-slate-900 w-20"></th>
                                        {WEEK_DAYS.map(day => {
                                            const dayDate = new Date();
                                            dayDate.setDate(dayDate.getDate() - dayDate.getDay() + WEEK_DAYS.indexOf(day) + (weekOffset * 7));
                                            const label = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            return (
                                                <th key={day} className="p-3 border-b border-r last:border-r-0 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-indigo-600 dark:text-indigo-400">{day.substring(0, 3)}</span>
                                                        <span className="text-[9px] opacity-60 mt-1 font-mono tracking-tighter">{label}</span>
                                                    </div>
                                                </th>
                                            )
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900">
                                    {TIME_SLOTS.map(slot => (
                                        <tr key={slot} className="group">
                                            <td className="p-3 border-r border-b dark:border-slate-800 text-[10px] font-black text-slate-400 text-center bg-slate-50 dark:bg-slate-900/50 sticky left-0 z-10 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors uppercase tracking-widest">{slot}</td>
                                            {WEEK_DAYS.map(day => {
                                                const slotTime = getTimestampForSlot(day, parseInt(slot), weekOffset);
                                                const slotDate = new Date(slotTime);
                                                
                                                // Priority 1: Check if this slot is in the past
                                                const isPast = slotTime < Date.now();

                                                // Priority 2: Robust Date Component Comparison for Finalized Sessions
                                                const isMyFinalized = calendarEvents.some(event => {
                                                    if (event.connectionId !== selectedConnection?.id) return false;
                                                    const eventDate = new Date(event.start);
                                                    return isSameDay(eventDate, slotDate) && eventDate.getHours() === slotDate.getHours();
                                                });

                                                // Priority 3: Other Student's session (Locked)
                                                const isAnyOtherFinalized = !isMyFinalized && calendarEvents.some(event => {
                                                    const eventDate = new Date(event.start);
                                                    return isSameDay(eventDate, slotDate) && eventDate.getHours() === slotDate.getHours();
                                                });

                                                const isProposed = selectedConnection?.teacherProposedSlots?.some(s => s.day === day && s.slots.includes(slot) && s.weekOffset === weekOffset);
                                                const isSelected = selectedConnection?.studentSelectedSlots?.some(s => s.day === day && s.slots.includes(slot) && s.weekOffset === weekOffset);
                                                const isPaid = selectedConnection?.isEscrowPaid && isSelected;
                                                
                                                const canInteract = !isPast && !isMyFinalized && !isAnyOtherFinalized && (isTeacher || isProposed);

                                                return (
                                                    <td 
                                                        key={day} 
                                                        onClick={() => {
                                                            if (!canInteract) return;
                                                            if (isTeacher) {
                                                                if (isPaid) {
                                                                    setSlotToConfirm({ day, slot });
                                                                } else {
                                                                    handleToggleSlot(day, slot);
                                                                }
                                                            } else { // isStudent
                                                                handleToggleSlot(day, slot);
                                                            }
                                                        }}
                                                        className={`p-0 border-r border-b last:border-r-0 dark:border-slate-800 text-center transition-all duration-300 h-14 min-w-[100px] relative overflow-hidden ${
                                                            isMyFinalized
                                                                ? 'bg-amber-500 text-white cursor-default'
                                                                : isPast
                                                                    ? 'bg-slate-100 dark:bg-slate-800/30 cursor-not-allowed opacity-30 grayscale'
                                                                    : isAnyOtherFinalized
                                                                        ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-40'
                                                                        : isPaid 
                                                                            ? 'bg-emerald-500 text-white cursor-pointer shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]' 
                                                                            : isSelected 
                                                                                ? 'bg-indigo-500 text-white cursor-pointer' 
                                                                                : isProposed 
                                                                                    ? 'bg-blue-50 dark:bg-blue-900/10 cursor-pointer' 
                                                                                    : canInteract ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer' : 'cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                                                            {isMyFinalized ? (
                                                                <>
                                                                    <CheckCircleIcon className="w-5 h-5 text-white drop-shadow-lg animate-scaleIn mb-0.5" />
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter drop-shadow-sm">Finalized</span>
                                                                </>
                                                            ) : isPast ? (
                                                                <div className="flex flex-col items-center">
                                                                    <ClockIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 mb-0.5" />
                                                                    <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400">Passed</span>
                                                                </div>
                                                            ) : isAnyOtherFinalized ? (
                                                                <LockClosedIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                            ) : isPaid ? (
                                                                <div className={`p-1.5 rounded-full bg-white/20 text-white ${isTeacher ? 'animate-pulse' : ''}`}>
                                                                    {isTeacher ? <HandIcon className="w-4 h-4" /> : <ShieldCheckIcon className="w-4 h-4" />}
                                                                </div>
                                                            ) : isSelected ? (
                                                                <CheckIcon className="w-6 h-6 text-white drop-shadow-md animate-scaleIn" />
                                                            ) : isProposed ? (
                                                                <div className="w-2 h-2 rounded-full bg-blue-400/80 ring-4 ring-blue-400/10"></div>
                                                            ) : (isTeacher && canInteract) ? (
                                                                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <RefreshIcon className="w-4 h-4 text-indigo-300" />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!isTeacher && selectedCount > 0 && !selectedConnection?.isEscrowPaid && (
                        <div className="flex-shrink-0 mt-4 p-6 bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-2 border-indigo-500 flex flex-col sm:flex-row items-center justify-between gap-6 animate-slide-in relative overflow-hidden z-30">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl shadow-inner">
                                    <ClockIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-none">Confirm and Secure Booking</h4>
                                    <p className="text-sm text-slate-500 font-bold mt-1.5">
                                        Selected: <span className="text-indigo-600">{selectedCount} slots</span> on <span className="text-indigo-600">{uniqueDaysCount} Day(s)</span> • Total Fee: <span className="text-indigo-600">{totalEscrowCost} CR</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleFinalizeSelection}
                                className="w-full sm:w-auto btn-primary py-4 px-10 text-base font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(79,70,229,0.4)] relative z-10 transition-transform active:scale-95"
                            >
                                Pay for {uniqueDaysCount} Session(s)
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-28 text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800/50 animate-fadeIn">
                    <UsersIcon className="w-20 h-20 opacity-10 mb-6" />
                    <h3 className="text-2xl font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Select Partner</h3>
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={isConfirmModalOpen} 
                onClose={() => setIsConfirmModalOpen(false)} 
                onConfirm={confirmPayment} 
                onTopUp={handleTopUp}
                partnerName={allUsers.find(u => u.id === selectedPartnerId)?.name || ''} 
                isConfirming={isConfirming}
                cost={totalEscrowCost}
                hasCredits={studentCredits >= totalEscrowCost}
                selectedCount={selectedCount}
                uniqueDays={uniqueDaysCount}
            />
            <TeacherFinalizeModal
                isOpen={!!slotToConfirm}
                onClose={() => setSlotToConfirm(null)}
                onConfirm={() => {
                    if (slotToConfirm) {
                        handleTeacherFinalize(slotToConfirm.day, slotToConfirm.slot);
                        setSlotToConfirm(null);
                    }
                }}
                studentName={allUsers.find(u => u.id === selectedPartnerId)?.name || ''}
                slotString={slotToConfirm ? `${slotToConfirm.day}, ${getShortDateString(slotToConfirm.day, weekOffset)} @ ${slotToConfirm.slot}` : ''}
            />
        </div>
    );
};

export default SchedulingManager;
