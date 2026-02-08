"use client";

import { useState } from "react";
import JoinRoom from "@/components/chat/JoinRoom";
import ChatRoom from "@/components/chat/ChatRoom";

export default function Home() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = (user: string, roomName: string) => {
    setUsername(user);
    setRoom(roomName);
    setJoined(true);
  };

  if (!joined) {
    return <JoinRoom onJoin={handleJoin} />;
  }

  return <ChatRoom username={username} room={room} />;
}
