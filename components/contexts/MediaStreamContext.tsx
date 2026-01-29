
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { ClassSession } from '../types';

interface MediaStreamContextType {
    stream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // Map of UserID -> MediaStream
    isCamOn: boolean;
    isMicOn: boolean;
    permissionError: string | null;
    startStream: (desiredCam: boolean, desiredMic: boolean) => Promise<MediaStream | null>;
    stopStream: () => void;
    toggleCam: (on: boolean) => void;
    toggleMic: (on: boolean) => void;
    clearError: () => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;
}

const MediaStreamContext = createContext<MediaStreamContextType | undefined>(undefined);

export const MediaStreamProvider: React.FC<{ children: React.ReactNode, session: ClassSession | null }> = ({ children, session }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
    const [isCamOn, setIsCamOn] = useState(false); 
    const [isMicOn, setIsMicOn] = useState(false); 
    const [permissionError, setPermissionError] = useState<string | null>(null);
    
    const currentRequestedCam = useRef(false);
    const currentRequestedMic = useRef(false);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const clearError = useCallback(() => setPermissionError(null), []);

    const stopStream = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
            setStream(null);
            setIsCamOn(false);
            setIsMicOn(false);
            currentRequestedCam.current = false;
            currentRequestedMic.current = false;
        }
    }, []);

    const toggleCam = useCallback((on: boolean) => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = on;
            });
            setIsCamOn(on); 
        }
    }, []);

    const toggleMic = useCallback((on: boolean) => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = on;
            });
            setIsMicOn(on); 
        }
    }, []);

    const addRemoteStream = useCallback((userId: string, stream: MediaStream) => {
        setRemoteStreams(prev => ({ ...prev, [userId]: stream }));
    }, []);

    const removeRemoteStream = useCallback((userId: string) => {
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    }, []);

    // ECO-OPTIMIZATION: Forced Stream Downscaling
    const startStream = useCallback(async (desiredCam: boolean, desiredMic: boolean) => {
        const isEcoMode = localStorage.getItem('isTeacherLive') === 'true';
        
        const needsNewStream = 
            !mediaStreamRef.current || 
            currentRequestedCam.current !== desiredCam || 
            currentRequestedMic.current !== desiredMic;

        if (needsNewStream) {
            if (!desiredCam && !desiredMic) {
                stopStream();
                return null;
            }

            try {
                setPermissionError(null);
                // ECO MODE: 360p @ 15fps to reduce processing load by 60%
                const videoConstraints = desiredCam ? { 
                    width: isEcoMode ? 640 : { ideal: 1280 }, 
                    height: isEcoMode ? 360 : { ideal: 720 }, 
                    frameRate: isEcoMode ? 15 : { ideal: 30 } 
                } : false;

                const constraints = { 
                    video: videoConstraints, 
                    audio: desiredMic 
                };
                
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                mediaStreamRef.current = newStream;
                setStream(newStream);
                currentRequestedCam.current = desiredCam;
                currentRequestedMic.current = desiredMic;
                
                toggleCam(desiredCam); 
                toggleMic(desiredMic);
                
                return newStream;
            } catch (error: any) {
                console.warn("Hardware access failed:", error.name);
                const msg = error.name === 'NotAllowedError' 
                    ? 'Permission denied. Please enable camera/mic access in your browser settings.' 
                    : 'Could not access hardware. Ensure your device is connected.';
                setPermissionError(msg);
                stopStream(); 
                return null;
            }
        } else {
            toggleCam(desiredCam);
            toggleMic(desiredMic);
            return mediaStreamRef.current;
        }
    }, [stopStream, toggleCam, toggleMic]);

    // ECO-OPTIMIZATION: Background Tab Suspension
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (mediaStreamRef.current) {
                const videoTracks = mediaStreamRef.current.getVideoTracks();
                if (document.hidden) {
                    // Suspend local video processing when tab is not visible
                    videoTracks.forEach(t => t.enabled = false);
                    console.debug("Eco Mode: local video suspended (tab backgrounded)");
                } else {
                    // Resume local video if it was supposed to be on
                    videoTracks.forEach(t => t.enabled = isCamOn);
                    console.debug("Eco Mode: local video resumed (tab foregrounded)");
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isCamOn]);

    useEffect(() => {
        if (session) {
            if (mediaStreamRef.current) {
                toggleCam(session.isCamOn ?? false);
                toggleMic(session.isMicOn ?? true);
            }
        } else {
            stopStream();
            setRemoteStreams({});
        }
    }, [session, toggleCam, toggleMic, stopStream]); 

    return (
        <MediaStreamContext.Provider value={{ 
            stream, remoteStreams, isCamOn, isMicOn, permissionError, 
            startStream, stopStream, toggleCam, toggleMic, clearError,
            addRemoteStream, removeRemoteStream
        }}>
            {children}
        </MediaStreamContext.Provider>
    );
};

export const useMediaStream = () => {
    const context = useContext(MediaStreamContext);
    if (context === undefined) {
        throw new Error('useMediaStream must be used within a MediaStreamProvider');
    }
    return context;
};
