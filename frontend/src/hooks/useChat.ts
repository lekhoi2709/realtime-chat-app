import { getSocket } from "@/lib/socket";
import { Message } from "@/types/chat";
import { useCallback, useEffect, useState } from "react";

export const useChat = (room: string, username: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setIsConnected(true);

      if (room && username) {
        socket.emit("join_room", { room, username });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("message_history", (data) => {
      setMessages(data.messages);
    });

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("online_users", (data) => {
      setOnlineCount(data.count);
    });

    socket.on("user_joined", (data) => {
      console.log(data.message);
    });

    socket.on("user_typing", (data) => {
      setTypingUsers((prev) =>
        prev.includes(data.username) ? prev : [...prev, data.username],
      );
      setIsTyping(true);
    });

    socket.on("user_stop_typing", (data) => {
      setTypingUsers((prev) => prev.filter((user) => user !== data.username));
      setIsTyping(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("user_joined");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [room, username]);

  const sendMessage = useCallback(
    (message: string) => {
      const socket = getSocket();

      if (message.trim() && room && username) {
        socket.emit("send_message", {
          room,
          message: message.trim(),
          username,
        });
      }
    },
    [room, username],
  );

  const sendTyping = useCallback(() => {
    const socket = getSocket();
    socket.emit("typing", { room, username });
  }, [room, username]);

  const sendStopTyping = useCallback(() => {
    const socket = getSocket();
    socket.emit("stop_typing", { room, username });
  }, [room, username]);

  return {
    messages,
    isConnected,
    onlineCount,
    isTyping,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
};
