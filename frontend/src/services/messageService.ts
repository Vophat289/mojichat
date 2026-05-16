import api from '@/lib/axios';
import type { Conversation, Message } from '@/types/message';

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/messages/conversations');
    return res.data.conversations;
  },

  getOrCreateDirect: async (friendId: string): Promise<Conversation> => {
    const res = await api.post('/messages/conversations/direct', { friendId });
    return res.data.conversation;
  },

  createGroupChat: async (name: string, memberIds: string[]): Promise<Conversation> => {
    const res = await api.post('/messages/conversations/group', { name, memberIds });
    return res.data.conversation;
  },

  getMessages: async (
    conversationId: string,
    before?: string,
    limit = 30
  ): Promise<{ messages: Message[]; hasMore: boolean }> => {
    const res = await api.get(`/messages/${conversationId}`, {
      params: { before, limit }
    });
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    content?: string,
    imgUrl?: string
  ): Promise<Message> => {
    const res = await api.post(`/messages/${conversationId}`, { content, imgUrl });
    return res.data.message;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.patch(`/messages/${conversationId}/read`);
  },

  addToGroup: async (conversationId: string, userId: string): Promise<void> => {
    await api.put(`/messages/conversations/${conversationId}/members`, { userId });
  },

  leaveGroup: async (conversationId: string): Promise<void> => {
    await api.delete(`/messages/conversations/${conversationId}/leave`);
  }
};
