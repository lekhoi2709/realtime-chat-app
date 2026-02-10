"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFriendCode: string;
}

export default function AddFriendModal({
  isOpen,
  onClose,
  userFriendCode,
}: AddFriendModalProps) {
  const [friendCode, setFriendCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await api.sendFriendRequest(friendCode.toLowerCase());
      setSuccess(result.message);
      setFriendCode("");

      // Notify via socket
      const socket = getSocket();
      if (socket) {
        socket.emit("friend_request_sent", {
          targetUserId: result.targetUserId,
        });
      }

      setTimeout(() => {
        onClose();
      }, 2000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userFriendCode);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Your Friend Code */}
        <div className="mb-6 p-4 bg-linear-to-br from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Your Friend Code</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900 tracking-wider">
              {userFriendCode}
            </p>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
            >
              {showCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this code with others to add you
          </p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="friendCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter Friend Code
            </label>
            <input
              id="friendCode"
              type="text"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase tracking-wider text-center text-xl font-semibold"
              placeholder="ABCD1234"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Friend Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
