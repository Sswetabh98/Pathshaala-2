
// types.ts

// Basic types
export type Role = 'student' | 'teacher' | 'parent' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected' | 'deleted' | 'removed' | 'restricted';
export type ConnectionStatus = 'active' | 'suspended' | 'terminated' | 'flagged';
export type ConnectionRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType = 'new_message' | 'task_update' | 'connection_request' | 'connection_accepted' | 'security_alert' | 'announcement' | 'new_test' | 'test_submitted' | 'new_report' | 'class_invite' | 'new_connection' | 'class_scheduled' | 'insufficient_credits' | 'booking_failed_teacher' | 'credit_withdrawal' | 'subscription_update' | 'credit_purchase' | 'subscription_renewal' | 'escrow_payment_received';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type SecurityAction = 'lock' | 'reset_pin' | 'dismiss' | 'force_pin_reset';

// WebRTC Signaling Types
export interface SignalingMessage {
    type: 'offer' | 'answer' | 'candidate';
    payload: any;
    from: string;
    to: string;
}

export interface ClassChatMessage {
    user: string;
    text: string;
    timestamp: number;
}

export interface Plan {
    name: string;
    price: number;
    credits: number;
    features: string[];
    isPopular: boolean;
    billingCycle: 'one-time' | 'monthly';
}

export interface CheckoutSession {
    plan: Plan;
    initiatedBy: 'student' | 'parent';
    initiatedAt: number;
    status: 'pending' | 'completed' | 'cancelled';
}

export interface ClassSession {
    id: string;
    teacherId: string;
    teacherName: string;
    studentIds: string[];
    isActive: boolean;
    startedAt: number;
    mainView?: 'video' | 'whiteboard';
    isHandRaised?: boolean;
    isCamOn?: boolean; 
    isMicOn?: boolean;
    chatHistory?: ClassChatMessage[]; // Persistent class chat
}

export interface ReportCardTestResult {
    testTitle: string;
    score: number;
    totalQuestions: number;
}
export interface ReportCardTaskItem {
    text: string;
    status: 'Completed' | 'Pending' | 'Graded';
    grade?: string;
}
export interface ReportCard {
    id: string;
    teacherId: string;
    teacherName: string;
    studentId: string;
    startDate: number;
    endDate: number;
    summary: string;
    comments: string;
    testResults: ReportCardTestResult[];
    taskDetails: ReportCardTaskItem[];
    createdAt: number;
    issuedAt?: number;
    isViewedByStudent: boolean;
    isViewedByParent: boolean;
    status: 'draft' | 'issued';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  participants: { userId: string; name: string }[];
  connectionId: string;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface TestQuestion {
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
}

export interface Test {
  id: string;
  teacherId: string;
  title: string;
  questions: TestQuestion[];
  createdAt: number;
  dueDate?: number;
  timeLimitSeconds?: number;
}

export interface StudentAnswer {
  questionIndex: number;
  answer: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  status: 'pending' | 'in-progress' | 'completed';
  answers: StudentAnswer[];
  score: number | null;
  totalQuestions: number;
  startedAt?: number;
  submittedAt?: number;
  isReviewedByTeacher?: boolean;
  isViewedByStudent?: boolean;
  reportCard?: {
      teacherComments: string;
      performanceSummary: string;
  };
}

export interface DeletionInfo {
    markedForDeletionAt: number;
    deletionDurationMs: number;
    isDeletionViewed: boolean;
    isPaused?: boolean;
    remainingTimeAtPause?: number;
}

export interface TaskComment {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    timestamp: number;
}

export interface UploadedFile {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    accessibleTo: string[];
}

export interface StudentTask {
    id: string;
    text: string;
    completed: boolean;
    assignedBy: string;
    dueDate?: number;
    totalMarks?: number;
    teacherAttachments?: UploadedFile[];
    studentSubmissions?: UploadedFile[];
    comments?: TaskComment[];
    isViewedByStudent?: boolean;
    teacherFeedback?: string;
    grade?: string;
}

export interface ConnectionRequest {
    userId: string;
    status: ConnectionRequestStatus;
    timestamp: number;
}

export interface StudentProfile {
    grade: number;
    subjectsOfInterest: string[];
    learningGoals: string;
    status: UserStatus;
    tasks?: StudentTask[];
    testAttempts?: TestAttempt[];
    reportCards?: ReportCard[];
    connectionRequests?: ConnectionRequest[];
    parentId?: string;
    address?: string;
    location?: { lat: number; lng: number; };
    isSuspensionViewed?: boolean;
    isRemovalViewed?: boolean;
    isRejectedViewed?: boolean;
    reinstatementRequest?: boolean;
    deletionInfo?: DeletionInfo;
    credits: number;
    activeSubscription: { planName: string; nextBillingDate: number; price: number; } | null;
    // FIX: Added missing checkoutSession property to StudentProfile.
    checkoutSession?: CheckoutSession | null;
}

export interface TeacherProfile {
    subjects: string[];
    experience: number;
    qualification: string;
    salaryRange: string;
    hourlyRate?: number;
    perSessionFee?: number;
    status: UserStatus;
    connectionRequests?: ConnectionRequest[];
    cvFileName?: string;
    certificatesFileName?: string;
    address?: string;
    location?: { lat: number; lng: number; };
    isSuspensionViewed?: boolean;
    isRemovalViewed?: boolean;
    isRejectedViewed?: boolean;
    reinstatementRequest?: boolean;
    deletionInfo?: DeletionInfo;
    draftReportCards?: ReportCard[];
}

export interface ParentProfile {
    childStudentId: string;
    status: UserStatus;
    isSuspensionViewed?: boolean;
    isRemovalViewed?: boolean;
    isRejectedViewed?: boolean;
    reinstatementRequest?: boolean;
    deletionInfo?: DeletionInfo;
}

export interface AdminProfile {
    permissions: string[];
    status: UserStatus;
}

export interface AppearanceSettings {
    theme: 'system' | 'light' | 'dark';
    density: 'spacious' | 'comfortable' | 'cozy' | 'compact';
    highContrast: boolean;
    reduceMotion: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    pin: string;
    password: string;
    role: Role;
    profile: StudentProfile | TeacherProfile | ParentProfile | AdminProfile;
    profilePicUrl?: string;
    loginId?: string;
    studentId?: string;
    teacherId?: string;
    parentId?: string;
    adminId?: string;
    loginAttempts?: number;
    isLocked?: boolean;
    isOnline?: boolean;
    createdAt?: number;
    tempOtp?: { code: string; expiresAt: number };
    pendingPin?: string;
    pinResetPending?: boolean;
    pinJustApproved?: boolean;
    approvedPinToShow?: string;
    pinJustResetByAdmin?: boolean;
    pinResetRejected?: boolean;
    appearance?: AppearanceSettings;
}

export interface ArchivedUser extends Omit<User, 'pin' | 'password' | 'profile' | 'loginAttempts' | 'isLocked' | 'tempOtp' | 'pendingPin' | 'pinResetPending'> {
    profile: Omit<StudentProfile, 'status' | 'deletionInfo' | 'tasks' | 'connectionRequests' | 'isRejectedViewed' | 'isSuspensionViewed' | 'isRemovalViewed' | 'reinstatementRequest'> |
             Omit<TeacherProfile, 'status' | 'deletionInfo' | 'connectionRequests' | 'isRejectedViewed' | 'isSuspensionViewed' | 'isRemovalViewed' | 'reinstatementRequest'> |
             Omit<ParentProfile, 'status' | 'deletionInfo' | 'isRejectedViewed' | 'isSuspensionViewed' | 'isRemovalViewed' | 'reinstatementRequest'> |
             Omit<AdminProfile, 'status'>;
    deletedAt: number;
    deletedBy: string;
    isArchiveViewed?: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    text?: string;
    testId?: string;
    file?: { name: string; type: string; size: number; dataUrl: string; };
    audio?: { base64: string; mimeType: string; };
    replyTo?: string;
    timestamp: number;
    isRead: boolean;
    isDelivered: boolean;
    reactions?: Record<string, string[]>;
    isDeletedForEveryone?: boolean;
    deletedForUsers?: string[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    timestamp: number;
    fromUserId?: string;
    fromUserName?: string;
    priority?: AnnouncementPriority;
    isDismissed?: boolean;
    isActioned?: boolean;
    creditChange?: number;
    inrChange?: number;
}

export interface Connection {
    id: string;
    studentId: string;
    teacherId: string;
    status: ConnectionStatus;
    startedAt: number;
    pinnedMessageId?: string;
    classHistory?: {
        sessionId: string;
        startedAt: number;
        endedAt?: number;
        durationMinutes?: number;
        chatHistory?: ClassChatMessage[];
        chatSummary?: string;
        whiteboardSnapshot?: string;
    }[];
    teacherProposedSlots?: { weekOffset: number; day: string; slots: string[] }[];
    studentSelectedSlots?: { weekOffset: number; day: string; slots: string[] }[];
    isEscrowPaid?: boolean; 
    newProposalForStudent?: boolean;
    newSelectionForTeacher?: boolean;
    finalScheduledSlot?: string;
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    createdBy: string;
    recipientIds?: string[];
    scheduledAt?: number;
    priority?: AnnouncementPriority;
    isFollowUp?: boolean;
}

export interface SecurityAlert {
    id: string;
    type: 'brute_force_attempt' | 'rapid_admin_action' | 'account_locked';
    timestamp: number;
    userId: string;
    details: string;
    isDismissed: boolean;
    resolutionAction?: SecurityAction;
}

export interface AuditLog {
    id: string;
    timestamp: number;
    adminId: string;
    adminName: string;
    targetUserId: string;
    targetUserName: string;
    action: string;
    details: string;
}

export const statusInfo: { [key in UserStatus]: { text: string, color: string } } = {
    pending: { text: 'Pending', color: 'bg-yellow-500' },
    approved: { text: 'Approved', color: 'bg-blue-500' },
    active: { text: 'Active', color: 'bg-green-500' },
    suspended: { text: 'Suspended', color: 'bg-orange-500' },
    rejected: { text: 'Rejected', color: 'bg-red-600' },
    deleted: { text: 'In Recycle Bin', color: 'bg-slate-500' },
    removed: { text: 'Removed', color: 'bg-red-700' },
    restricted: { text: 'Restricted', color: 'bg-yellow-600' }
};

export const getUserPermissions = (role: Role) => {
    const permissions = {
        canViewDashboard: true,
        canViewChildProgress: false,
        canAccessMessages: true,
        canFindConnections: false,
        canUseAIAssistant: false,
        canAccessVirtualClassroom: false,
    };

    switch (role) {
        case 'student':
            permissions.canFindConnections = true;
            permissions.canAccessVirtualClassroom = true;
            break;
        case 'teacher':
            permissions.canFindConnections = true;
            permissions.canUseAIAssistant = true;
            permissions.canAccessVirtualClassroom = true;
            break;
        case 'parent':
            permissions.canViewChildProgress = true;
            break;
        case 'admin':
            permissions.canUseAIAssistant = true;
            break;
    }

    return permissions;
};

export type MessageContent = 
    { text: string; testId?: string; replyTo?: string; } | 
    { file: { name: string; type: string; size: number; dataUrl: string; }; replyTo?: string; } | 
    { audio: { base64: string; mimeType: string; }; replyTo?: string; }
