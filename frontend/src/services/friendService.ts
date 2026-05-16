import api from '@/lib/axios';
import type { FriendRequest, FriendshipStatus } from '@/types/friend';
import type { User } from '@/types/user';

export const friendService = {
  sendRequest: async (to: string, message?: string): Promise<FriendRequest> => {
    const res = await api.post('/friends/requests', { to, message });
    return res.data.request;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await api.post(`/friends/requests/${requestId}/accept`);
  },

  declineRequest: async (requestId: string): Promise<void> => {
    await api.post(`/friends/requests/${requestId}/decline`);
  },

  cancelRequest: async (requestId: string): Promise<void> => {
    await api.delete(`/friends/requests/${requestId}`);
  },

  getAllFriends: async (): Promise<User[]> => {
    const res = await api.get('/friends');
    return res.data.friends;
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    const res = await api.get('/friends/requests');
    return res.data.requests;
  },

  getSentRequests: async (): Promise<FriendRequest[]> => {
    const res = await api.get('/friends/requests/sent');
    return res.data.requests;
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await api.delete(`/friends/${friendId}`);
  },

  checkFriendship: async (userId: string): Promise<FriendshipStatus> => {
    const res = await api.get(`/friends/check/${userId}`);
    return res.data;
  }
};
