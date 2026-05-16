import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import FriendPanel from '@/components/chat/FriendPanel';
import SearchUsers from '@/components/chat/SearchUsers';
import Logout from '@/components/auth/Logout';
import { LogOut } from 'lucide-react';

const ChatAppPage = () => {
  const { user, signOut } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'friends' | 'search'>('chat');

  // Kết nối socket khi vào trang chat
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Cột nhỏ bên trái cùng chứa avatar và nút logout */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-white transition-all"
            title={user?.displayName}
          >
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <button 
          onClick={signOut}
          className="w-10 h-10 rounded-xl hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar danh sách */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'friends' && <FriendPanel onChatClick={() => setActiveTab('chat')} />}
        {activeTab === 'search' && <SearchUsers />}
      </div>
    </div>
  );
};

export default ChatAppPage;