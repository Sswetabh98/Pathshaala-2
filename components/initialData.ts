import { User, Message, Notification, Connection, Announcement, Test } from './types';
import { generateId } from './utils';

const physicsTestId = 'test-physics-1';

export const initialUsers: User[] = [
    {
        id: 'admin1',
        name: 'SWETABH SUMAN',
        email: 'admin@pathshaala.com',
        phone: '1234567890',
        pin: '100100',
        password: 'adminpassword',
        role: 'admin',
        loginId: '@swetabh123',
        adminId: 'ADM-000001',
        profile: {
            permissions: ['manage_users', 'view_security_logs'],
            status: 'active',
        },
        profilePicUrl: 'https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        isOnline: true,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    },
    {
        id: 'teacher1',
        name: 'DR. PRIYA SHARMA',
        email: 'priya.sharma@pathshaala.com',
        phone: '1234567891',
        pin: '121212',
        password: 'teacherpassword',
        role: 'teacher',
        loginId: '@priya456',
        teacherId: 'TCH-K2L4P1',
        profile: {
            subjects: ['PHYSICS', 'MATHEMATICS'],
            experience: 10,
            qualification: 'PHD IN PHYSICS',
            salaryRange: '50000-60000',
            hourlyRate: 1000,
            perSessionFee: 1500,
            status: 'approved',
            connectionRequests: [],
            address: 'New Delhi, Delhi',
            location: { lat: 28.6328, lng: 77.2197 },
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=teacher1',
        isOnline: true,
        createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    },
    {
        id: 'student1',
        name: 'RAJESH KUMAR',
        email: 'rajesh.kumar@pathshaala.com',
        phone: '1234567892',
        pin: '232323',
        password: 'studentpassword',
        role: 'student',
        loginId: '@rajesh789',
        studentId: 'STU-A1B2C3',
        profile: {
            grade: 11,
            subjectsOfInterest: ['PHYSICS', 'CHEMISTRY'],
            learningGoals: 'ACE THE FINAL EXAMS',
            status: 'active',
            tasks: [],
            testAttempts: [],
            connectionRequests: [],
            address: 'New Delhi, Delhi',
            location: { lat: 28.6506, lng: 77.1932 },
            credits: 5000, // Populated as per request
            checkoutSession: null,
            activeSubscription: null,
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=student1',
        isOnline: false,
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    },
     {
        id: 'student2',
        name: 'ANJALI VERMA',
        email: 'anjali.verma@pathshaala.com',
        phone: '1234567893',
        pin: '343434',
        password: 'studentpassword2',
        role: 'student',
        loginId: '@anjali101',
        studentId: 'STU-X7Y8Z9',
        profile: {
            grade: 12,
            subjectsOfInterest: ['BIOLOGY', 'CHEMISTRY'],
            learningGoals: 'PREPARE FOR MEDICAL ENTRANCE EXAMS',
            status: 'active',
            tasks: [],
            testAttempts: [],
            connectionRequests: [],
            address: 'New Delhi, Delhi',
            location: { lat: 28.5539, lng: 77.1942 },
            credits: 5000, // Populated as per request
            checkoutSession: null,
            activeSubscription: null,
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=student2',
        isOnline: true,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    },
    {
        id: 'parent1',
        name: 'SUNITA KUMAR',
        email: 'sunita.kumar@pathshaala.com',
        phone: '1234567894',
        pin: '454545',
        password: 'parentpassword',
        role: 'parent',
        loginId: '@sunita212',
        parentId: 'PAR-D4E5F6',
        profile: {
            childStudentId: 'STU-A1B2C3',
            status: 'active',
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=parent1',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    },
    {
        id: 'parent2',
        name: 'VIKRAM VERMA',
        email: 'vikram.verma@pathshaala.com',
        phone: '1234567895',
        pin: '545454',
        password: 'parentpassword2',
        role: 'parent',
        loginId: '@vikram313',
        parentId: 'PAR-G7H8I9',
        profile: {
            childStudentId: 'STU-X7Y8Z9', // Anjali's ID
            status: 'active',
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=parent2',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    },
    // New pending users for admin review
    {
        id: 'student_pending',
        name: 'AMIT SINGH',
        email: 'amit.singh@example.com',
        phone: '9988776655',
        password: 'pendingpassword1',
        pin: '565656',
        role: 'student',
        profile: {
            grade: 9,
            subjectsOfInterest: ['COMPUTER SCIENCE', 'MATHEMATICS'],
            learningGoals: 'LEARN TO CODE',
            status: 'pending',
            testAttempts: [],
            credits: 5000, // Populated
            checkoutSession: null,
            activeSubscription: null,
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=student_pending',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    },
    {
        id: 'teacher_pending',
        name: 'DR. NEHA REDDY',
        email: 'neha.reddy@example.com',
        phone: '9876554321',
        password: 'pendingpassword2',
        pin: '676767',
        role: 'teacher',
        profile: {
            subjects: ['BIOLOGY', 'ENVIRONMENTAL SCIENCE'],
            experience: 5,
            qualification: 'MSC IN BIOTECHNOLOGY',
            salaryRange: '35000-45000',
            hourlyRate: 800,
            perSessionFee: 1200,
            status: 'pending',
        },
        profilePicUrl: 'https://i.pravatar.cc/150?u=teacher_pending',
        createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    }
];

export const initialMessages: Message[] = [];

export const initialNotifications: Notification[] = [];

export const initialConnections: Connection[] = [
    {
        id: 'conn-teacher1-student2',
        studentId: 'student2', // Anjali Verma
        teacherId: 'teacher1', // Dr. Priya Sharma
        status: 'active',
        startedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    }
];

export const initialAnnouncements: Announcement[] = [];

export const initialTests: Test[] = [];