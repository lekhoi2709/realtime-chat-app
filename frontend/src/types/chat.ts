export type Message = {
  _id: string;
  message: string;
  username: string;
  userId: string;
  timestamp: string;
};

export type Room = {
  _id: string;
  name: string;
  description?: string;
  messageCount: number;
  lastActivity: string;
};

export type OnlineUsers = {
  count: number;
};
