import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';

const MessageList = () => {
  const { messages, activeConversation, loadMoreMessages, hasMore, loading } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMore && !loading) {
      loadMoreMessages();
    }
  };

  if (!activeConversation) return null;

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 bg-gray-50"
      onScroll={handleScroll}
      ref={scrollContainerRef}
    >
      {loading && hasMore && (
        <div className="text-center text-sm text-gray-500 my-2">Đang tải...</div>
      )}
      
      <div className="flex flex-col gap-3">
        {messages.map((msg, index) => {
          const isMine = (msg.senderId as any)?._id === user?._id || msg.senderId === user?._id;
          const showAvatar = index === messages.length - 1 || 
            (messages[index + 1].senderId as any)?._id !== (msg.senderId as any)?._id;

          return (
            <div 
              key={msg._id} 
              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMine && showAvatar ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(msg.senderId as any)?.displayName?.charAt(0).toUpperCase()}
                </div>
              ) : (
                !isMine && <div className="w-8 h-8 flex-shrink-0"></div>
              )}
              
              <div 
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border rounded-bl-sm'
                }`}
              >
                {msg.content && <p className="break-words">{msg.content}</p>}
                {msg.imgUrl && (
                  <img src={msg.imgUrl} alt="attachment" className="max-w-full rounded-lg mt-2" />
                )}
                <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'} text-right`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
