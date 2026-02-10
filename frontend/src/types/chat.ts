export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: "online" | "offline" | "away";
  friendCode: string;
  lastSeen?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  content: string;
  messageType: "text" | "image" | "file" | "system";
  createdAt: string;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
}

export interface Conversation {
  _id: string;
  type: "private" | "group";
  participants: User[];
  name?: string;
  description?: string;
  avatar?: string;
  admin?: User;
  lastMessage?: Message;
  lastMessageAt: string;
}

export interface FriendRequest {
  _id: string;
  from: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
