import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { friendService } from '@/services/friendService';
import { useFriendStore } from '@/stores/useFriendStore';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';

const SearchUsers = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, any>>({});
  
  const { sendRequest, friends, sentRequests } = useFriendStore();

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const users = await userService.searchUsers(query);
          setResults(users);
          
          // Fetch status for each user
          const statuses: Record<string, any> = {};
          for (const user of users) {
            statuses[user._id] = await friendService.checkFriendship(user._id);
          }
          setFriendshipStatuses(statuses);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleSendRequest = async (userId: string) => {
    await sendRequest(userId);
    // Update local status
    setFriendshipStatuses(prev => ({
      ...prev,
      [userId]: { ...prev[userId], sentRequest: true }
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-6 border-b bg-white sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tìm kiếm người dùng</h2>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Nhập tên hoặc username để tìm kiếm..." 
            className="pl-12 py-6 text-lg bg-gray-50 border-gray-200 rounded-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tìm kiếm...</div>
        ) : query.trim().length > 0 && query.trim().length < 2 ? (
          <div className="text-center py-10 text-gray-500">Vui lòng nhập ít nhất 2 ký tự</div>
        ) : results.length === 0 && query.trim().length >= 2 ? (
          <div className="text-center py-10 text-gray-500">Không tìm thấy người dùng nào phù hợp</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(user => {
              const status = friendshipStatuses[user._id];
              const isFriend = status?.isFriend;
              const hasSentRequest = status?.sentRequest;
              const hasReceivedRequest = status?.receivedRequest;

              return (
                <div key={user._id} className="border rounded-xl p-4 flex items-center justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg">{user.displayName}</h4>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  
                  <div>
                    {isFriend ? (
                      <Button disabled variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Check className="w-4 h-4 mr-2" /> Đã là bạn bè
                      </Button>
                    ) : hasSentRequest ? (
                      <Button disabled variant="outline" className="text-gray-600">
                        <Clock className="w-4 h-4 mr-2" /> Đã gửi lời mời
                      </Button>
                    ) : hasReceivedRequest ? (
                      <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        Kiểm tra lời mời
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSendRequest(user._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Kết bạn
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
