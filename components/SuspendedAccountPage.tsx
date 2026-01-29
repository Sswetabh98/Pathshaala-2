import React, { useState } from 'react';
import { User, StudentProfile, TeacherProfile, ParentProfile } from '../types';

interface SuspendedAccountPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const SuspendedAccountPage: React.FC<SuspendedAccountPageProps> = ({ user, onUpdateUser, onLogout }) => {
    const [requestSent, setRequestSent] = useState(false);
    const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile;
    const hasExistingRequest = profile.reinstatementRequest;

    const handleRequest = () => {
        if (hasExistingRequest) return;
        
        const updatedUser = {
            ...user,
            profile: { ...profile, reinstatementRequest: true }
        };
        onUpdateUser(updatedUser);
        setRequestSent(true);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onLogout}>
            <div 
                className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-2xl shadow-2xl dark:bg-slate-800 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <svg className="w-24 h-24 mx-auto text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Account Suspended
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Hello {user.name}, your account is currently suspended. You will not be able to access the dashboard until your account is reactivated.
                </p>
                
                {(requestSent || hasExistingRequest) ? (
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md">
                        <p className="font-semibold">Reinstatement Request Sent</p>
                        <p className="text-sm">An administrator will review your request shortly. Please check back later.</p>
                    </div>
                ) : (
                    <button
                        onClick={handleRequest}
                        className="w-full py-3 mt-4 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Request Reinstatement
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuspendedAccountPage;