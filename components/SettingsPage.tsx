import React, { useState, FC, useMemo, useRef, useEffect } from 'react';
import { User, TeacherProfile, StudentProfile, ParentProfile, DeletionInfo, AuditLog, AppearanceSettings, Plan, Notification, Connection } from '../types';
import { generateAvatar } from '../services/geminiService';
import { XIcon, SpinnerIcon, TestIcon, ExclamationTriangleIcon, EyeIcon, EyeOffIcon, FolderOpenIcon, BanknotesIcon, CreditCardIcon, XCircleIcon } from './icons/IconComponents';
import DeleteAccountModal from './DeleteAccountModal';
import SuspendAccountModal from './SuspendAccountModal';
import WithdrawModal from './WithdrawModal';
import TransactionHistoryModal from './TransactionHistoryModal';
import PurchaseModal from './PurchaseModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';

interface SettingsPageProps {
    user: User;
    child?: User; // For parent
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
    auditLogs: AuditLog[];
    onInitiatePurchase?: () => void;
    onWithdrawCredits?: (amountInr: number) => void;
    onCancelSubscription?: (studentId: string) => void;
    subView?: string | null;
    notifications: Notification[];
    connections?: Connection[];
}

const AvatarGeneratorModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (imageUrl: string) => void;
}> = ({ isOpen, onClose, onApply }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for your avatar.');
            return;
        }
        setIsGenerating(true);
        setGeneratedAvatar(null);
        setError(null);
        try {
            const imageUrl = await generateAvatar(prompt);
            setGeneratedAvatar(imageUrl);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (generatedAvatar) {
            onApply(generatedAvatar);
            handleClose();
        }
    };

    const handleClose = () => {
        setPrompt('');
        setGeneratedAvatar(null);
        setIsGenerating(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-scaleIn flex flex-col">
                <button onClick={handleClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">AI Avatar Generator</h2>
                <p className="text-center text-sm text-slate-500 mt-1">Describe the avatar you'd like to create.</p>

                <div className="mt-6 flex items-center gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., a friendly cartoon robot with glasses"
                        className="input-style flex-grow"
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary flex-shrink-0">
                        {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Generate'}
                    </button>
                </div>

                <div className="mt-6 flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg min-h-[200px]">
                    {isGenerating && <SpinnerIcon className="w-12 h-12 text-indigo-500 animate-spin" />}
                    {error && <p className="text-red-500 text-center p-4">{error}</p>}
                    {generatedAvatar && <img src={generatedAvatar} alt="Generated Avatar" className="w-48 h-48 rounded-full object-cover shadow-lg" />}
                    {!isGenerating && !generatedAvatar && !error && (
                        <div className="text-center text-slate-500">
                            <TestIcon className="w-12 h-12 mx-auto text-slate-400" />
                            <p>Your generated avatar will appear here.</p>
                        </div>
                    )}
                </div>

                <button onClick={handleApply} disabled={!generatedAvatar || isGenerating} className="btn-primary w-full mt-6">
                    Apply Avatar
                </button>
            </div>
        </div>
    );
};


const SettingsSection: FC<{ title: string; children: React.ReactNode; headerActions?: React.ReactNode }> = ({ title, children, headerActions }) => (
    <div id={title.toLowerCase().replace(/[\s&]/g, '-')}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h3>
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg shadow-sm">
            {children}
        </div>
    </div>
);

const SettingsPage: FC<SettingsPageProps> = ({ user, child, onUpdateUser, onLogout, auditLogs, onInitiatePurchase, onWithdrawCredits, subView, onCancelSubscription, notifications, connections }) => {
    
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [address, setAddress] = useState((user.profile as StudentProfile | TeacherProfile).address || '');
    const [teacherSubjects, setTeacherSubjects] = useState(user.role === 'teacher' ? (user.profile as TeacherProfile).subjects.join(', ') : '');
    const [teacherExperience, setTeacherExperience] = useState(user.role === 'teacher' ? String((user.profile as TeacherProfile).experience) : '');
    const [teacherQualification, setTeacherQualification] = useState(user.role === 'teacher' ? (user.profile as TeacherProfile).qualification : '');
    const [salaryRange, setSalaryRange] = useState(user.role === 'teacher' ? (user.profile as TeacherProfile).salaryRange : '');
    const [studentGoals, setStudentGoals] = useState(user.role === 'student' ? (user.profile as StudentProfile).learningGoals : '');
    const [studentSubjects, setStudentSubjects] = useState(user.role === 'student' ? (user.profile as StudentProfile).subjectsOfInterest.join(', ') : '');
    
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isParent = user.role === 'parent';
    const isStudent = user.role === 'student';
    const isTeacher = user.role === 'teacher';
    const displayUser = isParent ? child : isStudent ? user : undefined;
    const displayUserProfile = displayUser?.profile as StudentProfile;
    const activeSubscription = displayUserProfile?.activeSubscription;

    const userLogs = useMemo(() => {
        return auditLogs
            .filter(log => log.targetUserId === user.id)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [auditLogs, user.id]);

    const teacherPendingEarnings = useMemo(() => {
        if (!isTeacher || !connections) return 0;
        let total = 0;
        connections.forEach(conn => {
            if (conn.teacherId === user.id && conn.classHistory) {
                total += conn.classHistory.length * ((user.profile as TeacherProfile).perSessionFee || 1500);
            }
        });
        return total;
    }, [isTeacher, connections, user.id, user.profile]);

    const transactionHistory = useMemo(() => {
        const targetUserId = isParent ? user.id : isStudent ? user.id : null;
        if (!targetUserId) return [];
        return notifications
            .filter(n => 
                (n.userId === targetUserId || (isParent && n.userId === child?.id)) &&
                (n.creditChange !== undefined || n.inrChange !== undefined) &&
                ['credit_purchase', 'subscription_renewal', 'class_scheduled', 'credit_withdrawal'].includes(n.type)
            )
            .filter((n, index, self) => 
                isParent ? self.findIndex(t => t.inrChange === n.inrChange && t.creditChange === n.creditChange && Math.abs(t.timestamp - n.timestamp) < 2000) === index : true
            )
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [notifications, user, child, isParent, isStudent]);


    const sections = useMemo(() => {
        const baseSections = [
            { id: 'profile', label: 'Profile' },
            { id: 'appearance', label: 'Appearance' },
        ];
        if (user.role !== 'admin') {
            baseSections.push({ id: 'billing', label: isTeacher ? 'Earnings' : 'Billing & Credits' });
        }
        baseSections.push({ id: 'activity', label: 'Account Activity' });
        if (user.role !== 'admin') {
            baseSections.push({ id: 'account', label: 'Account' });
        }
        return baseSections;
    }, [user.role, isTeacher]);

    const [activeSection, setActiveSection] = useState(subView === 'billing' ? 'billing' : 'profile');

    useEffect(() => {
        if(subView === 'billing') {
            setActiveSection('billing');
            const element = document.getElementById('billing-&-credits');
            element?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [subView]);
    
    const appearanceSettings = useMemo(() => ({
        theme: 'system',
        density: 'comfortable',
        highContrast: false,
        reduceMotion: false,
        ...user.appearance,
    } as AppearanceSettings), [user.appearance]);

    const handleAppearanceChange = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
        onUpdateUser({
            ...user,
            appearance: {
                ...appearanceSettings,
                [key]: value,
            },
        });
    };

    const handleProfileSave = () => {
        let updatedProfile = { ...user.profile };
        if (user.role === 'teacher') {
            (updatedProfile as TeacherProfile).subjects = teacherSubjects.split(',').map(s => s.trim().toUpperCase());
            (updatedProfile as TeacherProfile).experience = parseInt(teacherExperience) || 0;
            (updatedProfile as TeacherProfile).qualification = teacherQualification.toUpperCase();
            (updatedProfile as TeacherProfile).salaryRange = salaryRange.trim();
            (updatedProfile as TeacherProfile).address = address.trim();
        }
        if (user.role === 'student') {
            (updatedProfile as StudentProfile).learningGoals = studentGoals.toUpperCase();
            (updatedProfile as StudentProfile).subjectsOfInterest = studentSubjects.split(',').map(s => s.trim().toUpperCase());
            (updatedProfile as StudentProfile).address = address.trim();
        }
        onUpdateUser({ ...user, name: name.toUpperCase(), email: email.toLowerCase(), profile: updatedProfile });
        alert('Profile updated successfully!');
    };
    
    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ ...user, profilePicUrl: reader.result as string });
                alert('Profile picture updated!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApplyAvatar = (imageUrl: string) => {
        onUpdateUser({ ...user, profilePicUrl: imageUrl });
        alert('AI Avatar applied successfully!');
    };

    const confirmSuspendAccount = () => {
        onUpdateUser({ ...user, profile: { ...user.profile, status: 'suspended', isSuspensionViewed: false } as StudentProfile | TeacherProfile | ParentProfile });
    };
    
    const handleDeleteAccount = () => {
        const deletionInfo: DeletionInfo = {
            markedForDeletionAt: Date.now(),
            deletionDurationMs: 15 * 24 * 60 * 60 * 1000,
            isDeletionViewed: false,
        };
        onUpdateUser({ ...user, profile: { ...user.profile, status: 'deleted', deletionInfo } as StudentProfile | TeacherProfile | ParentProfile });
    };

    const handleConfirmCancel = () => {
        if(child && onCancelSubscription) {
            onCancelSubscription(child.id);
        }
        setIsCancelModalOpen(false);
    };

    const renderActiveSection = () => {
        const profile = user.profile;

        switch (activeSection) {
            case 'profile':
                return (
                     <SettingsSection title="Profile">
                        <div className="space-y-4">
                            <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt="Profile" className="w-20 h-20 rounded-full object-cover"/>
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Upload Image">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </button>
                                </div>
                                <button onClick={() => setIsAvatarModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Generate with AI ✨</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())} className="mt-1 w-full input-style" style={{ textTransform: 'uppercase' }} /></div>
                                <div><label className="block text-sm font-medium">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value.toLowerCase())} className="mt-1 w-full input-style" /></div>
                            </div>
                            {(user.role === 'student' || user.role === 'teacher') && (profile as any).address && (
                                <div>
                                    <label className="block text-sm font-medium">Address (City, State)</label>
                                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g., New Delhi, Delhi" className="mt-1 w-full input-style" />
                                </div>
                            )}
                            {user.role === 'teacher' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><label className="block text-sm font-medium">Experience (Yrs)</label><input type="number" value={teacherExperience} onChange={e => setTeacherExperience(e.target.value)} className="mt-1 w-full input-style" /></div>
                                        <div><label className="block text-sm font-medium">Salary Range (₹)</label><input type="text" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="mt-1 w-full input-style" /></div>
                                        <div className="sm:col-span-3"><label className="block text-sm font-medium">Qualification</label><input type="text" value={teacherQualification} onChange={e => setTeacherQualification(e.target.value.toUpperCase())} className="mt-1 w-full input-style" style={{ textTransform: 'uppercase' }} /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium">Subjects (comma-separated)</label><input type="text" value={teacherSubjects} onChange={e => setTeacherSubjects(e.target.value.toUpperCase())} className="mt-1 w-full input-style" style={{ textTransform: 'uppercase' }} /></div>
                                </>
                            )}
                            {user.role === 'student' && (
                                <>
                                    <div><label className="block text-sm font-medium">Subjects of Interest (comma-separated)</label><input type="text" value={studentSubjects} onChange={e => setStudentSubjects(e.target.value.toUpperCase())} className="mt-1 w-full input-style" style={{ textTransform: 'uppercase' }} /></div>
                                    <div><label className="block text-sm font-medium">Learning Goals</label><textarea value={studentGoals} onChange={e => setStudentGoals(e.target.value.toUpperCase())} rows={3} className="mt-1 w-full input-style" style={{ textTransform: 'uppercase' }} /></div>
                                </>
                            )}
                            <div className="text-right"><button onClick={handleProfileSave} className="btn-primary">Save Profile</button></div>
                        </div>
                    </SettingsSection>
                );
            case 'appearance':
                return (
                     <SettingsSection title="Appearance">
                        <div className="space-y-8">
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">Theme</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Choose how Pathshaala looks to you.</p>
                                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mt-2">
                                    {(['system', 'light', 'dark'] as const).map(t => (<button key={t} onClick={() => handleAppearanceChange('theme', t)} className={`w-full py-1.5 text-sm font-medium rounded-md capitalize transition-colors duration-200 ${appearanceSettings.theme === t ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>{t}</button>))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">UI Density</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the spacing and size of UI elements.</p>
                                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mt-2">
                                    {(['spacious', 'comfortable', 'cozy', 'compact'] as const).map(d => (<button key={d} onClick={() => handleAppearanceChange('density', d)} className={`w-full py-1.5 text-sm font-medium rounded-md capitalize transition-colors duration-200 ${appearanceSettings.density === d ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>{d}</button>))}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">Accessibility</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Make the platform easier to use.</p>
                                <div className="space-y-2 mt-2">
                                    <label className="flex items-center justify-between p-4 rounded-md bg-slate-100 dark:bg-slate-800/50"><span><span className="block font-medium">High Contrast Mode</span><span className="block text-xs text-slate-500">Increase text and background contrast.</span></span><input type="checkbox" className="toggle" checked={appearanceSettings.highContrast} onChange={e => handleAppearanceChange('highContrast', e.target.checked)} /></label>
                                    <label className="flex items-center justify-between p-4 rounded-md bg-slate-100 dark:bg-slate-800/50"><span><span className="block font-medium">Reduce Motion</span><span className="block text-xs text-slate-500">Disable animations and transitions.</span></span><input type="checkbox" className="toggle" checked={appearanceSettings.reduceMotion} onChange={e => handleAppearanceChange('reduceMotion', e.target.checked)} /></label>
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                );
            case 'billing':
                const isManagementView = isParent || isStudent;
                const sectionTitle = isTeacher ? "Earnings Dashboard" : "Billing & Credits";

                const headerActions = (
                    <div className="flex items-center gap-4">
                        {isManagementView && onInitiatePurchase && (
                            <button onClick={onInitiatePurchase} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Buy Credits/Subscription">
                                <CreditCardIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                        {isParent && onWithdrawCredits && (
                             <button onClick={() => setIsWithdrawModalOpen(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Withdraw Credits">
                                <BanknotesIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                        {isManagementView && (
                            <button onClick={() => setIsHistoryModalOpen(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Transaction History">
                                <FolderOpenIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                        {isParent && activeSubscription && (
                            <button onClick={() => setIsCancelModalOpen(true)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Cancel Subscription">
                                <XCircleIcon className="w-6 h-6 text-red-500" />
                            </button>
                        )}
                    </div>
                );
                return (
                    <SettingsSection title={sectionTitle} headerActions={headerActions}>
                         <div className="space-y-6">
                            {isTeacher ? (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Pending Payouts</h4>
                                        <div className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{teacherPendingEarnings.toLocaleString()}
                                        </div>
                                        <p className="text-sm text-slate-500">Accumulated from completed virtual sessions.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Sessions</p>
                                            <p className="text-2xl font-bold mt-1">{(connections?.reduce((acc, c) => acc + (c.classHistory?.length || 0), 0) || 0)}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Session Fee</p>
                                            <p className="text-2xl font-bold mt-1">₹{(user.profile as TeacherProfile).perSessionFee || 1500}</p>
                                        </div>
                                    </div>
                                    <button className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                                        <BanknotesIcon className="w-5 h-5 mr-2" />
                                        Request Payout to Bank Account
                                    </button>
                                </div>
                            ) : (isParent && child) || (isStudent && displayUser) ? (
                                <>
                                    <div>
                                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                                            {displayUser.name}'s Credit Balance
                                        </h4>
                                        <div className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">
                                            {(displayUserProfile.credits || 0).toLocaleString()}
                                            <span className="text-xl font-medium text-slate-500 ml-2">Credits</span>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            (Equivalent to ₹{((displayUserProfile.credits || 0) / 10).toLocaleString()})
                                        </p>
                                    </div>
                                    {activeSubscription ? (
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                                                Active Subscription
                                            </h4>
                                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                                {activeSubscription.planName}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                Renews on {new Date(activeSubscription.nextBillingDate).toLocaleDateString()} for ₹{activeSubscription.price}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center">
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                                No active subscriptions.
                                            </p>
                                            {onInitiatePurchase && <button onClick={onInitiatePurchase} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
                                                View Subscription Plans
                                            </button>}
                                        </div>
                                    )}
                                </>
                            ) : null}
                         </div>
                    </SettingsSection>
                );
            case 'activity':
                return (
                    <SettingsSection title="Account Activity">
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             {userLogs.length > 0 ? (
                                userLogs.map(log => (
                                    <div key={log.id} className="flex items-start space-x-3">
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
                                <p className="text-center text-slate-500 py-10">No recent account activity.</p>
                            )}
                        </div>
                    </SettingsSection>
                );
            case 'account':
                if (user.role === 'admin') return null;
                return (
                    <SettingsSection title="Account">
                        <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/50">
                            <div className="flex items-start">
                                <div className="flex-shrink-0"><ExclamationTriangleIcon className="h-5 w-5 text-red-500" /></div>
                                <div className="ml-3"><h3 className="text-lg font-bold text-red-800 dark:text-red-200">Danger Zone</h3></div>
                            </div>
                            <div className="mt-4 space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">Suspend Account</h4>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1 max-w-md">Temporarily suspend your account. You will be logged out and will need an administrator to regain access.</p>
                                    </div>
                                    <button onClick={() => setIsSuspendModalOpen(true)} className="mt-2 sm:mt-0 flex-shrink-0 px-4 py-2 border border-amber-500 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                                        Suspend My Account
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-red-200 dark:border-red-800 pt-4">
                                    <div>
                                        <h4 className="font-semibold">Delete Account</h4>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1 max-w-md">Permanently delete your account and all associated data after a grace period. This action is irreversible.</p>
                                    </div>
                                    <button onClick={() => setIsDeleteModalOpen(true)} className="mt-2 sm:mt-0 flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors">
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                );
            default:
                return null;
        }
    }


    return (
        <>
            <div className="h-full flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 flex-shrink-0">
                    <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Settings</h2>
                    <nav className="space-y-2">
                        {sections.map(section => (
                            <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-10">
                       {renderActiveSection()}
                    </div>
                </main>
            </div>
            <AvatarGeneratorModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onApply={handleApplyAvatar}/>
            <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} user={user} onDelete={handleDeleteAccount} onLogout={onLogout} />
            <SuspendAccountModal isOpen={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} user={user} onSuspend={confirmSuspendAccount} onLogout={onLogout} />
            {isWithdrawModalOpen && isParent && child && onWithdrawCredits && (
                <WithdrawModal 
                    isOpen={isWithdrawModalOpen}
                    onClose={() => setIsWithdrawModalOpen(false)}
                    studentCredits={displayUserProfile.credits}
                    onWithdraw={onWithdrawCredits}
                />
            )}
            {isHistoryModalOpen && (
                <TransactionHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    transactions={transactionHistory}
                />
            )}
            {isParent && activeSubscription && (
                <CancelSubscriptionModal 
                    isOpen={isCancelModalOpen}
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={handleConfirmCancel}
                    planName={activeSubscription.planName}
                    nextBillingDate={activeSubscription.nextBillingDate}
                />
            )}
            <style>{`.toggle{-webkit-appearance:none;appearance:none;width:40px;height:24px;border-radius:9999px;background-color:#cbd5e1;position:relative;transition:background-color .2s;cursor:pointer}.dark .toggle{background-color:#475569}.toggle:checked{background-color:#4f46e5}.toggle::before{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background-color:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}.toggle:checked::before{transform:translateX(16px)}`}</style>
        </>
    );
};

export default SettingsPage;
