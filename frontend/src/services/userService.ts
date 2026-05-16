import api from '@/lib/axios';
import type { User } from '@/types/user';

export const userService = {
  searchUsers: async (q: string): Promise<User[]> => {
    const res = await api.get('/users/search', { params: { q } });
    return res.data.users;
  },

  getUserProfile: async (userId: string): Promise<User> => {
    const res = await api.get(`/users/${userId}`);
    return res.data.user;
  },

  updateProfile: async (data: Partial<{
    displayName: string;
    bio: string;
    phone: string;
    avatarURL: string;
    avatarId: string;
  }>): Promise<User> => {
    const res = await api.patch('/users/me', data);
    return res.data.user;
  }
};
