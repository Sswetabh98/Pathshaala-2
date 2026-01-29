
import { useEffect, useRef, useCallback } from 'react';
import { useMediaStream } from '../contexts/MediaStreamContext';
import { SignalingMessage } from '../types';

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (currentUserId: string, targetUserId: string | null, onDataReceived?: (data: any) => void) => {
    const { stream, addRemoteStream, removeRemoteStream } = useMediaStream();
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);

    const cleanup = useCallback(() => {
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (targetUserId) {
            removeRemoteStream(targetUserId);
        }
    }, [targetUserId, removeRemoteStream]);

    const setupDataChannelListeners = (channel: RTCDataChannel) => {
        channel.onopen = () => console.debug('Data Channel opened');
        channel.onclose = () => console.debug('Data Channel closed');
        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onDataReceived) {
                    onDataReceived(data);
                }
            } catch (err) {
                console.error('Failed to parse Data Channel message:', err);
            }
        };
    };

    const initPeerConnection = useCallback(() => {
        cleanup();
        
        const pc = new RTCPeerConnection(RTC_CONFIG);

        pc.onicecandidate = (event) => {
            if (event.candidate && targetUserId) {
                console.debug('Local ICE Candidate generated:', event.candidate);
                // Signaling logic would go here
            }
        };

        pc.ontrack = (event) => {
            console.debug('Remote track received:', event.streams[0]);
            if (targetUserId) {
                addRemoteStream(targetUserId, event.streams[0]);
            }
        };

        pc.ondatachannel = (event) => {
            console.debug('Remote Data Channel received');
            dataChannel.current = event.channel;
            setupDataChannelListeners(event.channel);
        };

        pc.onconnectionstatechange = () => {
            console.debug('WebRTC Connection State:', pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                cleanup();
            }
        };

        // Add local tracks to connection
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        peerConnection.current = pc;
        return pc;
    }, [stream, targetUserId, addRemoteStream, cleanup, onDataReceived]);

    const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
        if (!peerConnection.current) initPeerConnection();
        const pc = peerConnection.current!;

        switch (message.type) {
            case 'offer':
                await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.debug('Answer created for peer:', answer);
                break;
            case 'answer':
                await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                break;
            case 'candidate':
                await pc.addIceCandidate(new RTCIceCandidate(message.payload));
                break;
        }
    }, [initPeerConnection]);

    const createCallOffer = useCallback(async () => {
        if (!targetUserId) return;
        const pc = initPeerConnection();
        
        // Create Data Channel on the offerer side
        const dc = pc.createDataChannel('whiteboard-sync');
        dataChannel.current = dc;
        setupDataChannelListeners(dc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.debug('Call Offer created:', offer);
    }, [targetUserId, initPeerConnection]);

    const sendData = useCallback((data: any) => {
        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            dataChannel.current.send(JSON.stringify(data));
        }
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        createCallOffer,
        handleSignalingMessage,
        sendData,
        cleanup
    };
};
