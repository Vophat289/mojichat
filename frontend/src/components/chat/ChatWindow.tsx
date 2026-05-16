import { useEffect } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatWindow = () => {
  const { activeConversation, typingUsers, markAsRead } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUserIds, joinConversation, leaveConversation } = useSocketStore();

  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation._id);
      joinConversation(activeConversation._id);

      return () => {
        leaveConversation(activeConversation._id);
      };
    }
  }, [activeConversation, markAsRead, joinConversation, leaveConversation]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Chào mừng đến với MojiChat</h2>
        <p className="text-gray-500 mt-2">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';
  const otherUser = !isGroup 
    ? activeConversation.participants.find(p => (p.userId as any)._id !== user?._id)?.userId as any
    : null;
  const isOnline = !isGroup && otherUser && onlineUserIds.includes(otherUser._id);

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {isGroup ? activeConversation.group?.name.charAt(0).toUpperCase() : otherUser?.displayName?.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-800">
              {isGroup ? activeConversation.group?.name : otherUser?.displayName}
            </h2>
            <p className="text-xs text-gray-500">
              {isGroup ? `${activeConversation.participants.length} thành viên` : (isOnline ? 'Đang hoạt động' : 'Ngoại tuyến')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 italic flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          {typingUsers.map(u => u.displayName).join(', ')} đang soạn tin...
        </div>
      )}

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
