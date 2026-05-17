import { useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../stores/useSocketStore';
import { useCallStore } from '../store/useCallStore';
import type { User } from '../types/user';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const { socket } = useSocketStore();
  const {
    callState,
    callType,
    remoteUser,
    setCallState,
    setCallType,
    setRemoteUser,
    setLocalStream,
    setRemoteStream,
    resetCall,
  } = useCallStore();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize PeerConnection
  const initPeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteUser) {
        socket?.emit('ice_candidate', {
          toUserId: remoteUser._id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
  }, [remoteUser, socket, setRemoteStream]);

  // Get User Media
  const getMedia = useCallback(async (type: 'video' | 'voice') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }, [setLocalStream]);

  // Start a call
  const startCall = useCallback(async (user: User, type: 'video' | 'voice') => {
    setCallState('calling');
    setCallType(type);
    setRemoteUser(user);

    const stream = await getMedia(type);
    if (!stream) {
      resetCall();
      return;
    }

    initPeerConnection();
    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    try {
      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);

      socket?.emit('call_user', {
        toUserId: user._id,
        offer,
        type,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      endCall();
    }
  }, [getMedia, initPeerConnection, resetCall, setCallState, setCallType, setRemoteUser, socket]);

  // Answer a call
  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!remoteUser || !callType) return;

    setCallState('active');
    
    const stream = await getMedia(callType);
    if (!stream) {
      endCall();
      return;
    }

    initPeerConnection();
    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);

      socket?.emit('make_answer', {
        toUserId: remoteUser._id,
        answer,
      });
    } catch (error) {
      console.error('Error answering call:', error);
      endCall();
    }
  }, [callType, getMedia, initPeerConnection, remoteUser, setCallState, socket]);

  // Reject a call
  const rejectCall = useCallback(() => {
    if (remoteUser) {
      socket?.emit('reject_call', { toUserId: remoteUser._id });
    }
    resetCall();
  }, [remoteUser, resetCall, socket]);

  // End a call
  const endCall = useCallback(() => {
    if (remoteUser) {
      socket?.emit('end_call', { toUserId: remoteUser._id });
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    resetCall();
  }, [remoteUser, resetCall, socket]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async ({ fromUser, offer, type }: any) => {
      // If already in a call, reject automatically
      if (callState !== 'idle') {
        socket.emit('reject_call', { toUserId: fromUser._id });
        return;
      }
      
      setCallState('receiving');
      setCallType(type);
      setRemoteUser(fromUser);
      // Store offer temporarily in a ref or state if needed, 
      // but for simplicity we can pass it to answerCall later.
      // Actually, we need to store the offer to answer it later.
      // Let's add it to the window object temporarily or a ref.
      (window as any).pendingOffer = offer;
    };

    const handleCallAnswered = async ({ answer }: any) => {
      setCallState('active');
      try {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      try {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue candidate if remote description is not set yet
          // For simplicity, we assume it's set, but in production we should queue them.
          setTimeout(() => {
            peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
          }, 1000);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    const handleCallRejected = () => {
      endCall();
      // Maybe show a toast notification here
    };

    const handleCallEnded = () => {
      endCall();
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_answered', handleCallAnswered);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_answered', handleCallAnswered);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, callState, setCallState, setCallType, setRemoteUser, endCall]);

  return {
    startCall,
    answerCall: () => answerCall((window as any).pendingOffer),
    rejectCall,
    endCall,
  };
};
