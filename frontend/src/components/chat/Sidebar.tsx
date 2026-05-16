import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { Search, MessageSquare, Users, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onSelectTab: (tab: 'chat' | 'friends' | 'search') => void;
  activeTab: 'chat' | 'friends' | 'search';
}

const Sidebar = ({ onSelectTab, activeTab }: SidebarProps) => {
  const { conversations, loadConversations, setActiveConversation, activeConversation } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUserIds } = useSocketStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter(c => {
    if (c.type === 'group') return c.group?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const otherParticipant = c.participants.find(p => (p.userId as any)._id !== user?._id);
    return (otherParticipant?.userId as any)?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants.find((p: any) => p.userId._id !== user?._id)?.userId;
  };

  return (
    <div className="w-80 border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">MojiChat</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onSelectTab('chat')} className={activeTab === 'chat' ? 'bg-gray-100' : ''}>
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onSelectTab('friends')} className={activeTab === 'friends' ? 'bg-gray-100' : ''}>
              <Users className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onSelectTab('search')} className={activeTab === 'search' ? 'bg-gray-100' : ''}>
              <UserPlus className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Tìm kiếm cuộc trò chuyện..." 
            className="pl-9 bg-gray-50 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 mt-10 text-sm">
                Không có cuộc trò chuyện nào
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isGroup = conv.type === 'group';
                const otherUser = !isGroup ? getOtherParticipant(conv) : null;
                const isOnline = !isGroup && otherUser && onlineUserIds.includes(otherUser._id);
                const unreadCount = conv.unreadCounts?.[user?._id || ''] || 0;
                const isActive = activeConversation?._id === conv._id;

                return (
                  <div 
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors mb-1
                      ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {isGroup ? conv.group?.name.charAt(0).toUpperCase() : otherUser?.displayName?.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {isGroup ? conv.group?.name : otherUser?.displayName}
                        </h3>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                          {conv.lastMessage?.content || 'Đã gửi một ảnh'}
                        </p>
                        {unreadCount > 0 && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
