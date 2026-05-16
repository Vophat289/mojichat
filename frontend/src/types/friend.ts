  import type { User } from './user';

export interface FriendRequest {
  _id: string;
  from: User;
  to: User;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  _id: string;
  userA: string;
  userB: string;
  createdAt: string;
}

export interface FriendshipStatus {
  isFriend: boolean;
  sentRequest: FriendRequest | null;
  receivedRequest: FriendRequest | null;
}
