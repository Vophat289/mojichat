import { create } from 'zustand';
import { toast } from 'sonner';
import { messageService } from '@/services/messageService';
import { useSocketStore } from './useSocketStore';
import type { Conversation, Message } from '@/types/message';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  sendingMessage: boolean;
  typingUsers: TypingUser[]; // người đang gõ trong active conversation

  loadConversations: () => Promise<void>;
  openConversation: (friendId: string) => Promise<void>;
  setActiveConversation: (conv: Conversation | null) => void;
  loadMessages: (conversationId: string, before?: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, imgUrl?: string) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  addIncomingMessage: (message: Message) => void;
  createGroup: (name: string, memberIds: string[]) => Promise<Conversation | null>;
  setTypingUsers: (users: TypingUser[]) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string) => void;
  updateConversationLastMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  hasMore: false,
  loading: false,
  sendingMessage: false,
  typingUsers: [],

  loadConversations: async () => {
    try {
      set({ loading: true });
      const conversations = await messageService.getConversations();
      set({ conversations });
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách cuộc trò chuyện');
    } finally {
      set({ loading: false });
    }
  },

  openConversation: async (friendId) => {
    try {
      set({ loading: true, messages: [] });
      const conversation = await messageService.getOrCreateDirect(friendId);
      set({ activeConversation: conversation });
      await get().loadMessages(conversation._id);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Không thể mở cuộc trò chuyện');
    } finally {
      set({ loading: false });
    }
  },

  setActiveConversation: (conv) => {
    set({ activeConversation: conv, messages: [], typingUsers: [] });
  },

  loadMessages: async (conversationId, before) => {
    try {
      set({ loading: true });
      const { messages, hasMore } = await messageService.getMessages(conversationId, before);
      set({ messages, hasMore });
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải tin nhắn');
    } finally {
      set({ loading: false });
    }
  },

  loadMoreMessages: async () => {
    const { messages, activeConversation, hasMore, loading } = get();
    if (!activeConversation || !hasMore || loading || messages.length === 0) return;

    const oldest = messages[0];
    try {
      set({ loading: true });
      const { messages: older, hasMore: moreAvailable } = await messageService.getMessages(
        activeConversation._id,
        oldest.createdAt
      );
      set(state => ({
        messages: [...older, ...state.messages],
        hasMore: moreAvailable
      }));
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (content, imgUrl) => {
    const { activeConversation } = get();
    if (!activeConversation) return null;

    try {
      set({ sendingMessage: true });
      const msg = await messageService.sendMessage(activeConversation._id, content, imgUrl);

      set(state => ({ messages: [...state.messages, msg] }));
      get().updateConversationLastMessage(msg);

      // Phát sự kiện socket để người khác nhận được tin nhắn realtime
      useSocketStore.getState().emitSendMessage(activeConversation._id, msg);

      return msg;
    } catch (error) {
      console.error(error);
      toast.error('Không thể gửi tin nhắn');
      return null;
    } finally {
      set({ sendingMessage: false });
    }
  },

  markAsRead: async (conversationId) => {
    try {
      await messageService.markAsRead(conversationId);
      // Reset unread count trong conversations state
      set(state => ({
        conversations: state.conversations.map(c =>
          c._id === conversationId
            ? { ...c, unreadCounts: {} }
            : c
        )
      }));
    } catch (error) {
      console.error(error);
    }
  },

  addIncomingMessage: (message) => {
    const { activeConversation } = get();
    // Chỉ thêm vào messages list nếu đang xem conversation đó
    if (activeConversation?._id === message.conversationId) {
      set(state => ({ messages: [...state.messages, message] }));
    }
    get().updateConversationLastMessage(message);
  },

  createGroup: async (name, memberIds) => {
    try {
      const conversation = await messageService.createGroupChat(name, memberIds);
      set(state => ({ conversations: [conversation, ...state.conversations] }));
      toast.success('Đã tạo nhóm chat thành công');
      return conversation;
    } catch (error) {
      console.error(error);
      toast.error('Không thể tạo nhóm chat');
      return null;
    }
  },

  setTypingUsers: (users) => set({ typingUsers: users }),

  addTypingUser: (user) => {
    set(state => {
      const exists = state.typingUsers.some(u => u.userId === user.userId);
      if (exists) return state;
      return { typingUsers: [...state.typingUsers, user] };
    });
  },

  removeTypingUser: (userId) => {
    set(state => ({
      typingUsers: state.typingUsers.filter(u => u.userId !== userId)
    }));
  },

  updateConversationLastMessage: (message: Message) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c._id === message.conversationId
          ? {
              ...c,
              lastMessage: {
                _id: message._id,
                content: message.content || null,
                senderId: (message.senderId as any)?._id || message.senderId as any,
                createdAt: message.createdAt
              },
              lastMessageAt: message.createdAt
            }
          : c
      ).sort((a, b) =>
        new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
      )
    }));
  }
}));
