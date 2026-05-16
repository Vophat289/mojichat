import type { User } from './user';

export interface Participant {
  userId: User;
  joinedAt: string;
}

export interface LastMessage {
  _id: string;
  content: string | null;
  senderId: string;
  createdAt: string;
}

export interface ConversationGroup {
  name: string;
  createdBy: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  participants: Participant[];
  group?: ConversationGroup;
  lastMessage: LastMessage | null;
  lastMessageAt?: string;
  unreadCounts?: Record<string, number>;
  seenBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content?: string;
  imgUrl?: string;
  createdAt: string;
  updatedAt: string;
}
