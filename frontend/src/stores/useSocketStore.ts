import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';
import { useFriendStore } from './useFriendStore';

interface SocketState {
  socket: Socket | null;
  onlineUserIds: string[];
  isConnected: boolean;

  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitSendMessage: (conversationId: string, message: any) => void;
  emitTyping: (conversationId: string) => void;
  emitStopTyping: (conversationId: string) => void;
  emitMarkRead: (conversationId: string) => void;
  emitFriendRequest: (toUserId: string, request: any) => void;
  emitFriendAccepted: (toUserId: string) => void;
}

const SOCKET_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:5001'
  : '/';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUserIds: [],
  isConnected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // ─── SOCKET EVENT LISTENERS ───

    newSocket.on('connect', () => {
      console.log('[Socket] Đã kết nối:', newSocket.id);
      set({ isConnected: true });
      // Lấy danh sách online users
      newSocket.emit('get_online_users');
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Đã ngắt kết nối');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Lỗi kết nối:', err.message);
    });

    // Online status
    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      set(state => ({
        onlineUserIds: state.onlineUserIds.includes(userId)
          ? state.onlineUserIds
          : [...state.onlineUserIds, userId]
      }));
    });

    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      set(state => ({
        onlineUserIds: state.onlineUserIds.filter(id => id !== userId)
      }));
    });

    newSocket.on('online_users_list', ({ onlineUserIds }: { onlineUserIds: string[] }) => {
      set({ onlineUserIds });
    });

    // Nhận tin nhắn mới
    newSocket.on('receive_message', ({ message }: { message: any; conversationId: string }) => {
      useChatStore.getState().addIncomingMessage(message);
    });

    // Typing indicators
    newSocket.on('user_typing', ({ userId, displayName, conversationId }: any) => {
      const { activeConversation } = useChatStore.getState();
      if (activeConversation?._id === conversationId) {
        useChatStore.getState().addTypingUser({ userId, displayName });
      }
    });

    newSocket.on('user_stop_typing', ({ userId, conversationId }: any) => {
      const { activeConversation } = useChatStore.getState();
      if (activeConversation?._id === conversationId) {
        useChatStore.getState().removeTypingUser(userId);
      }
    });

    // Mark as read
    newSocket.on('message_read', ({ userId, conversationId }: any) => {
      console.log(`[Socket] ${userId} đã đọc conversation ${conversationId}`);
    });

    // Friend requests real-time
    newSocket.on('receive_friend_request', ({ request }: any) => {
      const { friendRequests } = useFriendStore.getState();
      useFriendStore.setState({ friendRequests: [request, ...friendRequests] });
    });

    newSocket.on('friend_accepted', ({ fromUser }: any) => {
      useFriendStore.getState().loadFriends();
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUserIds: [] });
    }
  },

  joinConversation: (conversationId) => {
    get().socket?.emit('join_conversation', { conversationId });
  },

  leaveConversation: (conversationId) => {
    get().socket?.emit('leave_conversation', { conversationId });
  },

  emitSendMessage: (conversationId, message) => {
    get().socket?.emit('message_sent', { conversationId, message });
  },

  emitTyping: (conversationId) => {
    get().socket?.emit('typing', { conversationId });
  },

  emitStopTyping: (conversationId) => {
    get().socket?.emit('stop_typing', { conversationId });
  },

  emitMarkRead: (conversationId) => {
    get().socket?.emit('mark_read', { conversationId });
  },

  emitFriendRequest: (toUserId, request) => {
    get().socket?.emit('friend_request_sent', { toUserId, request });
  },

  emitFriendAccepted: (toUserId) => {
    get().socket?.emit('friend_request_accepted', { toUserId });
  }
}));
