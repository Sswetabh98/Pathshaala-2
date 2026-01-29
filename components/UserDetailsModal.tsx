
import React, { FC, useMemo, useEffect } from 'react';
import { User, AuditLog, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import { XIcon } from './icons/IconComponents';

interface UserDetailsModalProps {
    user: User;
    logs: AuditLog[];
    onClose: () => void;
}

const DetailItem: FC<{ label: string; value?: string | string[] | number | null }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div className="py-3 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 col-span-2">{String(displayValue)}</dd>
        </div>
    );
};

const UserDetailsModal: FC<UserDetailsModalProps> = ({ user, logs, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const userLogs = useMemo(() => {
        return logs
            .filter(log => log.targetUserId === user.id)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [logs, user.id]);
    
    const profile = user.profile;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300`}>
                                {user.role}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-8">
                    {/* Profile Card */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Profile Details</h3>
                        <div className="mt-2 border-t border-slate-200 dark:border-slate-700">
                            <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                                <DetailItem label="User ID" value={user.id} />
                                {(profile as any).status !== 'rejected' && (
                                    <>
                                        <DetailItem label="Login ID" value={user.loginId} />
                                        <DetailItem label="Platform ID" value={user.studentId || user.teacherId || user.parentId || user.adminId} />
                                    </>
                                )}
                                <DetailItem label="Email" value={user.email} />
                                <DetailItem label="Phone" value={user.phone} />
                                {user.password && <DetailItem label="Registration Password" value={user.password} />}
                                <DetailItem label="Status" value={(profile as any).status} />
                                
                                {user.role === 'student' && (
                                    <>
                                        <DetailItem label="Grade" value={(profile as StudentProfile).grade} />
                                        <DetailItem label="Subjects of Interest" value={(profile as StudentProfile).subjectsOfInterest} />
                                        <DetailItem label="Learning Goals" value={(profile as StudentProfile).learningGoals} />
                                    </>
                                )}

                                {user.role === 'teacher' && (
                                    <>
                                        <DetailItem label="Subjects Taught" value={(profile as TeacherProfile).subjects} />
                                        <DetailItem label="Experience" value={`${(profile as TeacherProfile).experience} years`} />
                                        <DetailItem label="Qualification" value={(profile as TeacherProfile).qualification} />
                                        <DetailItem label="Hourly Rate" value={(profile as TeacherProfile).hourlyRate ? `₹${(profile as TeacherProfile).hourlyRate}` : 'N/A'} />
                                        {/* FIX: Corrected Property 'monthlyRate' to 'salaryRange' as per TeacherProfile update */}
                                        <DetailItem label="Salary Range" value={`₹${(profile as TeacherProfile).salaryRange}`} />
                                        <DetailItem label="Per Session Fee" value={(profile as TeacherProfile).perSessionFee ? `₹${(profile as TeacherProfile).perSessionFee}` : 'N/A'} />
                                        <DetailItem label="CV" value={(profile as TeacherProfile).cvFileName} />
                                        <DetailItem label="Certificates" value={(profile as TeacherProfile).certificatesFileName} />
                                    </>
                                )}

                                {user.role === 'parent' && (
                                    <DetailItem label="Child's Student ID" value={(profile as ParentProfile).childStudentId} />
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Audit Log Card */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Audit Log</h3>
                        <div className="mt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="mt-4 space-y-4">
                                {userLogs.length > 0 ? (
                                    userLogs.map(log => (
                                        <div key={log.id} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{log.action}</p>
                                                    <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                                                <p className="text-xs text-slate-500 mt-1">Performed by: {log.adminName}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-10">No logs found for this user.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
