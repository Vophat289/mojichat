import React from 'react';
import { Phone, Video, X } from 'lucide-react';
import type { User } from '../../types/user';
import { Button } from '../ui/button';

interface IncomingCallModalProps {
  caller: User;
  callType: 'video' | 'voice';
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
          {caller.displayName?.charAt(0).toUpperCase() || caller.username?.charAt(0).toUpperCase()}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-1">{caller.displayName || caller.username}</h3>
        <p className="text-gray-500 mb-8">
          Đang gọi {callType === 'video' ? 'video' : 'thoại'} cho bạn...
        </p>

        <div className="flex w-full justify-center gap-6">
          <Button
            onClick={onDecline}
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={onAccept}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:scale-105 transition-transform"
            size="icon"
          >
            {callType === 'video' ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <Phone className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
