import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { 
    User, Message, Notification as AppNotification, Connection, 
    AuditLog, Test, CalendarEvent, ClassSession, 
    ClassChatMessage, StudentAnswer, TestAttempt, 
    Role, TeacherProfile, StudentProfile, ParentProfile,
    MessageContent, TestQuestion, SecurityAlert, ReportCard, StudentTask
} from './types';
import { initialUsers, initialMessages, initialNotifications, initialConnections, initialAnnouncements, initialTests } from './initialData';
import { generateId, useLocalStorage } from './utils';
import SplashScreen from './components/SplashScreen';
import AnimatedIntroduction from './components/AnimatedIntroduction';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ErrorBoundary from './components/ErrorBoundary';
import { MediaStreamProvider } from './contexts/MediaStreamContext';
import { generateTestQuestions } from './services/geminiService';
import { supabase } from './src/utils/supabaseClient';

// Lazy Load Dashboards
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard'));
const TeacherDashboard = React.lazy(() => import('./components/TeacherDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const ParentDashboard = React.lazy(() => import('./components/ParentDashboard'));

// Main Application Container
const App: React.FC = () => {
    // State initialization with persistence
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('allUsers', initialUsers);
    const [messages, setMessages] = useLocalStorage<Message[]>('messages', initialMessages);
    const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('notifications', initialNotifications);
    const [connections, setConnections] = useLocalStorage<Connection[]>('connections', initialConnections);
    const [announcements, setAnnouncements] = useLocalStorage('announcements', initialAnnouncements);
    const [auditLogs, setAuditLogs] = useLocalStorage<AuditLog[]>('auditLogs', []);
    const [tests, setTests] = useLocalStorage<Test[]>('tests', initialTests);
    const [calendarEvents, setCalendarEvents] = useLocalStorage<CalendarEvent[]>('calendarEvents', []);
    const [archivedUsers, setArchivedUsers] = useLocalStorage('archivedUsers', []);
    const [securityAlerts, setSecurityAlerts] = useLocalStorage<SecurityAlert[]>('securityAlerts', []);
    
    // Auth and View State
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [activeView, setActiveView] = useLocalStorage<string>('activeView', 'splash');
    const [isSplashExiting, setIsSplashExiting] = useState(false);
    
    // Shared Persistent Class Session State
    const [classSession, setClassSession] = useLocalStorage<ClassSession | null>('classSession', null);

    // AI Tools UI feedback state
    const [aiToolsState, setAiToolsState] = useState({
        generator: { isLoading: false, isCompleted: false, questions: null as TestQuestion[] | null, topic: '' },
        evaluator: { isLoading: false, isCompleted: false, result: null as string | null },
        subjective_grader: { isLoading: false, isCompleted: false, result: null as string | null },
        thinking: { isLoading: false, isCompleted: false, result: null as string | null },
    });

    const [typingUsers] = useState<Record<string, boolean>>({});

    // Master User Sync Handler - Crucial for Student-Teacher Handshake
    const handleUpdateUser = useCallback((updatedUser: User) => {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    }, [currentUser, setCurrentUser, setAllUsers]);

    // SYNC EFFECT: Ensures dashboards always have the latest 'me' data from the global pool
    useEffect(() => {
        if (currentUser) {
            const latest = allUsers.find(u => u.id === currentUser.id);
            if (latest && JSON.stringify(latest) !== JSON.stringify(currentUser)) {
                setCurrentUser(latest);
            }
        }
    }, [allUsers, currentUser, setCurrentUser]);

    useEffect(() => {
        const applySessionUser = async () => {
            const { data } = await supabase.auth.getUser();
            const email = data.user?.email;
            if (email) {
                const match = allUsers.find(u => u.email === email);
                if (match) {
                    setCurrentUser({ ...match, isOnline: true });
                    setActiveView('dashboard');
                }
            }
        };
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.email) {
                const match = allUsers.find(u => u.email === session.user!.email!);
                if (match) {
                    setCurrentUser({ ...match, isOnline: true });
                    setActiveView('dashboard');
                }
            }
        });
        applySessionUser();
        return () => { listener.subscription.unsubscribe(); };
    }, [allUsers]);
    // Security Lapse listener
    useEffect(() => {
        const handleBlur = () => {
            if (currentUser) {
                console.warn("Security Lapse: Focus lost. Screen Capture or Chat Leak potential detected.");
            }
        };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [currentUser]);

    // Splash transition logic
    useEffect(() => {
        if (activeView === 'splash') {
            const timer = setTimeout(() => {
                setIsSplashExiting(true);
                setTimeout(() => {
                    if (currentUser) {
                        setActiveView('dashboard');
                    } else {
                        setActiveView('login');
                    }
                    setIsSplashExiting(false);
                }, 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [activeView, currentUser, setActiveView]);

    const handleAppReset = () => {
        setActiveView('AnimatedIntroduction');
    };

    const handleLogin = (identifier: string, pin: string, remoteUser?: any) => {
        try {
            if (remoteUser) {
                // Map remoteUser (from Supabase RPC) to our User type
                let profile = remoteUser.profile || {};
                // Handle case where profile might be returned as JSON string
                if (typeof profile === 'string') {
                    try { profile = JSON.parse(profile); } catch (e) { console.error('Error parsing profile JSON:', e); }
                }
                // Ensure status exists
                if (!profile.status) profile.status = 'active';

                // Normalize snake_case keys from Postgres to camelCase for TS
                const normalizedUser: User = {
                    id: remoteUser.id,
                    name: remoteUser.name,
                    email: remoteUser.email,
                    phone: remoteUser.phone || '',
                    pin: pin, // Keep current pin
                    password: remoteUser.password || '',
                    role: remoteUser.role,
                    profile: profile,
                    // Handle potentially missing or snake_case ID fields
                    studentId: remoteUser.studentId || remoteUser.student_id,
                    teacherId: remoteUser.teacherId || remoteUser.teacher_id,
                    parentId: remoteUser.parentId || remoteUser.parent_id,
                    adminId: remoteUser.adminId || remoteUser.admin_id,
                    // Handle booleans/timestamps
                    isOnline: true,
                    isLocked: remoteUser.isLocked || remoteUser.is_locked || false,
                    createdAt: remoteUser.createdAt || remoteUser.created_at || Date.now(),
                    loginAttempts: remoteUser.loginAttempts || remoteUser.login_attempts || 0,
                    // Optional fields
                    profilePicUrl: remoteUser.profilePicUrl || remoteUser.profile_pic_url,
                    loginId: remoteUser.loginId || remoteUser.login_id
                };

                // Fallback for ID fields if still missing but needed for UI
                if (normalizedUser.role === 'student' && !normalizedUser.studentId) normalizedUser.studentId = identifier;
                if (normalizedUser.role === 'teacher' && !normalizedUser.teacherId) normalizedUser.teacherId = identifier;
                if (normalizedUser.role === 'parent' && !normalizedUser.parentId) normalizedUser.parentId = identifier;
                if (normalizedUser.role === 'admin' && !normalizedUser.adminId) normalizedUser.adminId = identifier;

                console.log('Rendering dashboard for role:', normalizedUser.role);
                setCurrentUser(normalizedUser);
                setActiveView('dashboard');
                return { status: 'success' as const };
            }

            if (identifier === 'ADM-000001') {
                const adminUser: User = {
                    id: 'admin-rpc',
                    name: 'Administrator',
                    email: 'sswetabh98@gmail.com',
                    phone: '',
                    pin,
                    password: '',
                    role: 'admin',
                    profile: { permissions: ['manage_users', 'view_security_logs'], status: 'active' },
                    adminId: 'ADM-000001',
                    isOnline: true,
                    createdAt: Date.now()
                };
                console.log('Rendering dashboard for role: admin');
                setCurrentUser(adminUser);
                setActiveView('dashboard');
                return { status: 'success' as const };
            }
            return { status: 'invalid_credentials' as const };
        } catch (error) {
            console.error("Login Error:", error);
            return { status: 'invalid_credentials' as const };
        }
    };

    const handleLogout = () => {
        if (currentUser) {
            const updatedUsers = allUsers.map(u => u.id === currentUser.id ? { ...u, isOnline: false } : u);
            setAllUsers(updatedUsers);
        }
        setCurrentUser(null);
        setActiveView('login');
    };

    const handleRegister = (userData: Omit<User, 'id' | 'pin'>) => {
        const newUser: User = {
            ...userData,
            id: generateId(),
            pin: String(Math.floor(100000 + Math.random() * 900000)),
            createdAt: Date.now()
        };
        setAllUsers(prev => [...prev, newUser]);
    };

    // Class Handshake Implementation
    const handleStartClass = (studentIds: string[]) => {
        if (!currentUser) return;
        
        const newSession: ClassSession = {
            id: `session-${generateId()}`,
            teacherId: currentUser.id,
            teacherName: currentUser.name,
            studentIds: studentIds,
            isActive: true,
            startedAt: Date.now(),
            mainView: 'video',
            isMicOn: true,
            isCamOn: true
        };
        
        localStorage.setItem('isTeacherLive', 'true');
        setClassSession(newSession);

        // Notify students immediately via storage-synced notifications
        const newNotifs = studentIds.map(sid => ({
            id: generateId(),
            userId: sid,
            type: 'class_invite' as const,
            title: 'Class Started',
            message: `${currentUser.name} is waiting for you in the Virtual Classroom.`,
            isRead: false,
            timestamp: Date.now(),
            fromUserId: currentUser.id,
            fromUserName: currentUser.name
        }));
        
        setNotifications(prev => [...prev, ...newNotifs]);
    };

    const handleEndClass = (chatHistory: ClassChatMessage[], whiteboardSnapshot: string | null) => {
        if (!classSession) return;

        // Persist session to teacher-student connection history
        const relevantConnection = connections.find(c => 
            c.teacherId === classSession.teacherId && 
            classSession.studentIds.includes(c.studentId)
        );

        if (relevantConnection) {
            const historyEntry = {
                sessionId: classSession.id,
                startedAt: classSession.startedAt,
                endedAt: Date.now(),
                durationMinutes: Math.round((Date.now() - classSession.startedAt) / 60000),
                chatHistory,
                whiteboardSnapshot: whiteboardSnapshot || undefined
            };

            const updatedConnections = connections.map(c => 
                c.id === relevantConnection.id 
                    ? { ...c, classHistory: [...(c.classHistory || []), historyEntry] } 
                    : c
            );
            setConnections(updatedConnections);
        }

        localStorage.removeItem('isTeacherLive');
        setClassSession(null);
    };

    // Task Handshake Logic
    const handleAssignTask = (studentId: string, taskDetails: Omit<StudentTask, 'id' | 'completed' | 'assignedBy' | 'comments'>) => {
        const newTask: StudentTask = {
            ...taskDetails,
            id: generateId(),
            completed: false,
            assignedBy: currentUser?.name || 'Teacher'
        };

        setAllUsers(prev => prev.map(u => {
            if (u.id === studentId) {
                const sp = u.profile as StudentProfile;
                return { ...u, profile: { ...sp, tasks: [...(sp.tasks || []), newTask] } };
            }
            return u;
        }));

        setNotifications(prev => [...prev, {
            id: generateId(),
            userId: studentId,
            type: 'task_update',
            title: 'New Task Assigned',
            message: `${currentUser?.name} has assigned you a new task: ${taskDetails.text}`,
            isRead: false,
            timestamp: Date.now()
        }]);
    };

    const handleGradeTask = (studentId: string, taskId: string, feedback: string, grade: string) => {
        setAllUsers(prev => prev.map(u => {
            if (u.id === studentId) {
                const sp = u.profile as StudentProfile;
                const updatedTasks = (sp.tasks || []).map(t => 
                    t.id === taskId ? { ...t, teacherFeedback: feedback, grade } : t
                );
                return { ...u, profile: { ...sp, tasks: updatedTasks } };
            }
            return u;
        }));

        // Notify Student
        setNotifications(prev => [...prev, {
            id: generateId(),
            userId: studentId,
            type: 'task_update',
            title: 'Task Graded',
            message: `Your task "${feedback.substring(0, 20)}..." has been graded.`,
            isRead: false,
            timestamp: Date.now()
        }]);

        // Notify Parent if linked
        const student = allUsers.find(u => u.id === studentId);
        if (student && (student.profile as StudentProfile).parentId) {
            const parent = allUsers.find(p => p.role === 'parent' && (p.profile as ParentProfile).childStudentId === student.studentId);
            if (parent) {
                setNotifications(prev => [...prev, {
                    id: generateId(),
                    userId: parent.id,
                    type: 'task_update',
                    title: 'Child Progress Updated',
                    message: `${student.name} received a grade of ${grade} from ${currentUser?.name}.`,
                    isRead: false,
                    timestamp: Date.now()
                }]);
            }
        }
    };

    const handleConfirmSchedule = (connectionId: string, slotString: string, weekOffset: number) => {
        const conn = connections.find(c => c.id === connectionId);
        if (!conn) return;

        const teacher = allUsers.find(u => u.id === conn.teacherId);
        const student = allUsers.find(u => u.id === conn.studentId);
        if (!teacher || !student) return;

        const parts = slotString.split(' @ ');
        if (parts.length < 2) return;
        
        const dayPart = parts[0]; 
        const timePart = parts[1]; 
        
        const hour = parseInt(timePart.split(':')[0]);
        const dayName = dayPart.split(', ')[0];
        
        const now = new Date();
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
        
        const anchorDate = new Date();
        anchorDate.setDate(now.getDate() - now.getDay()); 
        anchorDate.setHours(hour, 0, 0, 0);

        const targetDate = new Date(anchorDate);
        targetDate.setDate(anchorDate.getDate() + dayOfWeek + (weekOffset * 7));

        const eventTimestamp = targetDate.getTime();

        const newEvent: CalendarEvent = {
            id: generateId(),
            title: `Session: ${teacher.name} & ${student.name}`,
            start: eventTimestamp,
            end: eventTimestamp + 3600000, 
            participants: [{ userId: teacher.id, name: teacher.name }, { userId: student.id, name: student.name }],
            connectionId: connectionId
        };

        setCalendarEvents(prev => [...prev, newEvent]);
        
        const newAuditLog: AuditLog = {
            id: generateId(),
            timestamp: Date.now(),
            adminId: teacher.id,
            adminName: teacher.name,
            targetUserId: student.id,
            targetUserName: student.name,
            action: 'Session Finalized',
            details: `Confirmed session with ${student.name} for ${slotString}.`
        };
        setAuditLogs(prev => [...prev, newAuditLog]);

        setConnections(prev => prev.map(c => {
            if (c.id === connectionId) {
                return { 
                    ...c, 
                    finalScheduledSlot: slotString, 
                    newSelectionForTeacher: false,
                    newProposalForStudent: false,
                    teacherProposedSlots: (c.teacherProposedSlots || []).filter(s => !(s.day === dayName && s.weekOffset === weekOffset)),
                    studentSelectedSlots: (c.studentSelectedSlots || []).filter(s => !(s.day === dayName && s.weekOffset === weekOffset)),
                    isEscrowPaid: true
                };
            }
            return c;
        }));
        
        const notif: AppNotification = { 
            id: generateId(), 
            userId: student.id, 
            type: 'class_scheduled', 
            title: 'Class Confirmed by Tutor', 
            message: `Your session with ${teacher.name} is now confirmed for ${slotString}. See you in class!`, 
            isRead: false, 
            timestamp: Date.now() 
        };
        setNotifications(prev => [...prev, notif]);
    };

    const handleSendMessage = (receiverId: string, content: MessageContent) => {
        const newMessage: Message = {
            id: generateId(),
            senderId: currentUser?.id || '',
            receiverId,
            timestamp: Date.now(),
            isRead: false,
            isDelivered: true,
            ...content
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleGenerateTest = async (topic: string, numQ: string, type: string, diff: string) => {
        setAiToolsState(s => ({ ...s, generator: { ...s.generator, isLoading: true, topic } }));
        try {
            const questions = await generateTestQuestions(topic, parseInt(numQ), type, diff);
            setAiToolsState(s => ({ ...s, generator: { ...s.generator, isLoading: false, isCompleted: true, questions } }));
        } catch (e) {
            setAiToolsState(s => ({ ...s, generator: { ...s.generator, isLoading: false } }));
        }
    };

    const handleStartTestSession = (attemptId: string) => {
        if (!currentUser) return;
        const profile = currentUser.profile as StudentProfile;
        const updatedAttempts = (profile.testAttempts || []).map(a => 
            a.id === attemptId ? { ...a, status: 'in-progress' as const, startedAt: Date.now(), isViewedByStudent: true } : a
        );
        const updatedUser = { ...currentUser, profile: { ...profile, testAttempts: updatedAttempts } };
        handleUpdateUser(updatedUser);
    };

    const handleUpdateTestAttempt = (attempt: TestAttempt) => {
        if (!currentUser) return;
        const profile = currentUser.profile as StudentProfile;
        const updatedAttempts = (profile.testAttempts || []).map(a => a.id === attempt.id ? attempt : a);
        const updatedUser = { ...currentUser, profile: { ...profile, testAttempts: updatedAttempts } };
        handleUpdateUser(updatedUser);
    };

    const handleSubmitTest = (attemptId: string, answers: StudentAnswer[]) => {
        if (!currentUser) return;
        const profile = currentUser.profile as StudentProfile;
        const attempt = profile.testAttempts?.find(a => a.id === attemptId);
        if (!attempt) return;

        const test = tests.find(t => t.id === attempt.testId);
        if (!test) return;

        let score = 0;
        answers.forEach((ans, idx) => {
            if (test.questions[idx] && ans.answer === test.questions[idx].correctAnswer) {
                score++;
            }
        });

        const updatedAttempt: TestAttempt = {
            ...attempt,
            answers,
            status: 'completed',
            submittedAt: Date.now(),
            score,
            totalQuestions: test.questions.length
        };

        const updatedAttempts = (profile.testAttempts || []).map(a => a.id === attemptId ? updatedAttempt : a);
        const updatedUser = { ...currentUser, profile: { ...profile, testAttempts: updatedAttempts } };
        handleUpdateUser(updatedUser);

        const teacher = allUsers.find(u => u.id === test.teacherId);
        if (teacher) {
            const notif: AppNotification = {
                id: generateId(),
                userId: teacher.id,
                type: 'test_submitted',
                title: 'Test Submitted',
                message: `${currentUser.name} has submitted the test: ${test.title}`,
                isRead: false,
                timestamp: Date.now()
            };
            setNotifications(prev => [...prev, notif]);
        }
    };

    const handleMarkReportAsViewed = (studentId: string, reportId: string) => {
        setAllUsers(prev => prev.map(u => {
            if (u.id === studentId) {
                const profile = u.profile as StudentProfile;
                const updatedReports = (profile.reportCards || []).map(r => 
                    r.id === reportId ? { ...r, isViewedByStudent: true, isViewedByParent: currentUser?.role === 'parent' ? true : r.isViewedByParent } : r
                );
                return { ...u, profile: { ...profile, reportCards: updatedReports } };
            }
            return u;
        }));
        if (currentUser?.id === studentId) {
            const profile = currentUser.profile as StudentProfile;
            const updatedReports = (profile.reportCards || []).map(r => 
                r.id === reportId ? { ...r, isViewedByStudent: true } : r
            );
            handleUpdateUser({ ...currentUser, profile: { ...profile, reportCards: updatedReports } });
        }
    };

    const handleWithdrawCredits = async (amountInr: number): Promise<boolean> => {
        if (!currentUser || currentUser.role !== 'parent') return false;
        const profile = currentUser.profile as ParentProfile;
        const child = allUsers.find(u => u.role === 'student' && u.studentId === profile.childStudentId);
        if (!child) return false;

        const creditToDeduct = amountInr * 10;
        const childProfile = child.profile as StudentProfile;

        if (childProfile.credits < creditToDeduct) {
            alert("Insufficient credits in child's account.");
            return false;
        }

        const updatedChild: User = {
            ...child,
            profile: { ...childProfile, credits: childProfile.credits - creditToDeduct }
        };

        handleUpdateUser(updatedChild);

        const notif: AppNotification = {
            id: generateId(),
            userId: currentUser.id,
            type: 'credit_withdrawal',
            title: 'Withdrawal Successful',
            message: `₹${amountInr.toLocaleString()} worth of credits (${creditToDeduct.toLocaleString()}) withdrawn from ${child.name}'s account.`,
            isRead: false,
            timestamp: Date.now(),
            inrChange: -amountInr,
            creditChange: -creditToDeduct
        };
        setNotifications(prev => [...prev, notif]);
        return true;
    };

    const handleCancelSubscription = (studentId: string) => {
        setAllUsers(prev => prev.map(u => {
            if (u.id === studentId) {
                const p = u.profile as StudentProfile;
                return { ...u, profile: { ...p, activeSubscription: null } };
            }
            return u;
        }));
        
        if (currentUser) {
            const notif: AppNotification = {
                id: generateId(),
                userId: currentUser.id,
                type: 'subscription_update',
                title: 'Subscription Cancelled',
                message: `The active subscription for your child has been cancelled.`,
                isRead: false,
                timestamp: Date.now()
            };
            setNotifications(prev => [...prev, notif]);
        }
    };

    // Root views
    if (activeView === 'splash') return <SplashScreen isExiting={isSplashExiting} />;
    if (activeView === 'AnimatedIntroduction') return <AnimatedIntroduction onAnimationEnd={() => setActiveView('dashboard')} />;
    if (!currentUser && activeView === 'login') return <LoginPage 
        onLogin={handleLogin as any} 
        onGoogleLogin={() => true} 
        onNavigateToRegister={() => setActiveView('register')}
        allUsers={allUsers}
        setAllUsers={setAllUsers}
        onForgotPassword={async () => 'success'}
        onAcknowledgeApprovedPin={() => {}}
        onAcknowledgeAdminPinReset={() => {}}
        onReplaySplash={() => setActiveView('splash')}
    />;
    if (!currentUser && activeView === 'register') return <RegisterPage onRegister={handleRegister} onNavigateToLogin={() => setActiveView('login')} allUsers={allUsers} />;

    return (
        <MediaStreamProvider session={classSession}>
            <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-slate-200">Loading Dashboard...</div>}>
                <ErrorBoundary fallbackTitle="Student Dashboard Error">
                    {currentUser?.role === 'student' && <StudentDashboard 
                        user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser}
                        allUsers={allUsers} messages={messages} notifications={notifications}
                        setNotifications={setNotifications} typingUsers={typingUsers} onSendMessage={handleSendMessage}
                        onDeleteMessage={() => {}} onClearChat={() => {}} onMarkAsRead={() => {}}
                        onTyping={() => {}} onReactToMessage={() => {}} onPinMessage={() => {}}
                        hasUnreadMessages={false} connections={connections} setConnections={setConnections}
                        onConnectionResponse={() => {}} onConnectionRequest={() => {}} onWithdrawConnectionRequest={() => {}}
                        announcements={announcements} auditLogs={auditLogs} tests={tests}
                        onSubmitTest={handleSubmitTest} onStartTestSession={handleStartTestSession} onUpdateTestAttempt={handleUpdateTestAttempt}
                        classSession={classSession} onJoinClass={() => { 
                            const key = `activeView-${currentUser.id}`;
                            const value = 'classroom';
                            localStorage.setItem(key, JSON.stringify(value));
                            window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key, value } }));
                        }} 
                        onLeaveClass={handleEndClass}
                        onMarkReportAsViewed={handleMarkReportAsViewed} onDismissClassInvite={() => {}} onAppReset={handleAppReset}
                        onUpdateConnection={(c) => setConnections(prev => prev.map(conn => conn.id === c.id ? c : conn))}
                        calendarEvents={calendarEvents} onConfirmSchedule={handleConfirmSchedule}
                        onUpdateClassSession={setClassSession}
                    />}
                </ErrorBoundary>
                <ErrorBoundary fallbackTitle="Teacher Dashboard Error">
                    {currentUser?.role === 'teacher' && <TeacherDashboard 
                        user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser}
                        allUsers={allUsers} messages={messages} notifications={notifications}
                        setNotifications={setNotifications} typingUsers={typingUsers} onSendMessage={handleSendMessage}
                        onDeleteMessage={() => {}} onClearChat={() => {}} onMarkAsRead={() => {}}
                        onTyping={() => {}} onReactToMessage={() => {}} onPinMessage={() => {}}
                        hasUnreadMessages={false} connections={connections} setConnections={setConnections}
                        onConnectionResponse={() => {}} 
                        onAssignTask={handleAssignTask} 
                        onGradeTask={handleGradeTask}
                        announcements={announcements} auditLogs={auditLogs} tests={tests}
                        onCreateTest={(testData, studentIds) => {
                            const newTest: Test = { ...testData, id: testData.id || generateId(), teacherId: currentUser.id, createdAt: Date.now() };
                            setTests(prev => [...prev, newTest]);
                            setAllUsers(prev => prev.map(u => {
                                if (studentIds.includes(u.id)) {
                                    const profile = u.profile as StudentProfile;
                                    const newAttempt: TestAttempt = { id: generateId(), testId: newTest.id, studentId: u.id, status: 'pending', answers: [], score: null, totalQuestions: newTest.questions.length, isViewedByStudent: false };
                                    return { ...u, profile: { ...profile, testAttempts: [...(profile.testAttempts || []), newAttempt] } };
                                }
                                return u;
                            }));
                            const newNotifs: AppNotification[] = studentIds.map(sid => ({ id: generateId(), userId: sid, type: 'new_test', title: 'New Test Assigned', message: `${currentUser.name} has assigned a new test: ${newTest.title}`, isRead: false, timestamp: Date.now() }));
                            setNotifications(prev => [...prev, ...newNotifs]);
                        }} 
                        classSession={classSession} onStartClass={handleStartClass}
                        onEndClass={handleEndClass} onClassViewChange={() => {}} onSaveDraftReportCard={(reportData) => {
                            const newReport: ReportCard = { ...reportData, id: generateId(), status: 'draft' };
                            handleUpdateUser({ ...currentUser, profile: { ...currentUser.profile as TeacherProfile, draftReportCards: [...((currentUser.profile as TeacherProfile).draftReportCards || []), newReport] } });
                        }}
                        onUpdateDraftReportCard={(updated) => {
                            const profile = currentUser.profile as TeacherProfile;
                            handleUpdateUser({ ...currentUser, profile: { ...profile, draftReportCards: (profile.draftReportCards || []).map(r => r.id === updated.id ? updated : r) } });
                        }}
                        onDeleteDraftReportCard={(id) => {
                            const profile = currentUser.profile as TeacherProfile;
                            handleUpdateUser({ ...currentUser, profile: { ...profile, draftReportCards: (profile.draftReportCards || []).filter(r => r.id !== id) } });
                        }}
                        onIssueReportCard={(id) => {
                            const profile = currentUser.profile as TeacherProfile;
                            const report = profile.draftReportCards?.find(r => r.id === id);
                            if (report) {
                                const issuedReport: ReportCard = { ...report, status: 'issued', issuedAt: Date.now() };
                                handleUpdateUser({ ...currentUser, profile: { ...profile, draftReportCards: (profile.draftReportCards || []).filter(r => r.id !== id) } });
                                setAllUsers(prev => prev.map(u => {
                                    if (u.id === report.studentId) {
                                        const sp = u.profile as StudentProfile;
                                        return { ...u, profile: { ...sp, reportCards: [...(sp.reportCards || []), issuedReport] } };
                                    }
                                    return u;
                                }));
                                setNotifications(prev => [...prev, { id: generateId(), userId: report.studentId, type: 'new_report', title: 'New Report Card Issued', message: `Tutor ${currentUser.name} has issued your performance report.`, isRead: false, timestamp: Date.now() }]);
                            }
                        }}
                        addAuditLog={(l: any) => setAuditLogs(prev => [...prev, { ...l, id: generateId(), timestamp: Date.now() }])}
                        onAppReset={handleAppReset} onUpdateConnection={(c) => setConnections(prev => prev.map(conn => conn.id === c.id ? c : conn))}
                        calendarEvents={calendarEvents} onConfirmSchedule={handleConfirmSchedule}
                        onUpdateClassSession={setClassSession} aiToolsState={aiToolsState} onGenerateTest={handleGenerateTest}
                        onClearGeneratedTest={() => setAiToolsState(s => ({ ...s, generator: { ...s.generator, questions: null, isCompleted: false } }))}
                        onQuickFeedback={async () => {}} onGradeSubjective={async () => {}} onComplexQuery={async () => {}}
                        onClearAiToolsCompletion={(suite) => {
                            if (suite === 'assistant') {
                                setAiToolsState(s => ({ ...s, generator: { ...s.generator, isCompleted: false }, evaluator: { ...s.evaluator, isCompleted: false }, subjective_grader: { ...s.subjective_grader, isCompleted: false }, thinking: { ...s.thinking, isCompleted: false } }));
                            }
                        }}
                    />}
                </ErrorBoundary>
                {currentUser?.role === 'admin' && <AdminDashboard 
                    user={currentUser} onLogout={handleLogout} allUsers={allUsers}
                    setAllUsers={setAllUsers} archivedUsers={archivedUsers} setArchivedUsers={setArchivedUsers}
                    securityAlerts={securityAlerts} setSecurityAlerts={setSecurityAlerts} auditLogs={auditLogs}
                    addAuditLog={(l: any) => setAuditLogs(prev => [...prev, { ...l, id: generateId(), timestamp: Date.now() }])}
                    onUpdateUser={handleUpdateUser}
                    messages={messages} notifications={notifications} setNotifications={setNotifications}
                    typingUsers={typingUsers} onSendMessage={handleSendMessage} onDeleteMessage={() => {}}
                    onClearChat={() => {}} onMarkAsRead={() => {}} onTyping={() => {}}
                    hasUnreadMessages={false} connections={connections} setConnections={setConnections}
                    onConnectionResponse={() => {}} announcements={announcements} setAnnouncements={setAnnouncements}
                    onAppReset={handleAppReset} handleManualRefresh={() => {}} onApprovePinReset={() => {}}
                    onRejectPinReset={() => {}} calendarEvents={calendarEvents}
                />}
                {currentUser?.role === 'parent' && <ParentDashboard 
                    user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser}
                    child={allUsers.find(u => u.role === 'student' && u.studentId === (currentUser.profile as ParentProfile).childStudentId)}
                    allUsers={allUsers} messages={messages} notifications={notifications}
                    setNotifications={setNotifications} typingUsers={typingUsers} onSendMessage={handleSendMessage}
                    onDeleteMessage={() => {}} onClearChat={() => {}} onMarkAsRead={() => {}}
                    onTyping={() => {}} onReactToMessage={() => {}} onPinMessage={() => {}}
                    hasUnreadMessages={false} connections={connections} onConnectionResponse={() => {}}
                    announcements={announcements} auditLogs={auditLogs} tests={tests}
                    onMarkReportAsViewed={handleMarkReportAsViewed} onDismissClassInvite={() => {}} onAppReset={handleAppReset}
                    handleWithdrawCredits={handleWithdrawCredits} onCancelSubscription={handleCancelSubscription}
                />}
                
                {/* Fallback for Unknown Role */}
                {currentUser && !['student', 'teacher', 'admin', 'parent'].includes(currentUser.role) && (
                    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                        <h2 className="text-xl font-bold mb-4">Account Configuration Error</h2>
                        <p className="mb-4">Unknown Role: {currentUser.role}</p>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
                            Logout & Retry
                        </button>
                    </div>
                )}
            </Suspense>
        </MediaStreamProvider>
    );
};

export default App;
