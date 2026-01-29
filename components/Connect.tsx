
import React, { useMemo, FC, useState } from 'react';
import { User, StudentProfile, TeacherProfile, Connection } from '../types';
import { UserAddIcon, CheckIcon, XIcon, ClockIcon, BookOpenIcon, AcademicCapIcon, BriefcaseIcon, LocationMarkerIcon, CurrencyRupeeIcon, ShieldCheckIcon } from './icons/IconComponents';
import { getDistance, useLocalStorage } from '../utils';

type ConnectionDisplayStatus = 'none' | 'pending_to_them' | 'pending_to_me' | 'connected';

interface ConnectProps {
    currentUser: User;
    allUsers: User[];
    connections: Connection[];
    onConnectionRequest: (fromUser: User, toUserId: string) => void;
    onWithdrawConnectionRequest: (fromUser: User, toUserId: string) => void;
}

const UserCard: FC<{
    targetUser: User;
    currentUser: User;
    onConnectionRequest: () => void;
    onWithdrawRequest: () => void;
    connectionStatus: ConnectionDisplayStatus;
    isBlocked: boolean;
    onToggleBlock: () => void;
}> = ({ targetUser, currentUser, onConnectionRequest, onWithdrawRequest, connectionStatus, isBlocked, onToggleBlock }) => {

    const isTeacher = currentUser.role === 'teacher';

    const getButton = () => {
        if (isBlocked && isTeacher) return null; // Hide connect button if blocked

        switch (connectionStatus) {
            case 'pending_to_them':
                return <button onClick={onWithdrawRequest} className="btn-secondary py-1.5 px-3 text-sm border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"><ClockIcon className="w-4 h-4 mr-1" /> Request Sent</button>;
            case 'pending_to_me':
                 return <button disabled className="btn-secondary py-1.5 px-3 text-sm border-slate-300 text-slate-500 bg-slate-100 cursor-not-allowed"><ClockIcon className="w-4 h-4 mr-1" /> Action Required</button>;
            case 'connected':
                return <button disabled className="btn-secondary py-1.5 px-3 text-sm border-green-300 text-green-700 bg-green-50 cursor-not-allowed dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"><CheckIcon className="w-4 h-4 mr-1" /> Connected</button>;
            case 'none':
            default:
                return <button onClick={onConnectionRequest} className="btn-primary py-1.5 px-3 text-sm"><UserAddIcon className="w-4 h-4 mr-1" />Connect</button>;
        }
    };

    const profile = targetUser.profile as StudentProfile | TeacherProfile;

    const distance = useMemo(() => {
        const myLocation = (currentUser.profile as StudentProfile | TeacherProfile).location;
        const theirLocation = profile.location;
        if (myLocation && theirLocation) {
            return getDistance(myLocation.lat, myLocation.lng, theirLocation.lat, theirLocation.lng);
        }
        return null;
    }, [currentUser.profile, profile.location]);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 flex items-center gap-4 transition-all duration-300 ${isBlocked ? 'opacity-60 grayscale border-red-200 dark:border-red-900/30' : 'hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 border-slate-200 dark:border-slate-700'}`}>
            <div className="relative">
                <img 
                    src={targetUser.profilePicUrl || `https://i.pravatar.cc/150?u=${targetUser.id}`} 
                    alt={targetUser.name} 
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0" 
                />
                {targetUser.isOnline && !isBlocked && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`font-bold text-lg transition-all ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'} truncate`}>{targetUser.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full flex-shrink-0">{targetUser.role}</span>
                            {distance !== null && (
                                <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                    ~{Math.round(distance)} km away
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {targetUser.role === 'teacher' && (
                    <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        <div className="flex items-center gap-1.5"><AcademicCapIcon className="w-4 h-4 text-indigo-400 flex-shrink-0"/> <span className="font-semibold">Qual:</span> <span className="truncate">{(profile as TeacherProfile).qualification}</span></div>
                        <div className="flex items-center gap-1.5"><BriefcaseIcon className="w-4 h-4 text-indigo-400 flex-shrink-0"/> <span className="font-semibold">Exp:</span> {(profile as TeacherProfile).experience} yrs</div>
                    </div>
                )}
                
                 {targetUser.role === 'student' && (
                     <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        <div className="flex items-center gap-1.5"><AcademicCapIcon className="w-4 h-4 text-indigo-400 flex-shrink-0"/> <span className="font-semibold">Grade:</span> {(profile as StudentProfile).grade}</div>
                        <div className="flex items-center gap-1.5"><BookOpenIcon className="w-4 h-4 text-indigo-400 flex-shrink-0"/> <span className="font-semibold">Interests:</span> <span className="truncate">{(profile as StudentProfile).subjectsOfInterest.join(', ')}</span></div>
                     </div>
                )}
                
                <div className="mt-3 flex justify-between items-end">
                    {targetUser.role === 'teacher' && (
                         <div className="flex items-center gap-3 sm:gap-4 text-center">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hourly</p>
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">₹{(profile as TeacherProfile).hourlyRate}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Range</p>
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">₹{(profile as TeacherProfile).salaryRange}</p>
                            </div>
                             <div className="h-8 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block"></div>
                            <div className="hidden sm:block">
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Session</p>
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">₹{(profile as TeacherProfile).perSessionFee}</p>
                            </div>
                         </div>
                    )}
                    {targetUser.role === 'student' && <div />} 

                    <div className="flex-shrink-0 flex items-center gap-2">
                        {isTeacher && (
                            <button 
                                onClick={onToggleBlock}
                                className={`p-2 rounded-lg transition-all border ${
                                    isBlocked 
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-transparent hover:border-red-100 dark:hover:border-red-800/50'
                                }`}
                                aria-label={isBlocked ? 'Unblock Student' : 'Block Student'}
                                title={isBlocked ? 'Unblock Student' : 'Block Student'}
                            >
                                <ShieldCheckIcon className={`w-5 h-5 ${isBlocked ? 'animate-pulse' : ''}`} />
                            </button>
                        )}
                        {getButton()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Connect: FC<ConnectProps> = ({ currentUser, allUsers, connections, onConnectionRequest, onWithdrawConnectionRequest }) => {
    const isStudent = currentUser.role === 'student';
    const isTeacher = currentUser.role === 'teacher';
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    // Persistence for Restricted Access
    const [restrictedAccess, setRestrictedAccess] = useLocalStorage<string[]>(`restrictedAccess-${currentUser.id}`, []);

    const toggleStudentAccess = (studentId: string) => {
        setRestrictedAccess(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const potentialConnections = useMemo(() => {
        const targetRole = isStudent ? 'teacher' : 'student';
        const targetStatus = isStudent ? 'approved' : 'active';
        
        let filtered = allUsers.filter(u => u.role === targetRole && (u.profile as any).status === targetStatus);

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(u => {
                const profile = u.profile as TeacherProfile | StudentProfile;
                const nameMatch = u.name.toLowerCase().includes(lowercasedTerm);
                let subjectMatch = false;
                if (u.role === 'teacher') {
                    subjectMatch = (profile as TeacherProfile).subjects.some(s => s.toLowerCase().includes(lowercasedTerm));
                } else {
                    subjectMatch = (profile as StudentProfile).subjectsOfInterest.some(s => s.toLowerCase().includes(lowercasedTerm));
                }
                return nameMatch || subjectMatch;
            });
        }

        if (locationFilter) {
            const lowercasedLocation = locationFilter.toLowerCase();
            filtered = filtered.filter(u => {
                const profile = u.profile as TeacherProfile | StudentProfile;
                return (profile as any).address?.toLowerCase().includes(lowercasedLocation);
            });
        }
        
        return filtered;
    }, [allUsers, isStudent, searchTerm, locationFilter]);

    const recommendedConnections = useMemo(() => {
        if (searchTerm || locationFilter) return []; // Don't show recommendations when searching/filtering

        if (isStudent) {
            const studentInterests = (currentUser.profile as StudentProfile).subjectsOfInterest || [];
            return potentialConnections.filter(teacher => 
                (teacher.profile as TeacherProfile).subjects.some(subject => studentInterests.includes(subject))
            );
        } else { // Is Teacher
            const teacherSubjects = (currentUser.profile as TeacherProfile).subjects || [];
            return potentialConnections.filter(student =>
                (student.profile as StudentProfile).subjectsOfInterest.some(interest => teacherSubjects.includes(interest))
            );
        }
    }, [currentUser, potentialConnections, isStudent, searchTerm, locationFilter]);

    const otherConnections = useMemo(() => {
        if (searchTerm || locationFilter) return potentialConnections; // Show all search results in one list
        const recommendedIds = new Set(recommendedConnections.map(u => u.id));
        return potentialConnections.filter(u => !recommendedIds.has(u.id));
    }, [potentialConnections, recommendedConnections, searchTerm, locationFilter]);

    const getConnectionStatus = (targetUser: User): ConnectionDisplayStatus => {
        // 1. Check for an active connection
        const existingConnection = connections.find(c =>
            c.status === 'active' &&
            ((c.studentId === currentUser.id && c.teacherId === targetUser.id) ||
             (c.studentId === targetUser.id && c.teacherId === currentUser.id))
        );
        if (existingConnection) return 'connected';

        // 2. Check for an outgoing request (I sent to them)
        const theirProfile = targetUser.profile as TeacherProfile | StudentProfile;
        const requestToThem = theirProfile.connectionRequests?.find(req => req.userId === currentUser.id && req.status === 'pending');
        if (requestToThem) return 'pending_to_them';

        // 3. Check for an incoming request (They sent to me)
        const myProfile = currentUser.profile as TeacherProfile | StudentProfile;
        const requestToMe = myProfile.connectionRequests?.find(req => req.userId === targetUser.id && req.status === 'pending');
        if (requestToMe) return 'pending_to_me';
        
        return 'none'; // 'rejected' is treated as 'none' to allow sending a new request
    };

    const title = isStudent ? "Find Tutors" : "Find Students";
    const description = isStudent 
        ? "Browse and connect with teachers who match your subjects of interest."
        : "Discover students who could benefit from your expertise.";

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <UserAddIcon className="w-8 h-8 text-indigo-500"/>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input
                    type="text"
                    placeholder="Search by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-style w-full px-3 py-2 text-sm"
                />
                 <input
                    type="text"
                    placeholder="Filter by City, State..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="input-style w-full px-3 py-2 text-sm"
                />
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {(searchTerm || locationFilter) && otherConnections.length > 0 && (
                     <section>
                        <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Search Results</h3>
                        <div className="space-y-3">
                           {otherConnections.map(user => (
                                <UserCard 
                                    key={user.id}
                                    targetUser={user}
                                    currentUser={currentUser}
                                    onConnectionRequest={() => onConnectionRequest(currentUser, user.id)}
                                    onWithdrawRequest={() => onWithdrawConnectionRequest(currentUser, user.id)}
                                    connectionStatus={getConnectionStatus(user)}
                                    isBlocked={restrictedAccess.includes(user.id)}
                                    onToggleBlock={() => toggleStudentAccess(user.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {!searchTerm && !locationFilter && recommendedConnections.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Recommended for You</h3>
                        <div className="space-y-3">
                            {recommendedConnections.map(user => (
                                <UserCard 
                                    key={user.id}
                                    targetUser={user}
                                    currentUser={currentUser}
                                    onConnectionRequest={() => onConnectionRequest(currentUser, user.id)}
                                    onWithdrawRequest={() => onWithdrawConnectionRequest(currentUser, user.id)}
                                    connectionStatus={getConnectionStatus(user)}
                                    isBlocked={restrictedAccess.includes(user.id)}
                                    onToggleBlock={() => toggleStudentAccess(user.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {!searchTerm && !locationFilter && otherConnections.length > 0 && (
                     <section>
                        <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">All Available {isStudent ? 'Tutors' : 'Students'}</h3>
                        <div className="space-y-3">
                           {otherConnections.map(user => (
                                <UserCard 
                                    key={user.id}
                                    targetUser={user}
                                    currentUser={currentUser}
                                    onConnectionRequest={() => onConnectionRequest(currentUser, user.id)}
                                    onWithdrawRequest={() => onWithdrawConnectionRequest(currentUser, user.id)}
                                    connectionStatus={getConnectionStatus(user)}
                                    isBlocked={restrictedAccess.includes(user.id)}
                                    onToggleBlock={() => toggleStudentAccess(user.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {potentialConnections.length === 0 && (
                     <div className="text-center py-10">
                        <p className="text-slate-500">No available {isStudent ? 'tutors' : 'students'} matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Connect;
