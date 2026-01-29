import React, { useRef, useCallback, useEffect } from 'react';
import { Connection, ConnectionStatus } from '../types';
import { CheckIcon, XIcon, TrashIcon, FlagIcon } from './icons/IconComponents';

interface SwipeableConnectionStatusProps {
  connection: Connection;
  onUpdateConnection: (connection: Connection) => void;
}

const statusInfo: { [key in ConnectionStatus]: { text: string, color: string } } = {
  active: { text: 'Active', color: 'bg-green-500' },
  suspended: { text: 'Suspended', color: 'bg-orange-500' },
  flagged: { text: 'Flagged', color: 'bg-yellow-500 text-yellow-800' },
  terminated: { text: 'Terminated', color: 'bg-red-600' },
};

type ActionType = 'suspend' | 'flag' | 'activate' | 'unflag' | 'terminate';

const SwipeableConnectionStatus: React.FC<SwipeableConnectionStatusProps> = ({ connection, onUpdateConnection }) => {
    const currentStatus = connection.status;
    const info = statusInfo[currentStatus];

    const pillRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);
    
    useEffect(() => {
        if(pillRef.current) {
            pillRef.current.style.transform = `translateX(-50%)`;
        }
    }, [currentStatus]);

    const handleAction = useCallback((action: ActionType) => {
        let newStatus: ConnectionStatus = currentStatus;
        switch(action) {
            case 'suspend': newStatus = 'suspended'; break;
            case 'flag': newStatus = 'flagged'; break;
            case 'activate':
            case 'unflag': newStatus = 'active'; break;
            case 'terminate': 
                if (window.confirm('Are you sure you want to permanently terminate this connection? This action cannot be undone.')) {
                    newStatus = 'terminated';
                }
                break;
        }

        if (newStatus !== currentStatus) {
            onUpdateConnection({ ...connection, status: newStatus });
        }
    }, [connection, onUpdateConnection, currentStatus]);

    let primaryAction: { type: ActionType, icon: React.ReactNode, title: string }; // Right swipe
    let secondaryAction: { type: ActionType, icon: React.ReactNode, title: string }; // Left swipe
    
    switch(currentStatus) {
        // Active: Left swipe to Suspend, Right swipe to Flag
        case 'active':
            primaryAction = { type: 'flag', icon: <FlagIcon className="w-5 h-5 text-yellow-600" />, title: 'Flag for Review' };
            secondaryAction = { type: 'suspend', icon: <XIcon className="w-5 h-5 text-orange-600" />, title: 'Suspend' };
            break;
        // Suspended: Right swipe to Reactivate, (Left swipe disabled)
        case 'suspended':
            primaryAction = { type: 'activate', icon: <CheckIcon className="w-5 h-5 text-green-600" />, title: 'Reactivate' };
            secondaryAction = { type: 'terminate', icon: <TrashIcon className="w-5 h-5 text-red-600" />, title: 'Terminate Permanently' };
            break;
        // Flagged: Left swipe to Suspend, Right swipe to Unflag (back to Active)
        case 'flagged':
            primaryAction = { type: 'unflag', icon: <CheckIcon className="w-5 h-5 text-green-600" />, title: 'Unflag and Activate' };
            secondaryAction = { type: 'suspend', icon: <XIcon className="w-5 h-5 text-orange-600" />, title: 'Suspend' };
            break;
        default:
            primaryAction = { type: 'activate', icon: <></>, title: '' };
            secondaryAction = { type: 'terminate', icon: <></>, title: '' };
    }

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
        const maxDx = 40;
        // Disable left swipe for 'suspended' status to prevent accidental termination
        const minDx = currentStatus === 'suspended' ? 0 : -40;
        currentX.current = Math.max(minDx, Math.min(maxDx, dx));
        if (pillRef.current) {
            pillRef.current.style.transform = `translateX(calc(-50% + ${currentX.current}px))`;
        }
    }, [currentStatus]);

    const dragEnd = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        if (pillRef.current) {
            pillRef.current.style.transition = 'transform 0.2s ease-out';
            pillRef.current.classList.add('cursor-grab');
            pillRef.current.classList.remove('cursor-grabbing');
            
            const threshold = 35;
            if (currentX.current > threshold) {
                handleAction(primaryAction.type);
            } else if (currentX.current < -threshold) {
                handleAction(secondaryAction.type);
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
        e.preventDefault();
        dragStart(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        dragStart(e.touches[0].clientX);
    };

    return (
        <div className="relative w-48 h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex justify-between items-center px-4">
               <span title={secondaryAction.title}>
                   {currentStatus !== 'suspended' && secondaryAction.icon}
               </span>
               <span title={primaryAction.title}>{primaryAction.icon}</span>
            </div>
            <div
                ref={pillRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ touchAction: 'none' }}
                className={`absolute top-0 left-1/2 w-32 h-8 flex items-center justify-center px-3 py-1 font-semibold text-xs leading-5 text-white rounded-full z-10 ${info.color} cursor-grab ${currentStatus === 'flagged' ? 'animate-pulse-glow-yellow' : ''}`}
            >
                {info.text}
            </div>
        </div>
    );
};

export default SwipeableConnectionStatus;