import { useEffect } from 'react';
import { useFriendStore } from '@/stores/useFriendStore';
import { useChatStore } from '@/stores/useChatStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { Check, X, MessageSquare, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FriendPanelProps {
  onChatClick?: () => void;
}

const FriendPanel = ({ onChatClick }: FriendPanelProps) => {
  const { 
    friends, 
    friendRequests, 
    loadFriends, 
    loadFriendRequests, 
    acceptRequest, 
    declineRequest,
    removeFriend
  } = useFriendStore();
  const { openConversation } = useChatStore();
  const { onlineUserIds } = useSocketStore();

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Bạn bè</h2>
      </div>

      <div className="p-6">
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Lời mời kết bạn ({friendRequests.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendRequests.map(req => (
                <div key={req._id} className="border rounded-xl p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {req.from.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{req.from.displayName}</h4>
                      <p className="text-xs text-gray-500">@{req.from.username}</p>
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-sm text-gray-600 mb-4 italic bg-gray-50 p-2 rounded">"{req.message}"</p>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      onClick={() => acceptRequest(req._id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" /> Chấp nhận
                    </Button>
                    <Button 
                      onClick={() => declineRequest(req._id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" /> Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Danh sách bạn bè ({friends.length})
          </h3>
          
          {friends.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Bạn chưa có người bạn nào. Hãy tìm kiếm và kết bạn nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => {
                const isOnline = onlineUserIds.includes(friend._id);
                
                return (
                  <div key={friend._id} className="border rounded-xl p-4 flex items-center justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{friend.displayName}</h4>
                        <p className="text-xs text-gray-500">{isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={async () => {
                          await openConversation(friend._id);
                          if (onChatClick) onChatClick();
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                        title="Nhắn tin"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friend.displayName}?`)) {
                            removeFriend(friend._id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                        title="Hủy kết bạn"
                      >
                        <UserMinus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendPanel;
