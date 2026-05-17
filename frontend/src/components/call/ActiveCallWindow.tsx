import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import type { User } from '../../types/user';
import { useCallStore } from '../../store/useCallStore';
import { Button } from '../ui/button';

interface ActiveCallWindowProps {
  remoteUser: User;
  onEndCall: () => void;
}

const ActiveCallWindow: React.FC<ActiveCallWindowProps> = ({
  remoteUser,
  onEndCall,
}) => {
  const { localStream, remoteStream, callType } = useCallStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Main Video Area (Remote) */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-white text-5xl font-bold mb-4">
              {remoteUser.displayName?.charAt(0).toUpperCase() || remoteUser.username?.charAt(0).toUpperCase()}
            </div>
            <p className="text-white text-xl">{remoteUser.displayName || remoteUser.username}</p>
            <p className="text-gray-400 mt-2">Đang kết nối...</p>
          </div>
        )}

        {/* Local Video (PiP) */}
        <div className="absolute top-6 right-6 w-48 h-64 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
          {localStream && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                Bạn
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-gray-900 flex items-center justify-center gap-6 px-6 pb-4">
        <Button
          onClick={toggleMute}
          variant="outline"
          size="icon"
          className={`w-14 h-14 rounded-full border-none ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button
          onClick={toggleVideo}
          variant="outline"
          size="icon"
          className={`w-14 h-14 rounded-full border-none ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        <Button
          onClick={onEndCall}
          variant="destructive"
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <PhoneOff className="w-7 h-7" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveCallWindow;
