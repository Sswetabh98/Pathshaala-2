import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, ClassSession, ClassChatMessage } from '../types';
import { 
    MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, TrashIcon, WhiteboardIcon, XIcon, ExpandIcon, UsersIcon, DiamondIcon, ArrowLeftIcon, MessageIcon, SettingsIcon, ClockIcon, DashboardIcon, EditIcon, EraserIcon, TextIcon, UndoIcon, RedoIcon, DownloadIcon, HandIcon, ShareIcon, ExclamationTriangleIcon, ShieldCheckIcon, SpinnerIcon
} from './icons/IconComponents';
import { useMediaStream } from '../contexts/MediaStreamContext';
import { useWebRTC } from '../hooks/useWebRTC';

interface VirtualClassroomProps {
    user: User; allUsers: User[]; session: ClassSession;
    onLeaveClass: (chatHistory: ClassChatMessage[], whiteboardSnapshot: string | null) => void;
    isTeacher: boolean;
    onGoToDashboard: () => void;
    initialWhiteboardState?: string | null;
    onWhiteboardUpdate?: (data: string | null) => void;
    onWhiteboardUpdateBatch?: (data: string | null) => void;
    onUpdateSession?: (session: ClassSession) => void;
    onLiveRoomActive?: (isActive: boolean) => void;
}

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
};

const ShrinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
);

export const ClassroomPip: React.FC<{
    pipContent: { type: 'video' | 'whiteboard', data: string | null };
    session: ClassSession;
    onGoToClassroom: () => void;
    onGoToDashboard?: () => void;
    onClose: () => void;
}> = ({ pipContent, session, onGoToClassroom, onGoToDashboard, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { stream } = useMediaStream();
    const [time, setTime] = useState(Date.now() - session.startedAt);

    const [position, setPosition] = useState({ x: window.innerWidth - 320 - 24, y: window.innerHeight - 240 - 24 });
    const dragInfo = useRef<{ isDragging: boolean; hasDragged: boolean; startX: number; startY: number; initialX: number; initialY: number; } | false>(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragInfo.current = {
            isDragging: true,
            hasDragged: false,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (dragInfo.current && dragInfo.current.isDragging) {
            if (!dragInfo.current.hasDragged && (Math.abs(e.clientX - dragInfo.current.startX) > 5 || Math.abs(e.clientY - dragInfo.current.startY) > 5)) {
                dragInfo.current.hasDragged = true;
            }
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            setPosition({
                x: dragInfo.current.initialX + dx,
                y: dragInfo.current.initialY + dy,
            });
        }
    };

    const handleMouseUp = () => {
        if (dragInfo.current && !dragInfo.current.hasDragged) {
            onGoToClassroom();
        }
        dragInfo.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(Date.now() - session.startedAt);
        }, 1000);
        return () => clearInterval(timer);
    }, [session.startedAt]);

    useEffect(() => {
        if (videoRef.current && stream && pipContent.type === 'video' && session.isCamOn) {
            videoRef.current.srcObject = stream;
        } else if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream, session.isCamOn, pipContent.type]);

    return (
        <div 
            onMouseDown={handleMouseDown}
            style={{ top: position.y, left: position.x }}
            className="fixed w-80 h-60 z-[100] bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn border-2 border-indigo-500 cursor-grab group hover:shadow-indigo-500/50 transition-shadow"
        >
            <header className="flex-shrink-0 p-2 flex justify-between items-center bg-black/30 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-white text-xs font-bold">LIVE</span>
                    <span className="text-slate-400 text-xs font-mono">{formatTime(Math.floor(time / 1000))}</span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-1 text-white hover:bg-white/20 rounded-full z-10 pointer-events-auto" 
                    title="Close Preview"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </header>
            <div className="flex-1 relative pointer-events-none">
                {pipContent.type === 'video' ? (
                    session.isCamOn ? (
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                            <VideoOffIcon className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Camera Off</p>
                        </div>
                    )
                ) : (
                    pipContent.data ? (
                        <img src={pipContent.data} alt="Whiteboard Snapshot" className="w-full h-full object-contain bg-white" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 text-indigo-400">
                             <WhiteboardIcon className="w-10 h-10 mb-2 opacity-50" />
                             <p className="text-xs font-black uppercase tracking-widest">Live Canvas</p>
                             <p className="text-[10px] opacity-60">Waiting for first stroke...</p>
                        </div>
                    )
                )}
                
                {!session.isMicOn && (
                    <div className="absolute top-2 left-2 bg-red-600/80 backdrop-blur-md p-1.5 rounded-lg border border-red-400/50 shadow-lg animate-pulse pointer-events-auto">
                        <MicOffIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                )}

                {session.isHandRaised && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg animate-bounce pointer-events-auto">
                        <HandIcon className="w-5 h-5" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <ExpandIcon className="w-8 h-8 text-white"/>
                </div>
                <p className="absolute bottom-2 left-3 text-white font-semibold capitalize drop-shadow-md text-xs">{pipContent.type} View</p>
            </div>
        </div>
    );
};


const VolumeMeter: React.FC<{ audioLevel: number; isMicOn: boolean }> = ({ audioLevel, isMicOn }) => {
    const normalizedLevel = isMicOn ? (audioLevel / 255) * 100 : 0;

    const Bar: React.FC<{ height: number, delay: string }> = ({ height, delay }) => (
        <div className="w-1 h-4 bg-slate-600/50 rounded-full flex items-end overflow-hidden">
            <div 
                className={`w-full bg-green-400 rounded-full transition-all duration-100 ease-out`}
                style={{ height: `${height}%`, transitionDelay: delay }}
            />
        </div>
    );

    const bar1Height = isMicOn ? Math.min(100, Math.max(0, normalizedLevel * 4)) : 0;
    const bar2Height = isMicOn ? Math.min(100, Math.max(0, (normalizedLevel - 15) * 5)) : 0;
    const bar3Height = isMicOn ? Math.min(100, Math.max(0, (normalizedLevel - 30) * 6)) : 0;
    
    return (
        <div className="flex items-end gap-0.5">
            <Bar height={bar1Height} delay="0ms" />
            <Bar height={bar2Height} delay="50ms" />
            <Bar height={bar3Height} delay="100ms" />
        </div>
    );
};


const ClassroomLobby: React.FC<{ 
    user: User; 
    isTeacher: boolean; 
    onEnter: () => void; 
    onLeave: () => void; 
    isMicOn: boolean; 
    setIsMicOn: (on: boolean) => void; 
    isCamOn: boolean; 
    setIsCamOn: (on: boolean) => void;
    isExiting: boolean;
    isStudentOnline: boolean;
}> = ({ user, isTeacher, onEnter, onLeave, isMicOn, setIsMicOn, isCamOn, setIsCamOn, isExiting, isStudentOnline }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { startStream, stream, permissionError, clearError } = useMediaStream();
    const [audioLevel, setAudioLevel] = useState(0);
    const [isActivating, setIsActivating] = useState(false);

    const handleGrantAccess = useCallback(async () => {
        setIsActivating(true);
        clearError();
        const s = await startStream(true, true);
        if (s) {
            setIsCamOn(true);
            setIsMicOn(true);
        }
        setIsActivating(false);
    }, [startStream, clearError, setIsCamOn, setIsMicOn]);

    useEffect(() => {
        if (!stream && !permissionError && !isActivating) {
            handleGrantAccess();
        }
    }, [stream, permissionError, isActivating, handleGrantAccess]);

    useEffect(() => {
        let active = true;
        const bindStream = () => {
            if (!active) return;
            if (videoRef.current && stream && isCamOn) {
                if (videoRef.current.srcObject !== stream) {
                    videoRef.current.srcObject = stream;
                }
            } else if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
        requestAnimationFrame(() => {
            bindStream();
            requestAnimationFrame(bindStream);
        });
        return () => { active = false; };
    }, [stream, isCamOn]);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let audioFrame: number;

        const cleanup = () => {
            if (audioFrame) cancelAnimationFrame(audioFrame);
            setAudioLevel(0);
            audioContext?.close().catch(console.error);
        };

        if (stream && isMicOn) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 32;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const loop = () => {
                if (!analyser) return;
                
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
                setAudioLevel(avg);
                audioFrame = requestAnimationFrame(loop);
            };
            audioFrame = requestAnimationFrame(loop);
        } else {
            cleanup();
        }

        return cleanup;
    }, [stream, isMicOn]);

    return (
        <div className={`w-full h-full flex flex-col items-center bg-slate-900 text-white transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full max-w-5xl flex flex-col flex-grow justify-center p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-3/5">
                        <div className="aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center relative">
                            {stream && isCamOn && !permissionError ? (
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-500 text-center p-6">
                                    {permissionError ? (
                                        <>
                                            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
                                            <p className="text-sm font-bold text-red-200 uppercase tracking-widest">{permissionError}</p>
                                            <p className="text-xs text-slate-400 mt-2">Click the lock icon in your address bar to reset permissions.</p>
                                        </>
                                    ) : (
                                        <>
                                            <VideoOffIcon className="w-12 h-12 mb-3 opacity-30" />
                                            <p className="text-lg">Hardware check required</p>
                                            <span className="text-[10px] font-black text-slate-600 mt-2">INITIALIZING STREAM...</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full text-xs font-semibold">{user.name} (Lobby)</div>
                            {stream && (
                                <div className={`absolute bottom-3 right-3 p-1 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isMicOn ? <MicIcon className="w-4 h-4"/> : <MicOffIcon className="w-4 h-4"/>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full md:w-2/5 flex flex-col space-y-6">
                         <div className="flex items-start gap-3">
                             <DiamondIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"/>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold tracking-tighter uppercase">Pre-flight Lobby</h2>
                                <p className="text-slate-400 font-medium">Verify connection & equipment</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-2">
                             <p className="text-xs uppercase font-black text-slate-500">Hardware Status</p>
                             <p className="text-sm flex items-center gap-2">
                                {stream ? <span className="text-green-400 font-black tracking-widest">READY</span> : permissionError ? <span className="text-red-400 font-black tracking-widest">BLOCKED</span> : <span className="text-amber-400 font-black tracking-widest animate-pulse">PENDING...</span>}
                             </p>
                        </div>
                        {!stream ? (
                            <button 
                                onClick={handleGrantAccess} 
                                disabled={isActivating}
                                className="w-full btn-primary py-4 text-base font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 uppercase tracking-widest"
                            >
                                {isActivating ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : <ShieldCheckIcon className="w-6 h-6"/>}
                                <span>Activate Media Stream</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-4 animate-fadeIn">
                                <button onClick={() => setIsMicOn(!isMicOn)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isMicOn ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-red-500 text-white shadow-lg'}`}>
                                    {isMicOn ? <MicIcon className="w-4 h-4"/> : <MicOffIcon className="w-4 h-4"/>}
                                    <span>{isMicOn ? 'Mic On' : 'Mic Off'}</span>
                                    <VolumeMeter audioLevel={audioLevel} isMicOn={isMicOn} />
                                </button>
                                <button onClick={() => setIsCamOn(!isCamOn)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isCamOn ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-red-500 text-white shadow-lg'}`}>
                                    {isCamOn ? <VideoIcon className="w-4 h-4"/> : <VideoOffIcon className="w-4 h-4"/>}
                                    <span>{isCamOn ? 'Cam On' : 'Cam Off'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="w-full mt-auto py-6 px-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    {isTeacher && (
                            <button onClick={onLeave} className="btn-secondary py-4 px-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl border-white/10 text-white">
                            <ArrowLeftIcon className="w-5 h-5"/>
                            <span>Back</span>
                        </button>
                    )}
                    <button 
                        onClick={onEnter} 
                        disabled={!stream}
                        className={`flex-grow btn-primary py-5 text-lg font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-2xl shadow-indigo-600/20 transition-all ${isStudentOnline ? 'animate-pulse' : ''}`}
                    >
                        {isTeacher ? 'START CLASS NOW' : 'JOIN CLASSROOM STAGE'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClassroomHUD = React.memo(({ startTime, connectionState }: { startTime: number, connectionState: string }) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    useEffect(() => {
        const timer = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(formatTime(seconds));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    const isEcoMode = localStorage.getItem('isTeacherLive') === 'true';

    return (
        <header className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-center gap-4 pointer-events-none">
            {isEcoMode && (
                <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl animate-fadeIn pointer-events-auto flex items-center gap-2 border border-emerald-400/50">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>Memory Eco Mode Active</span>
                </div>
            )}
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-lg font-mono text-white pointer-events-auto shadow-lg border border-white/10">
                <ClockIcon className="w-5 h-5 text-indigo-400" />
                <span>{elapsedTime}</span>
            </div>
            <div className={`flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto border border-white/10 shadow-lg`}>
                <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className={connectionState === 'connected' ? 'text-green-400' : 'text-yellow-400'}>{connectionState}</span>
            </div>
        </header>
    );
});

const RightPanel = React.memo(({ title, isOpen, onClose, children, zIndexClass = 'z-50' }: { title: string; isOpen: boolean; onClose: () => void; children: React.ReactNode; zIndexClass?: string }) => {
    return (
        <div className={`fixed top-20 bottom-24 right-4 h-[calc(100%-176px)] w-[calc(100%-48px)] max-w-[360px] bg-slate-900/90 backdrop-blur-[25px] shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col border border-white/10 rounded-[24px] overflow-hidden ${zIndexClass} ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-white/10 bg-black/20">
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><XIcon className="w-6 h-6" /></button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto participant-list-scrollbar min-h-0">
                {children}
            </div>
        </div>
    );
});

const ChatSidebar: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    messages: ClassChatMessage[];
    onSendMessage: (text: string) => void;
    currentUser: User;
    userPicUrl: string;
}> = ({ isOpen, onClose, messages, onSendMessage, currentUser, userPicUrl }) => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (inputMessage.trim()) {
            onSendMessage(inputMessage.trim());
            setInputMessage('');
        }
    };

    return (
        <div className={`fixed top-20 bottom-24 right-4 h-[calc(100%-176px)] w-[calc(100%-48px)] max-w-[360px] bg-slate-900/90 backdrop-blur-[25px] shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 flex flex-col border border-white/10 rounded-[24px] overflow-hidden ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-white/10 bg-black/20">
                <h3 className="text-xl font-bold tracking-tight">Chat</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><XIcon className="w-6 h-6" /></button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 participant-list-scrollbar min-h-0">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <MessageIcon className="w-12 h-12 mb-2" />
                        <p className="text-sm">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.user === currentUser.name ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-2.5 rounded-2xl shadow-sm ${msg.user === currentUser.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none'}`}>
                                <p className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">{msg.user}</p>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <p className="text-[9px] text-white/40 text-right mt-1 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="flex-shrink-0 p-4 border-t border-white/10 flex items-center gap-2 bg-slate-950">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/5 text-sm"
                />
                <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                    <ShareIcon className="w-5 h-5" />
                </button>
            </footer>
        </div>
    );
};

const EndClassConfirmationModal = React.memo(({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-scaleIn border border-white/10">
                <h2 className="text-2xl font-bold">End Class Session?</h2>
                <p className="mt-2 text-slate-400">This will end the session for all participants.</p>
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={onCancel} className="btn-secondary px-8 py-3 rounded-xl border-white/10 text-white">Cancel</button>
                    <button onClick={onConfirm} className="px-8 py-3 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700">Confirm & End</button>
                </div>
            </div>
        </div>
    );
});

interface TextSettings {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    underline: boolean;
    textAlign: 'left' | 'center' | 'right';
}

/**
 * Sophisticated Unread Notification Dot UI
 */
const NotificationDot = () => (
    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-scale-pulse-indigo z-10" />
);

export const VirtualClassroom: React.FC<VirtualClassroomProps> = (props) => {
    const isSessionAlreadyActive = (Date.now() - props.session.startedAt) > 10000;
    const [isInLobby, setIsInLobby] = useState(!isSessionAlreadyActive);
    const classroomRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const { stream, toggleCam, toggleMic, remoteStreams, startStream, stopStream } = useMediaStream();
    
    // Unread Chat State Initialization
    const [unreadCount, setUnreadCount] = useState(0);
    const prevHistoryLength = useRef(props.session.chatHistory?.length || 0);

    // AUTO-ACTIVATE STREAM: If student skips lobby or stream is lost, force activation
    useEffect(() => {
        if (!isInLobby && !stream) {
            console.debug("VirtualClassroom: Auto-activating stream (skipped lobby)");
            startStream(props.session.isCamOn ?? true, props.session.isMicOn ?? true);
        }
    }, [isInLobby, stream, startStream, props.session.isCamOn, props.session.isMicOn]);

    const targetUserId = useMemo(() => {
        if (props.isTeacher) {
            return props.session.studentIds[0] || null;
        } else {
            return props.session.teacherId || null;
        }
    }, [props.isTeacher, props.session]);

    const [isMicOn, setIsMicOn] = useState(props.session.isMicOn ?? true);
    const [isCamOn, setIsCamOn] = useState(props.session.isCamOn ?? true);
    const [isWhiteboardActive, setIsWhiteboardActive] = useState(props.session.mainView === 'whiteboard');
    const [connectionState, setConnectionState] = useState('connecting');
    
    const [isExitingLobby, setIsExitingLobby] = useState(false);
    const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [mirrorVideo, setMirrorVideo] = useState(true);
    const [noiseSuppression, setNoiseSuppression] = useState(true);
    const [handRaiseToast, setHandRaiseToast] = useState<{ studentName: string } | null>(null);
    
    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const MAX_STACK_SIZE = 10;

    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // DRAWING REFS
    const onWhiteboardUpdateRef = useRef(props.onWhiteboardUpdate);
    onWhiteboardUpdateRef.current = props.onWhiteboardUpdate;
    const isTeacherRef = useRef(props.isTeacher);
    isTeacherRef.current = props.isTeacher;

    const drawSnapshot = useCallback((data: string) => {
        if (!data || !mainContextRef.current || !mainCanvasRef.current) return;
        const ctx = mainContextRef.current;
        const canvas = mainCanvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            ctx.drawImage(img, 0, 0, logicalWidth, logicalHeight);
            canvasSnapshotRef.current = data;
            if (onWhiteboardUpdateRef.current) onWhiteboardUpdateRef.current(data);
        };
        img.src = data;
    }, []);

    // REAL-TIME SYNC: Data received from peer
    const onDataReceived = useCallback((payload: any) => {
        if (payload.type === 'DRAW_EVENT' && !props.isTeacher) {
            drawSnapshot(payload.data);
        } else if (payload.type === 'VIEW_CHANGE') {
            setIsWhiteboardActive(payload.data === 'whiteboard');
        } else if (payload.type === 'HAND_RAISE') {
            if (props.onUpdateSession) {
                props.onUpdateSession({ ...props.session, isHandRaised: payload.data });
            }
        }
    }, [drawSnapshot, props.isTeacher, props.session, props.onUpdateSession]);

    const { createCallOffer, handleSignalingMessage, sendData, cleanup: cleanupRTC } = useWebRTC(props.user.id, targetUserId, onDataReceived);

    // VIEW SYNC WRAPPER
    const handleToggleWhiteboard = () => {
        const nextState = !isWhiteboardActive;
        setIsWhiteboardActive(nextState);
        sendData({ type: 'VIEW_CHANGE', data: nextState ? 'whiteboard' : 'video' });
    };

    // HAND RAISE SYNC WRAPPER
    const toggleHandRaise = () => {
        const nextState = !props.session.isHandRaised;
        if (props.onUpdateSession) {
            props.onUpdateSession({
                ...props.session,
                isHandRaised: nextState
            });
        }
        sendData({ type: 'HAND_RAISE', data: nextState });
    };

    // Unread Chat Logic: Track messages when panel is closed
    useEffect(() => {
        const currentLength = props.session.chatHistory?.length || 0;
        if (activeSidebar !== 'chat' && currentLength > prevHistoryLength.current) {
            setUnreadCount(prev => prev + (currentLength - prevHistoryLength.current));
        }
        prevHistoryLength.current = currentLength;
    }, [props.session.chatHistory?.length, activeSidebar]);

    useEffect(() => {
        if (props.isTeacher && !isInLobby && props.session.isActive) {
            localStorage.setItem('isTeacherLive', 'true');
        } else if (props.isTeacher && isInLobby) {
            localStorage.removeItem('isTeacherLive');
        }

        return () => {
            if (props.isTeacher) {
                localStorage.removeItem('isTeacherLive');
            }
        };
    }, [props.isTeacher, isInLobby, props.session.isActive]);

    useEffect(() => {
        if (props.onLiveRoomActive) {
            props.onLiveRoomActive(!isInLobby);
        }
    }, [isInLobby, props.onLiveRoomActive]);

    useEffect(() => {
        if (props.onUpdateSession) {
            props.onUpdateSession({
                ...props.session,
                mainView: isWhiteboardActive ? 'whiteboard' : 'video',
                isCamOn,
                isMicOn
            });
        }
        toggleCam(isCamOn);
        toggleMic(isMicOn);
    }, [isWhiteboardActive, isCamOn, isMicOn, props.session.id, toggleCam, toggleMic]);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            classroomRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const updateStackIndicators = useCallback(() => {
        setCanUndo(undoStack.current.length > 1);
        setCanRedo(redoStack.current.length > 0);
    }, []);

    const pushToUndoStack = useCallback((snapshot: string) => {
        if (!snapshot) return;
        undoStack.current.push(snapshot);
        if (undoStack.current.length > MAX_STACK_SIZE) {
            undoStack.current.shift();
        }
        redoStack.current = [];
        updateStackIndicators();
    }, [updateStackIndicators]);

    const [textEditor, setTextEditor] = useState<{ 
        x: number, 
        y: number, 
        value: string,
        settings: TextSettings
    } | null>(null);
    const [isTextFocused, setIsTextFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const mainContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const tempContextRef = useRef<CanvasRenderingContext2D | null>(null);

    const canvasSnapshotRef = useRef<string | null>(props.initialWhiteboardState || null);
    
    const [drawingSettings, setDrawingSettings] = useState({ color: '#000000', penSize: 2, eraserSize: 20, tool: 'pen' });
    
    const settingsRef = useRef(drawingSettings);
    useEffect(() => {
        settingsRef.current = drawingSettings;
    }, [drawingSettings]);

    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const penCursorUrl = useMemo(() => {
        const size = Math.min(32, Math.max(12, drawingSettings.penSize * 2));
        return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="${encodeURIComponent(drawingSettings.color)}" stroke="white" stroke-width="1"/></svg>') ${size/2} ${size/2}, auto`;
    }, [drawingSettings.penSize, drawingSettings.color]);

    const eraserCursorUrl = useMemo(() => {
        const size = Math.min(64, Math.max(16, drawingSettings.eraserSize));
        return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect x="1" y="1" width="${size-2}" height="${size-2}" rx="2" fill="white" stroke="black" stroke-width="1.5"/></svg>') ${size/2} ${size/2}, auto`;
    }, [drawingSettings.eraserSize]);

    const participants = useMemo(() => {
        return [props.user, ...props.allUsers.filter(u => props.session.studentIds.includes(u.id) && u.id !== props.user.id)]
    }, [props.user, props.allUsers, props.session]);

    const classChatMessages = useMemo(() => props.session.chatHistory || [], [props.session.chatHistory]);
    const chatUser = props.user.name;

    const handleSendChatMessage = (text: string) => {
        if (props.onUpdateSession) {
            const newMessage: ClassChatMessage = { user: chatUser, text, timestamp: Date.now() };
            props.onUpdateSession({
                ...props.session,
                chatHistory: [...(props.session.chatHistory || []), newMessage]
            });
        }
    };

    useEffect(() => {
        if (textEditor && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [textEditor]);

    useEffect(() => {
        if (props.isTeacher && props.session.isHandRaised && !handRaiseToast) {
            const student = props.allUsers.find(u => u.id === props.session.studentIds[0]);
            if (student) {
                setHandRaiseToast({ studentName: student.name });
                const timer = setTimeout(() => setHandRaiseToast(null), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [props.isTeacher, props.session.isHandRaised, props.allUsers, props.session.studentIds, handRaiseToast]);

    // Robust Video Bindings
    useEffect(() => {
        let active = true;
        const bindLocal = () => {
            if (!active) return;
            if (localVideoRef.current && stream && isCamOn) {
                if (localVideoRef.current.srcObject !== stream) {
                    localVideoRef.current.srcObject = stream;
                }
            } else if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
        };
        bindLocal();
        const id = requestAnimationFrame(bindLocal);
        return () => { active = false; cancelAnimationFrame(id); };
    }, [isInLobby, stream, isCamOn, isWhiteboardActive]);

    useEffect(() => {
        let active = true;
        const bindRemote = () => {
            if (!active) return;
            if (remoteVideoRef.current && targetUserId) {
                const remoteStream = remoteStreams[targetUserId];
                if (remoteStream) {
                    if (remoteVideoRef.current.srcObject !== remoteStream) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                    setConnectionState('connected');
                } else {
                    remoteVideoRef.current.srcObject = null;
                    setConnectionState('connecting');
                }
            }
        };
        bindRemote();
        const id = requestAnimationFrame(bindRemote);
        return () => { active = false; cancelAnimationFrame(id); };
    }, [remoteStreams, targetUserId, isWhiteboardActive, isInLobby]);

    useEffect(() => {
        if (!isInLobby && targetUserId) {
            const isLive = props.isTeacher || localStorage.getItem('isTeacherLive') === 'true';
            if (isLive) {
                createCallOffer();
            } else {
                setConnectionState('awaiting mentor');
                const timer = setInterval(() => {
                    if (localStorage.getItem('isTeacherLive') === 'true') {
                        createCallOffer();
                        clearInterval(timer);
                    }
                }, 3000);
                return () => clearInterval(timer);
            }
        }
    }, [isInLobby, targetUserId, createCallOffer, props.isTeacher]);

    useEffect(() => {
        if (!isWhiteboardActive) return;
        const tempCtx = tempContextRef.current;
        if (!tempCtx) return;

        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        tempCtx.globalCompositeOperation = 'source-over';

        if (drawingSettings.tool === 'eraser') {
            tempCtx.strokeStyle = '#000000'; 
            tempCtx.lineWidth = drawingSettings.eraserSize;
        } else {
            tempCtx.strokeStyle = drawingSettings.color;
            tempCtx.lineWidth = drawingSettings.penSize;
        }
    }, [drawingSettings, isWhiteboardActive]);

    const handleUndo = useCallback(() => {
        if (undoStack.current.length <= 1) return;
        const current = undoStack.current.pop()! || '';
        redoStack.current.push(current);
        const previous = undoStack.current[undoStack.current.length - 1];
        drawSnapshot(previous);
        updateStackIndicators();
        if (isTeacherRef.current) {
            sendData({ type: 'DRAW_EVENT', data: previous });
        }
    }, [drawSnapshot, updateStackIndicators, sendData]);

    const handleRedo = useCallback(() => {
        if (redoStack.current.length === 0) return;
        const state = redoStack.current.pop()! || '';
        undoStack.current.push(state);
        drawSnapshot(state);
        updateStackIndicators();
        if (isTeacherRef.current) {
            sendData({ type: 'DRAW_EVENT', data: state });
        }
    }, [drawSnapshot, updateStackIndicators, sendData]);

    const handleDownload = useCallback(() => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `Pathshaala-Whiteboard-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, []);

    useEffect(() => {
        if (!isWhiteboardActive) return;

        const mainCanvas = mainCanvasRef.current;
        const tempCanvas = tempCanvasRef.current;
        if (!mainCanvas || !tempCanvas) return;

        const mainContext = mainCanvas.getContext('2d');
        const tempContext = tempCanvas.getContext('2d');
        if (!mainContext || !tempContext) return;

        mainContextRef.current = mainContext;
        tempContextRef.current = tempContext;

        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            const parent = mainCanvas.parentElement;
            if (!parent) return;
            const { clientWidth, clientHeight } = parent;
            
            if (mainCanvas.width !== clientWidth * dpr || mainCanvas.height !== clientHeight * dpr) {
                const currentContent = canvasSnapshotRef.current;
                
                mainCanvas.width = clientWidth * dpr;
                mainCanvas.height = clientHeight * dpr;
                tempCanvas.width = clientWidth * dpr;
                tempCanvas.height = clientHeight * dpr;

                mainCanvas.style.width = `${clientWidth}px`;
                mainCanvas.style.height = `${clientHeight}px`;
                tempCanvas.style.width = `${clientWidth}px`;
                tempCanvas.style.height = `${clientHeight}px`;

                mainContext.scale(dpr, dpr);
                tempContext.scale(dpr, dpr);
                
                mainContext.lineCap = 'round';
                mainContext.lineJoin = 'round';
                tempContext.lineCap = 'round';
                tempContext.lineJoin = 'round';

                if (currentContent) {
                    const img = new Image();
                    img.onload = () => {
                        mainContext.drawImage(img, 0, 0, clientWidth, clientHeight);
                    };
                    img.src = currentContent;
                }
            }
        };

        resize();
        window.addEventListener('resize', resize);

        const getCoords = (clientX: number, clientY: number): { x: number, y: number } => {
            const rect = tempCanvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDrawing = (e: PointerEvent) => {
            if (!isTeacherRef.current && !props.session.isActive) return;
            const { tool } = settingsRef.current;
            if (tool === 'text') return; 

            const { x, y } = getCoords(e.clientX, e.clientY);
            tempCanvas.setPointerCapture(e.pointerId);
            isDrawingRef.current = true;
            lastPosRef.current = { x, y };
            const ctx = tempContextRef.current;
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const draw = (e: PointerEvent) => {
            if (!isDrawingRef.current) return;
            const ctx = tempContextRef.current;
            if (!ctx) return;
            const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            for (const event of events) {
                const { x, y } = getCoords(event.clientX, event.clientY);
                ctx.lineTo(x, y);
                lastPosRef.current = { x, y };
            }
            ctx.stroke();
        };

        const stopDrawing = (e: PointerEvent) => {
            if (!isDrawingRef.current) return;
            isDrawingRef.current = false;
            if(e.pointerId) {
                try { tempCanvas.releasePointerCapture(e.pointerId); } catch(err) {}
            }
            
            if (mainContextRef.current && tempContextRef.current) {
                const logicalWidth = mainCanvas.width / dpr;
                const logicalHeight = mainCanvas.height / dpr;
                const { tool } = settingsRef.current;
                
                if (tool === 'eraser') {
                    mainContextRef.current.globalCompositeOperation = 'destination-out';
                } else {
                    mainContextRef.current.globalCompositeOperation = 'source-over';
                }
                
                mainContextRef.current.drawImage(tempCanvas, 0, 0, logicalWidth, logicalHeight);
                mainContextRef.current.globalCompositeOperation = 'source-over'; 
                tempContextRef.current.clearRect(0, 0, logicalWidth, logicalHeight);
                
                const newData = mainCanvas.toDataURL();
                pushToUndoStack(newData);
                canvasSnapshotRef.current = newData;
                if (onWhiteboardUpdateRef.current) onWhiteboardUpdateRef.current(newData);
                
                if (isTeacherRef.current) {
                    sendData({ type: 'DRAW_EVENT', data: newData });
                }
            }
        };

        tempCanvas.addEventListener('pointerdown', startDrawing);
        tempCanvas.addEventListener('pointermove', draw); 
        tempCanvas.addEventListener('pointerup', stopDrawing);
        tempCanvas.addEventListener('pointercancel', stopDrawing);
        tempCanvas.addEventListener('pointerout', stopDrawing);

        return () => {
            window.removeEventListener('resize', resize);
            if (tempCanvas) {
                tempCanvas.removeEventListener('pointerdown', startDrawing);
                tempCanvas.removeEventListener('pointermove', draw);
                tempCanvas.removeEventListener('pointerup', stopDrawing);
                tempCanvas.removeEventListener('pointercancel', stopDrawing);
                tempCanvas.removeEventListener('pointerout', stopDrawing);
            }
        };
    }, [isWhiteboardActive, pushToUndoStack, sendData, props.session.isActive]);


    const clearCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        if (mainCanvasRef.current && mainContextRef.current) {
            mainContextRef.current.clearRect(0, 0, mainCanvasRef.current.width / dpr, mainCanvasRef.current.height / dpr);
            const emptyData = mainCanvasRef.current.toDataURL();
            pushToUndoStack(emptyData);
            canvasSnapshotRef.current = null;
            if (onWhiteboardUpdateRef.current) onWhiteboardUpdateRef.current(null);
            if (isTeacherRef.current) {
                sendData({ type: 'DRAW_EVENT', data: null });
            }
        }
    };

    const handleTextDone = () => {
        if (!textEditor || !mainContextRef.current) return;
        const { x, y, value, settings } = textEditor;
        
        if (value.trim()) {
            const ctx = mainContextRef.current;
            const fontString = `${settings.fontStyle} ${settings.fontWeight} ${settings.fontSize}px ${settings.fontFamily}`;
            ctx.font = fontString;
            ctx.fillStyle = drawingSettings.color;
            ctx.textBaseline = 'top';
            ctx.textAlign = settings.textAlign;
            
            let finalX = x;
            if (settings.textAlign === 'center') finalX = x + 25; 
            if (settings.textAlign === 'right') finalX = x + 50; 
            
            const lines = value.split('\n');
            const lineHeight = settings.fontSize * 1.2;

            lines.forEach((line, index) => {
                const lineY = y + (index * lineHeight);
                ctx.fillText(line, finalX, lineY);
                
                if (settings.underline) {
                    const metrics = ctx.measureText(line);
                    let underlineX = finalX;
                    if (settings.textAlign === 'center') underlineX = finalX - metrics.width / 2;
                    if (settings.textAlign === 'right') underlineX = finalX - metrics.width;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = drawingSettings.color;
                    ctx.lineWidth = Math.max(1, settings.fontSize / 15);
                    ctx.moveTo(underlineX, lineY + settings.fontSize);
                    ctx.lineTo(underlineX + metrics.width, lineY + settings.fontSize);
                    ctx.stroke();
                }
            });

            const newData = mainCanvasRef.current!.toDataURL();
            pushToUndoStack(newData);
            canvasSnapshotRef.current = newData;
            if (onWhiteboardUpdateRef.current) {
                onWhiteboardUpdateRef.current(newData);
            }
            if (isTeacherRef.current) {
                sendData({ type: 'DRAW_EVENT', data: newData });
            }
        }
        
        setTextEditor(null);
        setIsTextFocused(false);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (drawingSettings.tool !== 'text' || !isTeacherRef.current) return;
        const canvas = tempCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setTextEditor({ 
            x, 
            y, 
            value: '',
            settings: {
                fontFamily: 'Arial, sans-serif',
                fontSize: Math.max(14, drawingSettings.penSize * 8),
                fontWeight: 'normal',
                fontStyle: 'normal',
                underline: false,
                textAlign: 'left'
            }
        });
        setIsTextFocused(true);
    };

    const handleSessionStart = () => {
        setIsExitingLobby(true);
        setTimeout(() => setIsInLobby(false), 500);
    };
    
    const handleEndClass = () => {
        const finalWhiteboard = mainCanvasRef.current?.toDataURL('image/png') || null;
        canvasSnapshotRef.current = null;
        if (onWhiteboardUpdateRef.current) onWhiteboardUpdateRef.current(null);
        setIsEndModalOpen(false);
        cleanupRTC();
        stopStream(); // FORCED TERMINATION OF HARDWARE ACCESS
        props.onLeaveClass(classChatMessages, finalWhiteboard);
    };
    
    const handleNavigation = () => {
        props.onGoToDashboard();
    };

    const handleChatToggle = () => {
        const nextState = activeSidebar === 'chat' ? null : 'chat';
        setActiveSidebar(nextState);
        if (nextState === 'chat') {
            setUnreadCount(0);
        }
    };

    if (isInLobby) return (
        <ClassroomLobby 
            user={props.user} 
            isTeacher={props.isTeacher} 
            onEnter={handleSessionStart} 
            onLeave={() => {
                stopStream(); // FORCE STOP ON LOBBY EXIT
                props.onLeaveClass([], null);
            }} 
            isMicOn={isMicOn} 
            setIsMicOn={setIsMicOn} 
            isCamOn={isCamOn} 
            setIsCamOn={setIsCamOn} 
            isExiting={isExitingLobby} 
            isStudentOnline={false}
        />
    );

    return (
       <div ref={classroomRef} className="fixed inset-0 bg-slate-950 z-[150] p-0 flex items-center justify-center animate-fadeIn">
        {isSettingsOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-[190] animate-fadeIn"
                onClick={() => setIsSettingsOpen(false)}
            ></div>
        )}

        {handRaiseToast && (
            <div className="fixed top-6 right-6 z-[250] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border-l-4 border-yellow-400 flex items-center gap-3 animate-slide-in">
                <div className="bg-yellow-100 p-2 rounded-lg">
                    <HandIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 dark:text-white">Question!</p>
                    <p className="text-sm text-slate-500">{handRaiseToast.studentName} has a question.</p>
                </div>
                <button onClick={() => setHandRaiseToast(null)} className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="w-full h-full bg-slate-900 text-white shadow-2xl flex flex-col relative overflow-hidden">
            <div className={`flex-1 relative flex flex-col min-h-0 transition-all duration-700 cubic-bezier(0.16,1,0.3,1) ${activeSidebar ? 'lg:mr-[378px]' : 'mr-0'}`}>
                <ClassroomHUD startTime={props.session.startedAt} connectionState={connectionState} />
                <button onClick={handleNavigation} className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black/70 transition-all" title="Exit to Dashboard (PIP Mode)"><DashboardIcon className="w-4 h-4" /><span>Dashboard</span></button>

                <main className="flex-1 relative flex items-center justify-center p-4 pt-20 pb-24 z-[1] min-h-0 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
                    <div className={`w-full h-full mx-auto flex items-center justify-center relative bg-[#0a0a0a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${activeSidebar ? 'max-w-none' : 'max-w-7xl'}`}>
                        {isWhiteboardActive ? (
                            <div className="w-full h-full bg-white relative overflow-hidden">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-slate-800/90 backdrop-blur p-1.5 rounded-2xl shadow-2xl border border-white/10">
                                    <button 
                                        onClick={handleUndo} 
                                        disabled={!canUndo || !props.isTeacher}
                                        className={`p-2 rounded-xl transition-all ${canUndo && props.isTeacher ? 'text-white hover:bg-slate-700 active:scale-90' : 'text-slate-600 cursor-not-allowed'}`}
                                        title="Undo (↺)"
                                    >
                                        <UndoIcon className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={handleRedo} 
                                        disabled={!canRedo || !props.isTeacher}
                                        className={`p-2 rounded-xl transition-all ${canRedo && props.isTeacher ? 'text-white hover:bg-slate-700 active:scale-90' : 'text-slate-600 cursor-not-allowed'}`}
                                        title="Redo (↻)"
                                    >
                                        <RedoIcon className="w-6 h-6" />
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                                    <button 
                                        onClick={handleDownload} 
                                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                                        title="Download Whiteboard (💾)"
                                    >
                                        <DownloadIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <canvas ref={mainCanvasRef} className="absolute inset-0 block"></canvas>
                                <canvas
                                    ref={tempCanvasRef}
                                    onClick={handleCanvasClick}
                                    className={`absolute inset-0 block transition-opacity duration-200 ${!props.isTeacher ? 'pointer-events-none' : ''}`} 
                                    style={{ 
                                        cursor: !props.isTeacher ? 'default' : (drawingSettings.tool === 'pen' ? penCursorUrl : 
                                                drawingSettings.tool === 'eraser' ? eraserCursorUrl : 
                                                'text'), 
                                        backgroundColor: 'transparent',
                                        touchAction: 'none',
                                        opacity: drawingSettings.tool === 'eraser' ? 0.3 : 1.0
                                    }}
                                />

                                {textEditor && (
                                    <div
                                        className="absolute z-[100]"
                                        style={{ left: textEditor.x, top: textEditor.y }}
                                    >
                                        <div className={`absolute -top-12 left-0 flex items-center gap-1 bg-slate-800 p-1.5 rounded-lg shadow-xl border border-white/10 min-w-[300px] transition-opacity duration-200 ${isTextFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                            <select 
                                                className="bg-slate-700 text-white text-[10px] p-1 rounded outline-none border border-slate-600 focus:border-indigo-500"
                                                value={textEditor.settings.fontFamily}
                                                onChange={(e) => setTextEditor({
                                                    ...textEditor,
                                                    settings: { ...textEditor.settings, fontFamily: e.target.value }
                                                })}
                                            >
                                                <option value="Arial, sans-serif">Sans-Serif</option>
                                                <option value="'Times New Roman', serif">Serif</option>
                                                <option value="'Courier New', monospace">Monospace</option>
                                                <option value="'Comic Sans MS', cursive">Handwritten</option>
                                            </select>
                                            
                                            <input 
                                                type="number"
                                                className="bg-slate-700 text-white text-[10px] w-10 p-1 rounded outline-none border border-slate-600"
                                                value={textEditor.settings.fontSize}
                                                onChange={(e) => setTextEditor({
                                                    ...textEditor,
                                                    settings: { ...textEditor.settings, fontSize: parseInt(e.target.value) || 12 }
                                                })}
                                            />

                                            <div className="w-px h-4 bg-slate-600 mx-1"></div>

                                            <button 
                                                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${textEditor.settings.fontWeight === 'bold' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                                onClick={() => setTextEditor({
                                                    ...textEditor,
                                                    settings: { ...textEditor.settings, fontWeight: textEditor.settings.fontWeight === 'bold' ? 'normal' : 'bold' }
                                                })}
                                            >B</button>
                                            <button 
                                                className={`w-6 h-6 rounded flex items-center justify-center italic text-xs transition-colors ${textEditor.settings.fontStyle === 'italic' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                                onClick={() => setTextEditor({
                                                    ...textEditor,
                                                    settings: { ...textEditor.settings, fontStyle: textEditor.settings.fontStyle === 'italic' ? 'normal' : 'italic' }
                                                })}
                                            >I</button>
                                            <button 
                                                className={`w-6 h-6 rounded flex items-center justify-center underline text-xs transition-colors ${textEditor.settings.underline ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                                onClick={() => setTextEditor({
                                                    ...textEditor,
                                                    settings: { ...textEditor.settings, underline: !textEditor.settings.underline }
                                                })}
                                            >U</button>

                                            <div className="w-px h-4 bg-slate-600 mx-1"></div>

                                            {(['left', 'center', 'right'] as const).map(align => (
                                                <button 
                                                    key={align}
                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] capitalize transition-colors ${textEditor.settings.textAlign === align ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                                    onClick={() => setTextEditor({
                                                        ...textEditor,
                                                        settings: { ...textEditor.settings, textAlign: align }
                                                    })}
                                                >
                                                    {align[0]}
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            ref={textareaRef}
                                            value={textEditor.value}
                                            onChange={(e) => setTextEditor({ ...textEditor, value: e.target.value })}
                                            onFocus={() => setIsTextFocused(true)}
                                            onBlur={(e) => {
                                                if ((e.relatedTarget as HTMLElement)?.closest('.bg-slate-800')) return;
                                                if ((e.relatedTarget as HTMLElement)?.id === 'delete-text-btn') return;
                                                handleTextDone();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) handleTextDone();
                                                if (e.key === 'Escape') setTextEditor(null);
                                            }}
                                            className="bg-transparent p-0 resize outline-none overflow-hidden text-slate-900 transition-all duration-75"
                                            style={{
                                                background: 'transparent',
                                                border: '1px dashed #007bff',
                                                color: drawingSettings.color,
                                                fontSize: `${textEditor.settings.fontSize}px`,
                                                fontFamily: textEditor.settings.fontFamily,
                                                fontWeight: textEditor.settings.fontWeight,
                                                fontStyle: textEditor.settings.fontStyle,
                                                textDecoration: textEditor.settings.underline ? 'underline' : 'none',
                                                textAlign: textEditor.settings.textAlign,
                                                minWidth: '50px',
                                                minHeight: '24px',
                                                width: 'auto',
                                                height: 'auto'
                                            }}
                                        />
                                        <button
                                            id="delete-text-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTextEditor(null);
                                                setIsTextFocused(false);
                                            }}
                                            className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full shadow-md flex items-center justify-center hover:bg-red-600 transition-colors z-[101]"
                                            title="Delete text box"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {props.isTeacher && (
                                    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 flex flex-col gap-2 bg-slate-800/80 p-2 rounded-lg border border-white/10 shadow-xl">
                                        <button onClick={() => setDrawingSettings(s => ({...s, tool: 'pen'}))} className={`p-2 rounded-md ${drawingSettings.tool === 'pen' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`} title="Pen"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDrawingSettings(s => ({...s, tool: 'text'}))} className={`p-2 rounded-md ${drawingSettings.tool === 'text' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`} title="Text Tool"><TextIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDrawingSettings(s => ({...s, tool: 'eraser'}))} className={`p-2 rounded-md ${drawingSettings.tool === 'eraser' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`} title="Eraser"><EraserIcon className="w-5 h-5"/></button>
                                        <div className="w-full h-px bg-slate-600 my-1"></div>
                                        {['#000000', '#EF4444', '#3B82F6', '#22C55E'].map(color => (
                                            <button key={color} onClick={() => setDrawingSettings(s => ({...s, color}))} className={`w-8 h-8 rounded-full border-2 ${drawingSettings.color === color ? 'border-white' : 'border-transparent'}`} style={{backgroundColor: color}}></button>
                                        ))}
                                        <div className="w-full h-px bg-slate-600 my-1"></div>
                                        <input type="range" min={drawingSettings.tool === 'eraser' ? "10" : "1"} max={drawingSettings.tool === 'eraser' ? "120" : "20"} value={drawingSettings.tool === 'eraser' ? drawingSettings.eraserSize : drawingSettings.penSize} onChange={(e) => {
                                            const newSize = parseInt(e.target.value, 10);
                                            if (drawingSettings.tool === 'eraser') setDrawingSettings(s => ({ ...s, eraserSize: newSize }));
                                            else setDrawingSettings(s => ({ ...s, penSize: newSize }));
                                        }} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                                        <div className="w-full h-px bg-slate-600 my-1"></div>
                                        <button onClick={clearCanvas} className="p-2 rounded-md hover:bg-slate-600" title="Clear Canvas"><TrashIcon className="w-5 h-5 text-red-400"/></button>
                                    </div>
                                )}
                                <div className={`absolute bottom-4 right-4 w-40 h-32 lg:w-48 lg:h-36 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-black ring-4 ring-black/20`}>
                                    {(stream && isCamOn) ? (
                                        <video ref={localVideoRef} className={`w-full h-full object-cover ${mirrorVideo ? 'scale-x-[-1]' : ''}`} autoPlay muted playsInline />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-600">
                                            <VideoOffIcon className="w-8 h-8 mb-1 opacity-20" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{!stream ? 'INITIALIZING' : 'Cam Off'}</span>
                                        </div>
                                    )}
                                    {!isMicOn && (
                                        <div className="absolute top-2 left-2 bg-red-600 p-1.5 rounded-lg shadow-lg border border-red-400/50 animate-pulse">
                                            <MicOffIcon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                                <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
                                   <video 
                                        ref={remoteVideoRef} 
                                        className={`w-full h-full object-cover transition-opacity duration-500 ${connectionState === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
                                        autoPlay 
                                        playsInline 
                                        style={{ background: '#000' }}
                                    />
                                   
                                   {connectionState !== 'connected' && (
                                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                                            <div className="relative mb-6">
                                                <div className="w-32 h-32 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center animate-pulse">
                                                    <UsersIcon className="w-16 h-16 text-indigo-400 opacity-50" />
                                                </div>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter whitespace-nowrap shadow-xl">
                                                    Awaiting Feed
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white/80 tracking-tight uppercase">
                                                {props.isTeacher ? "Handshaking with Student..." : "Mentor Feed Initializing..."}
                                            </h3>
                                            <p className="text-slate-500 text-sm max-w-xs mt-4 font-medium leading-relaxed">Securing an encrypted channel for your educational stream. Standby.</p>
                                       </div>
                                   )}

                                   {props.session.isHandRaised && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-raise-hand pointer-events-none">
                                            <HandIcon className="w-8 h-8" />
                                            <span className="font-black text-2xl uppercase tracking-tighter">Student Question!</span>
                                        </div>
                                   )}
                                   <p className="absolute bottom-6 text-slate-700 opacity-30 text-xs font-black uppercase tracking-[0.2em] pointer-events-none">Pathshaala Live Matrix</p>
                                </div>
                                 <div className={`absolute top-4 right-4 w-48 aspect-video rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black z-20`}>
                                    {(stream && isCamOn) ? (
                                        <video ref={localVideoRef} className={`w-full h-full object-cover ${mirrorVideo ? 'scale-x-[-1]' : ''}`} autoPlay muted playsInline />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-600">
                                            <VideoOffIcon className="w-8 h-8 mb-1 opacity-20" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{!stream ? 'INITIALIZING' : 'Cam Off'}</span>
                                        </div>
                                    )}
                                    {!isMicOn && (
                                        <div className="absolute top-2 left-2 bg-red-600 p-1.5 rounded-lg shadow-lg border border-red-400/50 animate-pulse">
                                            <MicOffIcon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                 </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: activeSidebar ? `translateX(calc(-50% - 189px))` : 'translateX(-50%)' }}>
                 <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-2.5">
                    <button onClick={() => setIsEndModalOpen(true)} className="px-5 py-2.5 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all active:scale-95 text-[10px]">End Class</button>
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <button onClick={() => setIsMicOn(!isMicOn)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isMicOn ? 'bg-slate-800 border border-white/5 hover:bg-slate-700' : 'bg-red-600 text-white shadow-lg'}`} title={isMicOn ? 'Mute' : 'Unmute'}>{isMicOn ? <MicIcon className="w-5 h-5"/> : <MicOffIcon className="w-5 h-5"/>}</button>
                    <button onClick={() => setIsCamOn(!isCamOn)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isCamOn ? 'bg-slate-800 border border-white/5 hover:bg-slate-700' : 'bg-red-600 text-white shadow-lg'}`} title={isCamOn ? 'Cam Off' : 'Cam On'}>{isCamOn ? <VideoIcon className="w-5 h-5"/> : <VideoOffIcon className="w-5 h-5"/>}</button>
                    
                    {!props.isTeacher && (
                        <button
                            onClick={toggleHandRaise}
                            className={`p-3 rounded-2xl transition-all active:scale-90 ${props.session.isHandRaised ? 'bg-yellow-400 text-black scale-110 shadow-2xl shadow-yellow-500/50' : 'bg-slate-800 text-white border border-white/5'}`}
                            title="Raise Hand"
                        >
                            <HandIcon className="w-5 h-5"/>
                        </button>
                    )}
                    
                    {props.isTeacher && props.session.isHandRaised && (
                         <button
                            onClick={() => props.onUpdateSession && props.onUpdateSession({ ...props.session, isHandRaised: false })}
                            className="px-4 py-2.5 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest animate-pulse-glow-yellow active:scale-95"
                        >
                            Lower Hand
                        </button>
                    )}

                    <button onClick={handleToggleWhiteboard} className={`p-3 rounded-2xl transition-all active:scale-90 ${isWhiteboardActive ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-800 border border-white/5'}`} title="Whiteboard"><WhiteboardIcon className="w-5 h-5"/></button>
                    <button onClick={handleChatToggle} className={`relative p-3 rounded-2xl transition-all active:scale-90 ${activeSidebar === 'chat' ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-800 border border-white/5'}`} title="Chat">
                        <div className="relative">
                            <MessageIcon className="w-5 h-5"/>
                            {unreadCount > 0 && <NotificationDot />}
                        </div>
                    </button>
                    <button onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')} className={`p-3 rounded-2xl transition-all active:scale-90 ${activeSidebar === 'participants' ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-800 border border-white/5'}`} title="Participants"><UsersIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isSettingsOpen ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-800 border border-white/5'}`} title="Settings"><SettingsIcon className="w-5 h-5"/></button>
                </div>
            </footer>

            <div className="absolute bottom-6 right-6 group z-40">
                <button 
                    onClick={toggleFullScreen} 
                    className="p-3 transition-all bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-90" 
                    title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                    {isFullscreen ? <ShrinkIcon className="w-6 h-6" /> : <ExpandIcon className="w-6 h-6" />}
                </button>
            </div>

            <ChatSidebar
                isOpen={activeSidebar === 'chat'}
                onClose={() => setActiveSidebar(null)}
                messages={classChatMessages}
                onSendMessage={handleSendChatMessage}
                currentUser={props.user}
                userPicUrl={props.user.profilePicUrl || `https://i.pravatar.cc/150?u=${props.user.id}`}
            />
            <RightPanel
                title="Participants"
                isOpen={activeSidebar === 'participants'}
                onClose={() => setActiveSidebar(null)}
                zIndexClass="z-50"
            >
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest opacity-60">Host Mentor</p>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                        <img src={props.user.role === 'teacher' ? (props.user.profilePicUrl || `https://i.pravatar.cc/150?u=${props.user.id}`) : (props.allUsers.find(u => u.id === props.session.teacherId)?.profilePicUrl || `https://i.pravatar.cc/150?u=${props.session.teacherId}`)} alt="Teacher" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                        <span className="font-bold text-slate-100">{props.isTeacher ? props.user.name : props.allUsers.find(u => u.id === props.session.teacherId)?.name}</span>
                        <span className="ml-auto text-green-400 text-[8px] font-black uppercase tracking-widest bg-green-400/10 px-2 py-1 rounded-full">Primary</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-8 opacity-60">Active Students</p>
                    {participants.filter(p => p.role === 'student').map(p => (
                         <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                            <img src={p.profilePicUrl || `https://i.pravatar.cc/150?u=${p.id}`} alt={p.name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                            <span className="font-bold text-slate-100">{p.name}</span>
                            <span className="ml-auto text-green-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                Live
                            </span>
                        </div>
                    ))}
                </div>
            </RightPanel>

            <EndClassConfirmationModal isOpen={isEndModalOpen} onConfirm={handleEndClass} onCancel={() => setIsEndModalOpen(false)} />
            
            {isSettingsOpen && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] max-h-[80%] bg-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[200] flex flex-col border border-white/10 animate-scaleIn overflow-hidden">
                    <header className="flex-shrink-0 p-5 flex justify-between items-center border-b border-white/10 bg-black/20">
                        <h3 className="text-xl font-bold tracking-tight">Stage Settings</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Feed Options</h4>
                                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                                    <span className="font-bold text-sm">Mirror My Camera</span>
                                    <input type="checkbox" className="toggle-classroom" checked={mirrorVideo} onChange={() => setMirrorVideo(!mirrorVideo)} />
                                </label>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Acoustics</h4>
                                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                                    <span className="font-bold text-sm">ClearSync Audio Filter</span>
                                    <input type="checkbox" className="toggle-classroom" checked={noiseSuppression} onChange={() => setNoiseSuppression(!noiseSuppression)} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .toggle-classroom {
                -webkit-appearance: none;
                appearance: none;
                width: 44px;
                height: 24px;
                border-radius: 9999px;
                background-color: rgba(255,255,255,0.1);
                position: relative;
                transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .toggle-classroom:checked {
                background-color: #6366f1;
                border-color: #818cf8;
            }
            .toggle-classroom::before {
                content: '';
                position: absolute;
                top: 3px;
                left: 3px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: #fff;
                transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .toggle-classroom:checked::before {
                transform: translateX(20px);
            }
        `}</style>
      </div>
    </div>
    );
};
