import React, { useEffect } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallWindow from './ActiveCallWindow';

const CallManager: React.FC = () => {
  const { callState, callType, remoteUser } = useCallStore();
  const { answerCall, rejectCall, endCall, startCall } = useWebRTC();

  // Expose startCall globally for ChatWindow to use
  useEffect(() => {
    (window as any).startWebRTCCall = startCall;
    return () => {
      delete (window as any).startWebRTCCall;
    };
  }, [startCall]);

  return (
    <>
      {callState === 'receiving' && remoteUser && callType && (
        <IncomingCallModal
          caller={remoteUser}
          callType={callType}
          onAccept={answerCall}
          onDecline={rejectCall}
        />
      )}
      
      {callState === 'active' && remoteUser && (
        <ActiveCallWindow
          remoteUser={remoteUser}
          onEndCall={endCall}
        />
      )}
    </>
  );
};

export default CallManager;
