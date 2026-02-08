"use client";

import { useState } from "react";

interface JoinRoomProps {
  onJoin: (username: string, room: string) => void;
}

export default function JoinRoom({ onJoin }: JoinRoomProps) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      onJoin(username.trim(), room.trim());
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💬 ChatApp</h1>
          <p className="text-gray-600">Join a room and start chatting!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Name
            </label>
            <input
              id="room"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Popular rooms: general, random, tech
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Join Room
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Built with Next.js, Socket.io & MongoDB</p>
        </div>
      </div>
    </div>
  );
}
