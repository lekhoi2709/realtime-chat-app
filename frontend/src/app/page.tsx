/* eslint-disable react-hooks/immutability */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import Sidebar from "@/components/messenger/Sidebar";
import ChatArea from "@/components/messenger/ChatArea";
import AddFriendModal from "@/components/messenger/AddFriendModal";
import FriendRequestsModal from "@/components/messenger/FriendRequestsModal";
import CreateGroupModal from "@/components/messenger/CreateGroupModal";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Conversation, User, FriendRequest } from "@/types/chat";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      setupSocketListeners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      const [conversationsRes, friendsRes, requestsRes] = await Promise.all([
        api.getConversations(),
        api.getFriends(),
        api.getFriendRequests(),
      ]);

      setConversations(conversationsRes.conversations);
      setFriends(friendsRes.friends);
      setFriendRequests(requestsRes.requests);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("friend_request_received", () => {
      loadData();
    });

    socket.on("friend_request_accepted", () => {
      loadData();
    });

    socket.on("user_online", (data) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend._id === data.userId ? { ...friend, status: "online" } : friend,
        ),
      );
    });

    socket.on("user_offline", (data) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend._id === data.userId
            ? { ...friend, status: "offline", lastSeen: data.lastSeen }
            : friend,
        ),
      );
    });
  };

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c._id === conversationId);
    if (conversation) {
      setActiveConversation(conversation);
      await api.markAsRead(conversationId);
    }
  };

  // const handleStartChatWithFriend = async (friendId: string) => {
  //   try {
  //     const response = await api.createPrivateConversation(friendId);
  //     setConversations((prev) => {
  //       const exists = prev.find((c) => c._id === response.conversation._id);
  //       if (exists) return prev;
  //       return [...prev, response.conversation];
  //     });
  //     setActiveConversation(response.conversation);
  //   } catch (error) {
  //     console.error("Failed to start chat:", error);
  //   }
  // };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        {authMode === "login" ? (
          <LoginForm onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        conversations={conversations}
        friends={friends}
        activeConversationId={activeConversation?._id || null}
        onSelectConversation={handleSelectConversation}
        onOpenAddFriend={() => setShowAddFriend(true)}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
        onOpenFriendRequests={() => setShowFriendRequests(true)}
        friendRequestCount={friendRequests.length}
      />

      {activeConversation ? (
        <ChatArea conversation={activeConversation} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Select a conversation
            </h2>
            <p className="text-gray-500">Choose a friend to start chatting</p>
          </div>
        </div>
      )}

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        userFriendCode={user.friendCode}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onRequestAccepted={loadData}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        friends={friends}
        onGroupCreated={loadData}
      />
    </div>
  );
}
