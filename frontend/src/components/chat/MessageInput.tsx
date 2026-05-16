import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MessageInput = () => {
  const [content, setContent] = useState('');
  const { activeConversation, sendMessage } = useChatStore();
  const { emitTyping, emitStopTyping } = useSocketStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if (!content.trim() || !activeConversation) return;
    
    const msgContent = content;
    setContent('');
    emitStopTyping(activeConversation._id);
    
    await sendMessage(msgContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    
    if (activeConversation) {
      emitTyping(activeConversation._id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeConversation._id);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!activeConversation) return null;

  return (
    <div className="p-4 bg-white border-t flex items-center gap-2">
      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500">
        <ImageIcon className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500">
        <Smile className="w-5 h-5" />
      </Button>
      
      <div className="flex-1 relative">
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          className="w-full bg-gray-100 border-none rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      
      <Button 
        onClick={handleSend}
        disabled={!content.trim()}
        className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 flex items-center justify-center p-0"
      >
        <Send className="w-5 h-5 text-white" />
      </Button>
    </div>
  );
};

export default MessageInput;
