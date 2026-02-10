/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { Message, Conversation } from "@/types/chat";

interface ChatAreaProps {
  conversation: Conversation;
}

export default function ChatArea({ conversation }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    joinConversation();

    const socket = getSocket();
    if (socket) {
      socket.on("receive_message", handleReceiveMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stop_typing", handleStopTyping);
    }

    return () => {
      leaveConversation();
      if (socket) {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("user_typing", handleUserTyping);
        socket.off("user_stop_typing", handleStopTyping);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.getMessages(conversation._id);
      setMessages(response.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinConversation = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("join_conversation", { conversationId: conversation._id });
    }
  };

  const leaveConversation = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("leave_conversation", { conversationId: conversation._id });
    }
  };

  const handleReceiveMessage = (data: any) => {
    if (data.conversationId === conversation._id) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  const handleUserTyping = (data: any) => {
    if (data.conversationId === conversation._id && data.userId !== user?._id) {
      const username =
        data.user?.displayName || data.user?.username || "Someone";
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username],
      );
    }
  };

  const handleStopTyping = (data: any) => {
    console.log(data);
    if (data.conversationId === conversation._id) {
      const username =
        data.user?.displayName || data.user?.username || "Someone";
      console.log(username);
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("stop_typing", { conversationId: conversation._id });
      socket.emit("send_message", {
        conversationId: conversation._id,
        content: inputMessage.trim(),
      });
      setInputMessage("");
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    const socket = getSocket();
    if (socket) {
      socket.emit("typing", { conversationId: conversation._id });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { conversationId: conversation._id });
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getConversationName = () => {
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSameSender = (currentMsg: Message, prevMsg: Message | undefined) => {
    return prevMsg && currentMsg.sender._id === prevMsg.sender._id;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {getInitials(getConversationName())}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {getConversationName()}
            </h2>
            {conversation.type === "private" && (
              <p className="text-xs text-gray-500">
                {conversation.participants.find((p) => p._id !== user?._id)
                  ?.status === "online"
                  ? "Online"
                  : "Offline"}
              </p>
            )}
            {conversation.type === "group" && (
              <p className="text-xs text-gray-500">
                {conversation.participants.length} members
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender._id === user?._id;
            const showAvatar = !isSameSender(message, messages[index - 1]);

            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
                  showAvatar ? "mt-4" : "mt-1"
                }`}
              >
                {!isOwn && showAvatar && (
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold mr-2">
                    {getInitials(message.sender.displayName)}
                  </div>
                )}
                {!isOwn && !showAvatar && <div className="w-8 mr-2" />}

                <div
                  className={`max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"}`}
                >
                  {showAvatar && !isOwn && (
                    <p className="text-xs text-gray-600 mb-1 ml-1">
                      {message.sender.displayName}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? "bg-linear-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
                  >
                    <p className="wrap-break-word">{message.content}</p>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn
                        ? "text-gray-500 text-right mr-1"
                        : "text-gray-500 ml-1"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>{typingUsers[0]} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
