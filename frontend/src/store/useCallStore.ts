import { create } from 'zustand';
import type { User } from '../types/user';

type CallState = 'idle' | 'calling' | 'receiving' | 'active';
type CallType = 'video' | 'voice' | null;

interface CallStore {
  callState: CallState;
  callType: CallType;
  remoteUser: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  setCallState: (state: CallState) => void;
  setCallType: (type: CallType) => void;
  setRemoteUser: (user: User | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  
  resetCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  callState: 'idle',
  callType: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,

  setCallState: (state) => set({ callState: state }),
  setCallType: (type) => set({ callType: type }),
  setRemoteUser: (user) => set({ remoteUser: user }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  resetCall: () => set({
    callState: 'idle',
    callType: null,
    remoteUser: null,
    localStream: null,
    remoteStream: null,
  }),
}));
