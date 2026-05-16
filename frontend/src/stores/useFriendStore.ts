import { create } from 'zustand';
import { toast } from 'sonner';
import { friendService } from '@/services/friendService';
import type { User } from '@/types/user';
import type { FriendRequest } from '@/types/friend';

interface FriendState {
  friends: User[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;

  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  loadSentRequests: () => Promise<void>;

  sendRequest: (to: string, message?: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  loading: false,

  loadFriends: async () => {
    try {
      set({ loading: true });
      const friends = await friendService.getAllFriends();
      set({ friends });
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách bạn bè');
    } finally {
      set({ loading: false });
    }
  },

  loadFriendRequests: async () => {
    try {
      const requests = await friendService.getFriendRequests();
      set({ friendRequests: requests });
    } catch (error) {
      console.error(error);
    }
  },

  loadSentRequests: async () => {
    try {
      const requests = await friendService.getSentRequests();
      set({ sentRequests: requests });
    } catch (error) {
      console.error(error);
    }
  },

  sendRequest: async (to, message) => {
    try {
      const request = await friendService.sendRequest(to, message);
      set(state => ({ sentRequests: [request, ...state.sentRequests] }));
      toast.success('Đã gửi lời mời kết bạn');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Không thể gửi lời mời');
    }
  },

  acceptRequest: async (requestId) => {
    try {
      await friendService.acceptRequest(requestId);
      // Xóa request khỏi list và reload friends
      set(state => ({
        friendRequests: state.friendRequests.filter(r => r._id !== requestId)
      }));
      await get().loadFriends();
      toast.success('Đã chấp nhận lời mời kết bạn');
    } catch (error) {
      console.error(error);
      toast.error('Không thể chấp nhận lời mời');
    }
  },

  declineRequest: async (requestId) => {
    try {
      await friendService.declineRequest(requestId);
      set(state => ({
        friendRequests: state.friendRequests.filter(r => r._id !== requestId)
      }));
      toast.success('Đã từ chối lời mời kết bạn');
    } catch (error) {
      console.error(error);
      toast.error('Không thể từ chối lời mời');
    }
  },

  cancelRequest: async (requestId) => {
    try {
      await friendService.cancelRequest(requestId);
      set(state => ({
        sentRequests: state.sentRequests.filter(r => r._id !== requestId)
      }));
      toast.success('Đã hủy lời mời kết bạn');
    } catch (error) {
      console.error(error);
      toast.error('Không thể hủy lời mời');
    }
  },

  removeFriend: async (friendId) => {
    try {
      await friendService.removeFriend(friendId);
      set(state => ({
        friends: state.friends.filter(f => f._id !== friendId)
      }));
      toast.success('Đã xóa bạn bè');
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa bạn bè');
    }
  }
}));
