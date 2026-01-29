


import React, { useRef, useCallback, useEffect } from 'react';
// FIX: Import all necessary types from the corrected types file.
import { User, UserStatus, StudentProfile, TeacherProfile, ParentProfile, statusInfo, AuditLog, Role } from '../types';
import { CheckIcon, XIcon, TrashIcon, UndoIcon } from './icons/IconComponents';
import { generatePlatformCredentials } from '../utils';

interface SwipeableStatusProps {
  user: User;
  allUsers: User[];
  onUpdateUser: (user: User) => void;
  onActionSuccess?: (message: string) => void;
  onShowApprovalInfo?: (name: string, platformId: string, pin: string) => void;
  onDeletePermanently?: (userId: string, userName: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  currentUser: User;
}

type ActionType = 'suspend' | 'remove' | 'approve' | 'retract_to_suspended' | 'delete_to_bin' | 'reject' | 'delete_permanently' | 'reactivate';

const SwipeableStatus: React.FC<SwipeableStatusProps> = ({ user, allUsers, onUpdateUser, onActionSuccess, onShowApprovalInfo, onDeletePermanently, addAuditLog, currentUser }) => {
    const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile;
    if (!('status' in profile)) {
        return <span className="text-sm text-slate-400">N/A</span>;
    }
  
    const currentStatus = profile.status;
    const info = statusInfo[currentStatus];
    const isSwipeable = ['active', 'approved', 'suspended', 'removed', 'pending', 'rejected'].includes(currentStatus);

    const pillRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);
    
    
    let primaryAction: ActionType | null = null; // Right swipe
    let secondaryAction: ActionType | null = null; // Left swipe
    
    switch (currentStatus) {
        case 'active':
        case 'approved':
            primaryAction = null;
            secondaryAction = 'suspend';
            break;
        case 'suspended':
            primaryAction = 'reactivate'; // This is effectively "reactivate"
            secondaryAction = 'remove';
            break;
        case 'removed':
            primaryAction = 'retract_to_suspended';
            secondaryAction = 'delete_to_bin';
            break;
        case 'pending':
            primaryAction = 'approve';
            secondaryAction = 'reject';
            break;
        case 'rejected':
             primaryAction = 'approve';
             secondaryAction = 'delete_to_bin';
             break;
    }

    useEffect(() => {
        // Ensure the pill is centered on initial render and status changes
        if(pillRef.current) {
            pillRef.current.style.transform = `translateX(-50%)`;
        }
    }, [currentStatus]);

    const logAction = (action: string, details: string) => {
        addAuditLog({
            adminId: currentUser.id,
            adminName: currentUser.name,
            targetUserId: user.id,
            targetUserName: user.name,
            action,
            details,
        });
    };

    // FIX: Refactored the entire handleAction function to be more type-safe, resolving type inference issues.
    const handleAction = useCallback((action: ActionType) => {
        if (action === 'delete_permanently' && onDeletePermanently) {
            onDeletePermanently(user.id, user.name);
            if (onActionSuccess) onActionSuccess(`${user.name} has been permanently deleted.`);
            return;
        }

        // Specific logic for approving a pending user
        if (action === 'approve' && (currentStatus === 'pending' || currentStatus === 'rejected')) {
            const { platformId, idField, pin, loginId } = generatePlatformCredentials(user.role, user.name, allUsers);
            const newStatus: UserStatus = (user.role === 'student' || user.role === 'parent') ? 'active' : 'approved';

            const updatedUser: User = { ...user, pin, loginId };
            if (idField === 'studentId') updatedUser.studentId = platformId;
            if (idField === 'teacherId') updatedUser.teacherId = platformId;
            if (idField === 'parentId') updatedUser.parentId = platformId;
            
            updatedUser.profile = { 
                ...profile, 
                status: newStatus, 
                deletionInfo: undefined 
            } as StudentProfile | TeacherProfile | ParentProfile;

            onUpdateUser(updatedUser);
            logAction('User Approved', `Approved user and generated credentials. New ID: ${platformId}`);
            if (onShowApprovalInfo) {
                onShowApprovalInfo(user.name, platformId, pin);
            }
            return;
        }

        let newStatus: UserStatus = currentStatus;
        let deletionDetails = profile.deletionInfo;
        let successMessage = '';
        let logDetails = { action: '', details: ''};
        
        switch(action) {
            case 'suspend': 
                newStatus = 'suspended'; 
                successMessage = `${user.name} has been suspended.`;
                logDetails = { action: 'User Suspended', details: 'Status changed to suspended.' };
                break;
            case 'remove': 
                newStatus = 'removed';
                successMessage = `${user.name} has been removed.`;
                logDetails = { action: 'User Removed', details: 'Status changed to removed.' };
                break;
            case 'reactivate':
                newStatus = user.role === 'teacher' ? 'approved' : 'active';
                successMessage = `${user.name} has been reactivated.`;
                logDetails = { action: 'User Reactivated', details: `Status changed from ${currentStatus} to ${newStatus}.`};
                break;
            case 'delete_to_bin':
                newStatus = 'deleted';
                deletionDetails = { markedForDeletionAt: Date.now(), deletionDurationMs: 15 * 24 * 60 * 60 * 1000, isDeletionViewed: false };
                successMessage = `${user.name} moved to recycle bin.`;
                logDetails = { action: 'User to Recycle Bin', details: 'User status changed to deleted, timer started.' };
                break;
            case 'retract_to_suspended':
                newStatus = 'suspended';
                successMessage = `${user.name} has been moved back to suspended.`;
                logDetails = { action: 'User Retracted', details: 'Status changed from removed to suspended.' };
                break;
             case 'reject':
                newStatus = 'rejected';
                successMessage = `Application from ${user.name} has been rejected.`;
                logDetails = { action: 'Application Rejected', details: 'User application status set to rejected.' };
                break;
        }

        if(newStatus === currentStatus) return;

        const updatedProfile = {
            ...profile,
            status: newStatus,
            deletionInfo: deletionDetails,
            isRejectedViewed: action === 'reject' ? false : profile.isRejectedViewed
        } as StudentProfile | TeacherProfile | ParentProfile;

        // When suspending, also set the isSuspensionViewed flag
        if (action === 'suspend') {
            updatedProfile.isSuspensionViewed = false;
        }
        
        if (action === 'remove') {
            updatedProfile.isRemovalViewed = false;
        }
        
        const updatedUser: User = { ...user, profile: updatedProfile };
        onUpdateUser(updatedUser);
        logAction(logDetails.action, logDetails.details);
        
        if (onActionSuccess && successMessage) {
            onActionSuccess(successMessage);
        }

    }, [user, currentStatus, profile, onUpdateUser, onActionSuccess, onShowApprovalInfo, onDeletePermanently, allUsers, addAuditLog, currentUser]);
    
    const dragStart = useCallback((clientX: number) => {
        isDragging.current = true;
        startX.current = clientX;
        if (pillRef.current) {
            pillRef.current.style.transition = 'none';
            pillRef.current.classList.add('cursor-grabbing');
            pillRef.current.classList.remove('cursor-grab');
        }
    }, []);

    const dragMove = useCallback((clientX: number) => {
        if (!isDragging.current) return;
        const dx = clientX - startX.current;
        // If no primary action, don't allow positive dx (right swipe)
        const maxDx = primaryAction ? 40 : 0;
        currentX.current = Math.max(-40, Math.min(maxDx, dx));
        if (pillRef.current) {
            pillRef.current.style.transform = `translateX(calc(-50% + ${currentX.current}px))`;
        }
    }, [primaryAction]);

    const dragEnd = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        if (pillRef.current) {
            pillRef.current.style.transition = 'transform 0.2s ease-out';
            pillRef.current.classList.add('cursor-grab');
            pillRef.current.classList.remove('cursor-grabbing');
            
            const threshold = 35;
            if (currentX.current > threshold && primaryAction) {
                handleAction(primaryAction);
            } else if (currentX.current < -threshold && secondaryAction) {
                handleAction(secondaryAction);
            }
            
            pillRef.current.style.transform = 'translateX(-50%)';
        }
        currentX.current = 0;
    }, [handleAction, primaryAction, secondaryAction]);

    useEffect(() => {
        const handleMove = (clientX: number) => { if (isDragging.current) dragMove(clientX); };
        const handleEnd = () => { if (isDragging.current) dragEnd(); };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
        const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [dragMove, dragEnd]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSwipeable) return;
        e.preventDefault();
        e.stopPropagation();
        dragStart(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isSwipeable) return;
        e.stopPropagation();
        dragStart(e.touches[0].clientX);
    };

    if (!info) {
        return <span className={`flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full bg-gray-400 w-28 h-7 capitalize`}>{currentStatus}</span>;
    }

    if (!isSwipeable) {
        return <div className={`flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full ${info.color} w-28 h-7`}>{info.text}</div>;
    }
    
    const isPending = currentStatus === 'pending';

    return (
        <div className="relative w-40 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* Background Actions */}
            <div className="absolute inset-0 flex justify-between items-center px-4">
                {/* Left Icons (secondary actions) */}
                {/* FIX: Wrapped icons in a span with a title attribute to provide a tooltip, which also resolves the TypeScript error. */}
                <div>
                    {secondaryAction === 'suspend' && <span title="Suspend"><XIcon className="w-5 h-5 text-gray-500" /></span>}
                    {secondaryAction === 'reject' && <span title="Reject"><XIcon className="w-5 h-5 text-red-500" /></span>}
                    {secondaryAction === 'remove' && <span title="Remove"><TrashIcon className="w-5 h-5 text-orange-500" /></span>}
                    {(secondaryAction === 'delete_to_bin' || secondaryAction === 'delete_permanently') && <span title="Delete"><TrashIcon className="w-5 h-5 text-red-500" /></span>}
                </div>
                
                {/* Right Icons (primary actions) */}
                <div>
                    {primaryAction === 'approve' && <span title="Approve"><CheckIcon className="w-5 h-5 text-green-500" /></span>}
                    {(primaryAction === 'reactivate' || primaryAction === 'retract_to_suspended') && <span title="Retract"><UndoIcon className="w-5 h-5 text-blue-500" /></span>}
                </div>
            </div>
            
            <div
                ref={pillRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ touchAction: 'none' }}
                className={`absolute top-0 left-1/2 w-28 h-7 flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full z-10 ${info.color} ${isSwipeable ? 'cursor-grab' : 'cursor-default'} ${isPending ? 'animate-pulse-glow-yellow' : ''}`}
            >
                {info.text}
            </div>
        </div>
    );
};

export default SwipeableStatus;