"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation, User } from "@/types/chat";

interface SidebarProps {
  conversations: Conversation[];
  friends: User[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  onOpenFriendRequests: () => void;
  onOpenEditProfile: () => void;
  friendRequestCount: number;
}

export default function Sidebar({
  conversations,
  friends,
  activeConversationId,
  onSelectConversation,
  onOpenAddFriend,
  onOpenCreateGroup,
  onOpenFriendRequests,
  onOpenEditProfile,
  friendRequestCount,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"chats" | "friends">("chats");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.name || "Unnamed Group";
    }
    const otherUser = conversation.participants.find(
      (p) => p._id !== user?._id,
    );
    return otherUser?.displayName || otherUser?.username || "Unknown";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) return "No messages yet";
    return conversation.lastMessage.content.slice(0, 50);
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messenger</h1>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold hover:opacity-90 transition"
            >
              {user && getInitials(user.displayName)}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    @{user?.username}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Code: {user?.friendCode}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenEditProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              tab === "chats"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setTab("friends")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition relative ${
              tab === "friends"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Friends
            {friendRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {friendRequestCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "chats" ? (
          <div>
            {/* Action Buttons */}
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={onOpenCreateGroup}
                className="w-full py-2 px-4 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition"
              >
                + Create Group
              </button>
            </div>

            {/* Conversations List */}
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Add friends to start chatting!</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation._id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition ${
                    activeConversationId === conversation._id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(getConversationName(conversation))}
                    </div>
                    {conversation.type === "private" && (
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          conversation.participants.find(
                            (p) => p._id !== user?._id,
                          )?.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {formatLastMessage(conversation)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            {/* Action Buttons */}
            <div className="p-3 border-b border-gray-200 space-y-2">
              <button
                onClick={onOpenAddFriend}
                className="w-full py-2 px-4 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition"
              >
                + Add Friend
              </button>
              {friendRequestCount > 0 && (
                <button
                  onClick={onOpenFriendRequests}
                  className="w-full py-2 px-4 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition"
                >
                  View Friend Requests ({friendRequestCount})
                </button>
              )}
            </div>

            {/* Friends List */}
            {friends.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No friends yet</p>
                <p className="text-sm mt-2">Add friends to start chatting!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(friend.displayName)}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {friend.displayName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {friend.status === "online"
                        ? "Online"
                        : `Last seen ${formatTime(friend.lastSeen || "")}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
