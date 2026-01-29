import React, { FC, useEffect, useState, useCallback } from 'react';
import { User, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import { PlayIcon, PauseIcon } from './icons/IconComponents';

interface TimerControlProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onTimerExpired: () => void;
}

const formatTime = (ms: number): string => {
    if (ms <= 0) return 'Expired';

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s left`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s left`;
    }
    return `${seconds}s left`;
};


const TimerControl: FC<TimerControlProps> = ({ user, onUpdateUser, onTimerExpired }) => {
    const profile = user.profile as StudentProfile | TeacherProfile | ParentProfile;
    const deletionInfo = profile.deletionInfo;
    const [timeLeft, setTimeLeft] = useState('');

    const handleTogglePause = useCallback(() => {
        if (!deletionInfo) return;

        let updatedDeletionInfo;

        if (deletionInfo.isPaused) { // Resuming timer
            const totalDuration = deletionInfo.deletionDurationMs;
            const remainingTime = deletionInfo.remainingTimeAtPause || 0;
            const newEndTime = Date.now() + remainingTime;
            const newMarkedForDeletionAt = newEndTime - totalDuration;
            
            updatedDeletionInfo = {
                ...deletionInfo,
                isPaused: false,
                remainingTimeAtPause: undefined,
                markedForDeletionAt: newMarkedForDeletionAt,
            };
        } else { // Pausing timer
            const endTime = deletionInfo.markedForDeletionAt + deletionInfo.deletionDurationMs;
            const remainingTime = Math.max(0, endTime - Date.now());

            updatedDeletionInfo = {
                ...deletionInfo,
                isPaused: true,
                remainingTimeAtPause: remainingTime,
            };
        }

        const updatedUser = {
            ...user,
            profile: { ...profile, deletionInfo: updatedDeletionInfo }
        };
        onUpdateUser(updatedUser);
    }, [user, profile, deletionInfo, onUpdateUser]);

    useEffect(() => {
        if (!deletionInfo) {
            setTimeLeft('');
            return;
        }

        if (deletionInfo.isPaused) {
            setTimeLeft(formatTime(deletionInfo.remainingTimeAtPause || 0));
            return; // No interval needed when paused
        }

        let interval: number | undefined;
        const calculateTimeLeft = () => {
            const now = Date.now();
            const endTime = deletionInfo.markedForDeletionAt + deletionInfo.deletionDurationMs;
            const remaining = endTime - now;

            if (remaining <= 0) {
                setTimeLeft('Expired');
                onTimerExpired();
                if (interval) clearInterval(interval);
            } else {
                setTimeLeft(formatTime(remaining));
            }
        };

        calculateTimeLeft(); // Initial calculation
        interval = window.setInterval(calculateTimeLeft, 1000); // Update every second for accuracy

        return () => clearInterval(interval);

    }, [deletionInfo, onTimerExpired]);

    if (!timeLeft) return null;
    
    const isPaused = deletionInfo?.isPaused;

    return (
        <button
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-semibold text-white transition-colors shadow-md ${
                isPaused 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
        >
            {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
            <span>{timeLeft}</span>
        </button>
    );
};

export default TimerControl;