"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";

interface ChatRoomProps {
  room: string;
  username: string;
}

export default function ChatRoom({ room, username }: ChatRoomProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isTypingTimeout, setIsTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isConnected,
    onlineCount,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
  } = useChat(room, username);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMessage.trim()) {
      sendStopTyping();
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    sendTyping();

    if (isTypingTimeout) {
      clearTimeout(isTypingTimeout);
    }

    const timeout = setTimeout(() => {
      sendStopTyping();
    }, 1000);

    setIsTypingTimeout(timeout);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">#{room}</h1>
            <p className="text-sm text-blue-100">
              {onlineCount} {onlineCount === 1 ? "user" : "users"} online
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
            />
            <span className="text-sm">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.username === username ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.username === username
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 shadow"
                  }`}
                >
                  {msg.username !== username && (
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {msg.username}
                    </p>
                  )}
                  <p className="wrap-break-word">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.username === username
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}

          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span>{typingUsers[0]} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
