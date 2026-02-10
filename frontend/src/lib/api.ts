const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }
    return data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request("/auth/profile");
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  async getFriends() {
    return this.request("/friends");
  }

  async sendFriendRequest(friendCode: string) {
    return this.request("/friends/request", {
      method: "POST",
      body: JSON.stringify({ friendCode }),
    });
  }

  async getFriendRequests() {
    return this.request("/friends/requests");
  }

  async acceptFriendRequest(requestId: string) {
    return this.request(`/friends/requests/${requestId}/accept`, {
      method: "POST",
    });
  }

  async rejectFriendRequest(requestId: string) {
    return this.request(`/friends/requests/${requestId}/reject`, {
      method: "POST",
    });
  }

  async removeFriend(friendId: string) {
    return this.request(`/friends/${friendId}`, {
      method: "DELETE",
    });
  }

  // Conversations
  async getConversations() {
    return this.request("/conversations");
  }

  async createPrivateConversation(friendId: string) {
    return this.request("/conversations/private", {
      method: "POST",
      body: JSON.stringify({ friendId }),
    });
  }

  async createGroupConversation(data: {
    name: string;
    participants: string[];
    description?: string;
  }) {
    return this.request("/conversations/group", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMessages(conversationId: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append("before", before);
    return this.request(`/conversations/${conversationId}/messages?${params}`);
  }

  async markAsRead(conversationId: string) {
    return this.request(`/conversations/${conversationId}/read`, {
      method: "POST",
    });
  }
}

export const api = new ApiService();
