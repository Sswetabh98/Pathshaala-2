import React, { useRef, useCallback, useEffect } from 'react';
import { User, UserStatus, AdminProfile, StudentProfile, TeacherProfile, ParentProfile } from '../types';

interface RestrictedSwipeableStatusProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const statusInfo: { [key in UserStatus]?: { text: string, color: string } } = {
  active: { text: 'Active', color: 'bg-green-500' },
  approved: { text: 'Active', color: 'bg-green-500' },
  restricted: { text: 'Restricted', color: 'bg-orange-500' },
};

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const RestrictedSwipeableStatus: React.FC<RestrictedSwipeableStatusProps> = ({ user, onUpdateUser }) => {
    const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile | AdminProfile;
    const currentStatus = profile.status as 'active' | 'approved' | 'restricted';
    const info = statusInfo[currentStatus] || statusInfo.active;

    const pillRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);
    
    useEffect(() => {
        if(pillRef.current) {
            pillRef.current.style.transform = `translateX(-50%)`;
        }
    }, [currentStatus]);

    const handleAction = useCallback(() => {
        // Toggle between 'restricted' and 'active'
        const newStatus = (currentStatus === 'restricted') ? 'active' : 'restricted';
        
        const updatedUser = {
            ...user,
            profile: { ...profile, status: newStatus as any }
        };
        onUpdateUser(updatedUser);
    }, [user, onUpdateUser, currentStatus, profile]);
    
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
        // Constrain to only allow left movement (negative dx)
        const constrainedDx = Math.min(0, dx);
        currentX.current = Math.max(-40, constrainedDx);
        if (pillRef.current) {
            pillRef.current.style.transform = `translateX(calc(-50% + ${currentX.current}px))`;
        }
    }, []);

    const dragEnd = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        if (pillRef.current) {
            pillRef.current.style.transition = 'transform 0.2s ease-out';
            pillRef.current.classList.add('cursor-grab');
            pillRef.current.classList.remove('cursor-grabbing');
            
            const threshold = -35;
            if (currentX.current < threshold) {
                handleAction();
            }
            
            pillRef.current.style.transform = 'translateX(-50%)';
        }
        currentX.current = 0;
    }, [handleAction]);

    useEffect(() => {
        const handleMove = (clientX: number) => {
            if (isDragging.current) dragMove(clientX);
        };
        const handleEnd = () => {
            if (isDragging.current) dragEnd();
        };

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
        e.preventDefault();
        dragStart(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        dragStart(e.touches[0].clientX);
    };

    return (
        <div className="relative w-40 h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* Background Action */}
            <div className="absolute inset-0 flex justify-start items-center pl-4">
                 <LockIcon />
            </div>
            
            <div
                ref={pillRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ touchAction: 'none' }}
                className={`absolute top-0 left-1/2 w-28 h-7 flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full z-10 ${info.color} cursor-grab`}
            >
                {info.text}
            </div>
        </div>
    );
};

export default RestrictedSwipeableStatus;
