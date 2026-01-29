
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EyeIcon, EyeOffIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon, ImageFileIcon, ChatBubbleIcon, ClassroomIcon, ClockIcon, InfoCircleIcon, XIcon, BookOpenIcon, PathshaalaLogoIcon, GoogleIcon, CopyIcon } from './icons/IconComponents';
// FIX: Import User, Role, and UserStatus from the corrected types file.
import { User, Role, UserStatus } from '../types';
import { supabase, selfVerifyConnection, verifyPlatformPin } from '../src/utils/supabaseClient';

declare const google: any;

interface LoginPageProps {
  onLogin: (identifier: string, pin: string, remoteUser?: any) => { status: 'success' | 'invalid_credentials' | 'locked' | 'inactive' | 'pin_reset_pending' | 'force_pin_reset' | 'pin_reset_rejected', attempts?: number };
  onGoogleLogin: (email: string) => boolean;
  onNavigateToRegister: () => void;
  allUsers: User[]; 
  setAllUsers: (users: User[]) => void;
  onForgotPassword: (identifier: string, password: string) => Promise<'success' | 'locked' | 'invalid_credentials' | 'pin_reset_pending'>;
  onAcknowledgeApprovedPin: (userId: string) => void;
  onAcknowledgeAdminPinReset: (userId: string) => void;
  onReplaySplash: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ApprovedPinDisplayModal: React.FC<{
    user: User;
    pin: string;
    onClose: () => void;
    onAcknowledge: (userId: string) => void;
    setIdentifierOnPage: (id: string) => void;
    setPinOnPage: (pin: string) => void;
}> = ({ user, pin, onClose, onAcknowledge, setIdentifierOnPage, setPinOnPage }) => {
    const [copySuccess, setCopySuccess] = useState('');
    const platformId = user.studentId || user.teacherId || user.parentId || user.adminId;

    const handleCopyAndContinue = () => {
        if (!platformId) return;
        navigator.clipboard.writeText(pin).then(() => {
            setCopySuccess('Copied & Prefilled!');
            onAcknowledge(user.id);
            setIdentifierOnPage(platformId);
            setPinOnPage(pin);
            setTimeout(() => {
                onClose();
            }, 1000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mt-4">PIN Reset Approved!</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Your new 6-digit PIN is now active. Please copy it and use it to log in.
                </p>
                <div className="my-4 text-center bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                    <p className="text-xs font-semibold text-slate-500">YOUR NEW PIN</p>
                    <p className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 tracking-widest">{pin}</p>
                </div>
                <button onClick={handleCopyAndContinue} className="btn-primary w-full relative">
                    <CopyIcon className="w-5 h-5 mr-2" />
                    {copySuccess || 'Copy PIN & Continue'}
                </button>
            </div>
        </div>
    );
};


// A new component for checking application status
const ApplicationStatusModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
  onAcknowledgeAdminPinReset: (userId: string) => void;
  onAcknowledgeApprovedPin: (userId: string) => void;
  setIdentifierOnPage: (id: string) => void;
  setPinOnPage: (pin: string) => void;
}> = ({ isOpen, onClose, allUsers, onAcknowledgeAdminPinReset, onAcknowledgeApprovedPin, setIdentifierOnPage, setPinOnPage }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ status: UserStatus | 'not_found'; user: User | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsLoading(true);
    setResult(null);
    setTimeout(() => { // Simulate network delay
        const user = allUsers.find(u => 
            (u.email.toLowerCase() === identifier.toLowerCase().trim() || 
             u.name.toLowerCase() === identifier.toLowerCase().trim() ||
             u.phone === identifier.trim()) && 
            u.password === password
        );
      if (user && 'status' in user.profile) {
        const status = (user.profile as any).status;
        setResult({ status, user });
      } else {
        setResult({ status: 'not_found', user: null });
      }
      setIsLoading(false);
    }, 500);
  };
  
  const handleClose = () => {
    setIdentifier('');
    setPassword('');
    setResult(null);
    setIsLoading(false);
    setCopySuccess('');
    onClose();
  };
  
  const handleCopyCredentials = (user: User) => {
      const platformId = user.studentId || user.teacherId || user.parentId || user.adminId;
      if (!platformId || !user.pin) return;
      
      const textToCopy = `Platform ID: ${platformId}, PIN: ${user.pin}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
          setCopySuccess('Copied & Prefilled!');
          setIdentifierOnPage(platformId);
          setPinOnPage(user.pin);
          
          if (user.pinJustResetByAdmin) {
              onAcknowledgeAdminPinReset(user.id);
          }
          if (user.pinJustApproved) {
              onAcknowledgeApprovedPin(user.id);
          }
          
          setTimeout(() => {
              setCopySuccess('');
              handleClose();
          }, 1500);
      }, () => {
          setCopySuccess('Failed to copy');
          setTimeout(() => setCopySuccess(''), 2000);
      });
  };

  if (!isOpen) return null;

  const renderResult = () => {
    if (isLoading) {
        return <div className="flex justify-center items-center h-24"><SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }
    if (!result) return null;

    const { status, user } = result;
    
    let IconComponent, iconColor, title, message;

    if (user?.pinJustResetByAdmin) {
        IconComponent = CheckCircleIcon;
        iconColor = 'text-green-500';
        title = 'Administrator PIN Reset';
        message = (
            <>
                An administrator has reset your PIN for security reasons. Please copy and use your new credentials to log in. This message will only be shown once.
                <div className="mt-3 text-left bg-slate-200 dark:bg-slate-700 p-3 rounded-md text-sm">
                    <p><strong>Platform ID:</strong> {user?.studentId || user?.teacherId || user?.parentId || user?.adminId}</p>
                    <p><strong>NEW 6-Digit PIN:</strong> {user?.pin}</p>
                </div>
                <button onClick={() => user && handleCopyCredentials(user)} className="btn-primary w-full mt-3 py-2 text-sm relative">
                    {copySuccess || 'Acknowledge & Copy Credentials'}
                </button>
            </>
        );
    } else if (user?.pinJustApproved && user.approvedPinToShow) {
        IconComponent = CheckCircleIcon;
        iconColor = 'text-green-500';
        title = 'PIN Reset Approved!';
        message = (
            <>
                Your request for a new PIN has been approved. Please copy your new credentials to log in. This message will only be shown once.
                <div className="mt-3 text-left bg-slate-200 dark:bg-slate-700 p-3 rounded-md text-sm">
                    <p><strong>Platform ID:</strong> {user?.studentId || user?.teacherId || user?.parentId || user?.adminId}</p>
                    <p><strong>NEW 6-Digit PIN:</strong> {user?.approvedPinToShow}</p>
                </div>
                <button onClick={() => user && handleCopyCredentials(user)} className="btn-primary w-full mt-3 py-2 text-sm relative">
                    {copySuccess || 'Acknowledge & Copy Credentials'}
                </button>
            </>
        );
    } else {
        switch (status) {
            case 'pending':
                IconComponent = ClockIcon;
                iconColor = 'text-yellow-500';
                title = 'Status: Pending Review';
                message = 'Your application is still under review by our administrators. Thank you for your patience.';
                break;
            case 'approved':
            case 'active':
                IconComponent = CheckCircleIcon;
                iconColor = 'text-green-500';
                title = 'Application Approved!';
                message = (
                    <>
                        Congratulations! Your credentials are below. You can copy them and paste into the login form.
                        <div className="mt-3 text-left bg-slate-200 dark:bg-slate-700 p-3 rounded-md text-sm">
                            <p><strong>Platform ID:</strong> {user?.studentId || user?.teacherId || user?.parentId || user?.adminId}</p>
                            <p><strong>6-Digit PIN:</strong> {user?.pin}</p>
                        </div>
                        <button onClick={() => user && handleCopyCredentials(user)} className="btn-primary w-full mt-3 py-2 text-sm relative">
                            {copySuccess || 'Copy Credentials'}
                        </button>
                    </>
                );
                break;
            case 'rejected':
                IconComponent = XCircleIcon;
                iconColor = 'text-red-500';
                title = 'Application Not Approved';
                message = 'We regret to inform you that your application was not approved at this time. If you believe this is an error, please contact support.';
                break;
            case 'not_found':
                IconComponent = InfoCircleIcon;
                iconColor = 'text-slate-500';
                title = 'Application Not Found';
                message = 'We could not find an application with those details. Please check your name/email/phone and password.';
                break;
            default:
                 IconComponent = InfoCircleIcon;
                iconColor = 'text-slate-500';
                title = `Status: ${status}`;
                message = `Your account status is currently "${status}". Please contact support if you have questions.`;
        }
    }
    
    return (
        <div className="text-center mt-6 animate-fadeIn">
            <IconComponent className={`w-16 h-16 mx-auto ${iconColor}`} />
            <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
            <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Check Application Status</h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your registration details.</p>
        
        <form onSubmit={handleCheck} className="mt-6 space-y-4">
          <div>
            <label htmlFor="status-identifier" className="sr-only">Name, Email, or Phone</label>
            <input
                id="status-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input-style w-full"
                placeholder="Name, Email, or Phone"
            />
          </div>
          <div>
            <label htmlFor="status-password" className="sr-only">Password</label>
            <input
                id="status-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-style w-full"
                placeholder="Password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-2.5"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Check Status'}
          </button>
        </form>
        
        {renderResult()}
      </div>
    </div>
  );
};

const ForgotPasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onForgotPassword: (identifier: string, password: string) => Promise<'success' | 'locked' | 'invalid_credentials' | 'pin_reset_pending'>;
}> = ({ isOpen, onClose, onForgotPassword }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await onForgotPassword(identifier, password);
        if (result === 'success') {
            handleClose();
        } else if (result === 'locked') {
            setError('This account is currently locked. Please contact an administrator to unlock it.');
        } else if (result === 'pin_reset_pending') {
            setError('A PIN reset for this account is already pending administrator approval. Please wait for confirmation.');
        } else {
            setError('Invalid credentials. Please check your details and try again.');
        }
        setIsLoading(false);
    };

    const handleClose = () => {
        setIdentifier('');
        setPassword('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                <button onClick={handleClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Reset Your PIN</h2>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">Verify your identity to receive a temporary login code.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="forgot-identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform ID, Email, or Phone</label>
                        <input id="forgot-identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="input-style mt-1" />
                    </div>
                    <div>
                        <label htmlFor="forgot-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Password</label>
                        <input id="forgot-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style mt-1" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5">
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Get Temporary Code'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const FeaturesCarousel: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const features = useMemo(() => [
        {
            icon: PathshaalaLogoIcon,
            title: 'Welcome to Pathshaala',
            text: 'A comprehensive educational marketplace connecting teachers with students, enhanced by powerful AI-driven tools.'
        },
        {
            icon: ClassroomIcon,
            title: 'Virtual Classroom',
            text: 'Immerse yourself in our interactive virtual classrooms with digital whiteboards and engaging learning modules.',
        },
        {
            icon: ImageFileIcon,
            title: 'AI Test Generation',
            text: 'Effortlessly generate customized tests. Our AI evaluates responses and provides insightful feedback.',
        },
        {
            icon: ChatBubbleIcon,
            title: 'Seamless Communication',
            text: 'Foster a strong learning community with our integrated messaging system for instant communication.',
        },
    ], []);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % features.length);
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(timer);
    }, [features.length]);

    return (
        <div className="flex flex-col items-center text-center w-full">
            <div className="relative w-16 h-16 bg-white/10 rounded-full mb-4 flex items-center justify-center">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <div key={index} className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}>
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                    );
                })}
            </div>
            
            <div className="relative w-full h-28">
                 {features.map((feature, index) => (
                    <div key={index} className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${index === activeIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                        <p className="mt-1 text-sm text-white/80 max-w-sm mx-auto">{feature.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoogleLogin, onNavigateToRegister, allUsers, setAllUsers, onForgotPassword, onAcknowledgeApprovedPin, onAcknowledgeAdminPinReset, onReplaySplash }) => {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [selectedRole, setSelectedRole] = useState<Role | 'admin'>('admin');
  const validationTimeout = useRef<number | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const formRef = useRef<HTMLFormElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [approvedPinInfo, setApprovedPinInfo] = useState<{user: User; pin: string;} | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const longPressTimer = useRef<number | null>(null);
  const wasLongPress = useRef(false);


  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
        const { left, top } = card.getBoundingClientRect();
        
        // Mouse position relative to the card's top-left corner for glow
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
        card.style.setProperty('--mouse-x', `${mouseX}px`);
        card.style.setProperty('--mouse-y', `${mouseY}px`);
    };

    const container = card.parentElement;
    if (container) {
        container.addEventListener('mousemove', handleMouseMove);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
        };
    }
  }, []);

  const prefillRoles: (Role | 'admin')[] = ['admin', 'teacher', 'student', 'parent'];
  
  const adminUser = useMemo(() => allUsers.find(u => u.role === 'admin'), [allUsers]);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handlePressStart = () => {
    wasLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
        onReplaySplash(); // REPLAY THE WINDOW/RESET
        wasLongPress.current = true;
    }, 2000); // 2 seconds
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (!wasLongPress.current) {
        toggleTheme();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handlePressEnd();
    // If it was a long press, prevent the emulated click event that would incorrectly toggle the theme.
    if (wasLongPress.current) {
        e.preventDefault();
    }
  };


  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        const pastedText = event.clipboardData?.getData('text');
        if (pastedText) {
            const idMatch = pastedText.match(/Platform ID: (.*?),\s*PIN: (.*)/);
            if (idMatch && idMatch[1] && idMatch[2]) {
                event.preventDefault();
                setIdentifier(idMatch[1].trim());
                setPin(idMatch[2].trim());
                setError('');
                setValidationStatus('valid');
            }
        }
    };
    const formElement = formRef.current;
    formElement?.addEventListener('paste', handlePaste);
    return () => formElement?.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    let userForRole;
    if (selectedRole === 'student') {
        userForRole = allUsers.find(u => u.name === 'ANJALI VERMA');
    } else if (selectedRole === 'parent') {
        userForRole = allUsers.find(u => u.name === 'VIKRAM VERMA');
    } else {
        userForRole = allUsers.find(u => u.role === selectedRole);
    }
    
    // Fallback for student
    if (selectedRole === 'student' && !userForRole) {
        userForRole = allUsers.find(u => u.role === 'student');
    }

    if (userForRole) {
        const platformId = userForRole.adminId || userForRole.teacherId || userForRole.studentId || userForRole.parentId;
        if (platformId) {
            setIdentifier(platformId);
            setPin(userForRole.pin); // Pre-fill PIN for demo purposes.
            setError('');
            setValidationStatus('valid');
        }
    }
  }, [selectedRole, allUsers]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) {
                setError('Could not start Google Sign-In. Please try again.');
            }
            // Supabase will redirect; keep minimal UI feedback
        } catch {
            setError('Unexpected error during Google Sign-In. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const rememberedIdentifier = localStorage.getItem('rememberedIdentifier');
        const rememberedPin = localStorage.getItem('rememberedPin');
        if (rememberedIdentifier) {
            setIdentifier(rememberedIdentifier);
            setRememberMe(true);
            validateIdentifier(rememberedIdentifier);
            if (rememberedPin) {
                setPin(rememberedPin);
            }
        }
    }, []);

    const validateIdentifier = (value: string) => {
        if (validationTimeout.current) clearTimeout(validationTimeout.current);
        if (!value) {
            setValidationStatus('idle');
            return;
        }
        validationTimeout.current = window.setTimeout(() => {
            const lowerValue = value.toLowerCase();
            const userExists = allUsers.some(u => 
                (u.studentId && u.studentId.toLowerCase() === lowerValue) ||
                (u.teacherId && u.teacherId.toLowerCase() === lowerValue) ||
                (u.parentId && u.parentId.toLowerCase() === lowerValue) ||
                (u.adminId && u.adminId.toLowerCase() === lowerValue)
            );
            setValidationStatus(userExists ? 'valid' : 'invalid');
        }, 300);
    };

    useEffect(() => {
        if (validationStatus === 'valid') {
            const lowerIdentifier = identifier.toLowerCase();
            const user = allUsers.find(u => 
                (u.studentId && u.studentId.toLowerCase() === lowerIdentifier) ||
                (u.teacherId && u.teacherId.toLowerCase() === lowerIdentifier) ||
                (u.parentId && u.parentId.toLowerCase() === lowerIdentifier) ||
                (u.adminId && u.adminId.toLowerCase() === lowerIdentifier)
            );
            if (user?.pinJustApproved && user.approvedPinToShow) {
                setApprovedPinInfo({ user, pin: user.approvedPinToShow });
            }
        }
    }, [validationStatus, identifier, allUsers]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const ok = await selfVerifyConnection();
            if (!mounted) return;
            setIsSupabaseReady(ok);
            setBackendError(ok ? null : 'Could not connect to backend. Please check network or configuration.');
        })();
        return () => { mounted = false; };
    }, []);

    const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setIdentifier(value);
        setValidationStatus('idle');
        validateIdentifier(value);
    };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setRemainingAttempts(null);
    if (!isSupabaseReady) {
        const ok = await selfVerifyConnection();
        setIsSupabaseReady(ok);
        if (!ok) {
            setBackendError('Could not connect to backend. Please verify .env configuration.');
            setIsLoading(false);
            return;
        } else {
            setBackendError(null);
        }
    }
    try {
        const platformId = identifier.trim();
        const rpcUsers = await verifyPlatformPin(platformId, pin);
        
        if (!rpcUsers || rpcUsers.length === 0) {
             setError('Invalid Platform ID or PIN.');
             setIsLoading(false);
             return;
        }
        
        // Pass the verified user from RPC to the main app handler
        const result = onLogin(identifier, pin, rpcUsers[0]);
        
        if (result.status === 'success' || result.status === 'force_pin_reset') {
            if (rememberMe) {
                localStorage.setItem('rememberedIdentifier', identifier);
                localStorage.setItem('rememberedPin', pin);
            } else {
                localStorage.removeItem('rememberedIdentifier');
                localStorage.removeItem('rememberedPin');
            }
        } else {
            let errorMessage = 'Login succeeded against backend, but local session setup failed.';
            if (result.status === 'invalid_credentials') {
                errorMessage = 'Invalid Platform ID or PIN.'; 
            } else if (result.status === 'locked') {
                errorMessage = 'Account is locked. Try again later.';
            } else if (result.status === 'inactive') {
                errorMessage = 'Account is inactive. Contact support.';
            } else if (result.status === 'pin_reset_pending') {
                errorMessage = 'Your new PIN is pending administrator approval. Please wait for confirmation.';
            } else if (result.status === 'pin_reset_rejected') {
                errorMessage = "Your PIN reset request was rejected by an administrator. Please use 'Forgot your PIN?' to try again or contact support.";
            }
            setError(errorMessage);
        }
    } catch (err) {
        console.error('Login error:', err);
        setError('Unexpected error. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const getIdentifierIcon = () => {
    switch (validationStatus) {
        case 'valid': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'invalid': return <XCircleIcon className="w-5 h-5 text-red-500" />;
        default: return null;
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 dark:from-black dark:via-slate-900 dark:to-black animate-gradient-pan animate-login-page-in">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/50 rounded-full opacity-50 blur-3xl -z-0 animate-blob-float-1"></div>
        <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-indigo-200 dark:bg-indigo-900/60 rounded-full opacity-40 blur-3xl -z-0 animate-blob-float-2"></div>

        <div className="relative w-full max-w-6xl z-10">
            <div
                ref={cardRef}
                className="flex rounded-3xl shadow-2xl overflow-hidden interactive-glow-card"
            >
                <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-8 flex-col">
                    <FeaturesCarousel />
                </div>
                <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-l border-white/20 dark:border-white/10 form-pane ${isFormFocused ? 'form-pane-focused' : ''}`}>
                    <div className="w-full max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpenIcon className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white">Pathshaala</h1>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Welcome Back!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">Sign in to continue your learning journey.</p>
                        
                        <div className="flex justify-center p-1 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4">
                        {prefillRoles.map(role => (
                            <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full py-2 text-sm font-medium rounded-md capitalize transition-all duration-300 ${
                                selectedRole === role ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-slate-600/50'
                            }`}
                            >
                            {role}
                            </button>
                        ))}
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform ID</label>
                                <div className="relative mt-1">
                                    <input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={handleIdentifierChange}
                                        onFocus={() => setIsFormFocused(true)}
                                        onBlur={() => setIsFormFocused(false)}
                                        required
                                        className="input-style w-full pl-4 pr-10 py-2.5"
                                        placeholder="e.g., STU-A1B2C3"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{getIdentifierIcon()}</div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">6-Digit PIN</label>
                                <div className="relative mt-1">
                                    <input
                                        id="pin"
                                        type={showPin ? 'text' : 'password'}
                                        value={pin}
                                        onChange={(e) => { setPin(e.target.value); }}
                                        onFocus={() => setIsFormFocused(true)}
                                        onBlur={() => setIsFormFocused(false)}
                                        required
                                        maxLength={6}
                                        className="input-style w-full pl-4 pr-10 py-2.5"
                                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
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
                            </div>

                             <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded" />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
                                </div>
                                <div className="text-sm">
                                    <button type="button" onClick={() => setIsForgotPinOpen(true)} className="font-medium text-indigo-600 hover:text-indigo-500">Forgot your PIN?</button>
                                </div>
                            </div>
                            
                            {(error || remainingAttempts !== null) && (
                                <div className="space-y-2">
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {remainingAttempts !== null && (
                                        <p className="text-sm text-amber-600 dark:text-amber-500 text-center font-semibold animate-pulse-glow-yellow rounded-md py-1">
                                            You have {remainingAttempts} more attempt{remainingAttempts !== 1 ? 's' : ''} left.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full btn-primary py-2.5 ${isLoading ? 'btn-processing' : ''}`}
                                    style={{ backgroundColor: '#4169E1' }}
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>
                        </form>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-50 text-gray-500 dark:bg-slate-900/80 dark:text-gray-400">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className={`w-full btn-primary py-2.5 ${isLoading ? 'btn-processing' : ''} flex items-center justify-center gap-2`}
                                style={{ backgroundColor: '#4169E1' }}
                                aria-label="Sign in with Google"
                            >
                                <GoogleIcon className="w-5 h-5" />
                                {isLoading ? 'Starting Google...' : 'Sign in with Google'}
                            </button>
                        </div>

                        <div className="mt-4 h-12">
                          {selectedRole !== 'admin' && (
                              <div className="text-sm text-center text-gray-600 dark:text-gray-400 space-y-1">
                                  <p>
                                      Don't have an account?{' '}
                                      <button type="button" onClick={onNavigateToRegister} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
                                          Register here
                                      </button>
                                  </p>
                                  <p>
                                      Waiting for approval?{' '}
                                      <button type="button" onClick={() => setIsStatusModalOpen(true)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
                                          Check your status
                                      </button>
                                  </p>
                              </div>
                          )}
                        </div>
                    </div>
                </div>
            </div>
            
            {adminUser && (
                <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <img
                        onClick={handleClick}
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handleTouchEnd}
                        src={adminUser.profilePicUrl || `https://i.pravatar.cc/150?u=${adminUser.id}`}
                        alt="Admin - Toggle Theme"
                        title="Click to toggle theme. Hold 2s to reset window."
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-black shadow-xl cursor-pointer transition-transform hover:scale-105"
                    />
                </div>
            )}
        </div>
      <ApplicationStatusModal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        allUsers={allUsers} 
        onAcknowledgeAdminPinReset={onAcknowledgeAdminPinReset}
        onAcknowledgeApprovedPin={onAcknowledgeApprovedPin}
        setIdentifierOnPage={setIdentifier}
        setPinOnPage={setPin}
      />
      <ForgotPasswordModal
        isOpen={isForgotPinOpen}
        onClose={() => setIsForgotPinOpen(false)}
        onForgotPassword={onForgotPassword}
      />
       {approvedPinInfo && (
            <ApprovedPinDisplayModal
                user={approvedPinInfo.user}
                pin={approvedPinInfo.pin}
                onClose={() => setApprovedPinInfo(null)}
                onAcknowledge={onAcknowledgeApprovedPin}
                setIdentifierOnPage={setIdentifier}
                setPinOnPage={setPin}
            />
        )}
    </div>
  );
};

export default LoginPage;
