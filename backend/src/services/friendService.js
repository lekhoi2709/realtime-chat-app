const User = require("../models/User");
const Conversation = require("../models/Conversation");

class FriendService {
  async sendFriendRequest(userId, friendCode) {
    try {
      const userFriend = await User.findOne({ friendCode });
      if (!userFriend) {
        throw new Error("Friend code not found");
      }

      if (userFriend._id.toString() === userId.toString()) {
        throw new Error("Cannot add yourself as friend");
      }

      const user = await User.indById(userId);

      if (user.friends.includes(userFriend._id)) {
        throw new Error("Already friends with this user");
      }

      const existingRequest = userFriend.friendRequests.find(
        (req) =>
          req.from.toString() === userId.toString() && req.status === "pending",
      );

      if (existingRequest) {
        throw new Error("Friend request already sent");
      }

      userFriend.friendRequests.push({
        from: userId,
        status: "pending",
      });

      await userFriend.save();

      return {
        message: `Friend request sent to ${userFriend.displayName}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async acceptFriendRequest(userId, requestId) {
    try {
      const user = await User.findById(userId);
      const request = user.friendRequests.id(requestId);

      if (!request) {
        throw new Error("Friend request not found");
      }

      if (request.status === "accepted") {
        throw new Error("Friend request already processed");
      }

      request.status = "accepted";

      user.friends.push(request.from);
      await user.save();

      const userFriend = await User.findById(request.from);
      userFriend.friends.push(userId);
      await userFriend.save();

      const conversation = await Conversation.create({
        type: "private",
        participants: [userId, request.from],
      });

      return {
        conversation,
        friend: {
          id: userFriend._id,
          username: userFriend.username,
          displayName: userFriend.displayName,
          avatar: userFriend.avatar,
          status: userFriend.status,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async rejectFriendRequest(userId, requestId) {
    try {
      const user = await User.findById(userId);
      const request = user.friendRequests.id(requestId);

      if (!request) {
        throw new Error("Friend request not found");
      }

      request.status = "rejected";
      await user.save();

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getFriends(userId) {
    try {
      const user = await User.findById(userId).populate({
        path: "friends",
        select: "username displayName avatar status lastSeen friendCode",
      });

      return user.friends;
    } catch (error) {
      throw error;
    }
  }

  async getFriendRequests(userId) {
    try {
      const user = await User.findById(userId).populate({
        path: "friendRequests.from",
        select: "username displayName avatar friendCode",
      });

      const pendingRequests = user.friendRequests.filter(
        (req) => req.status === "pending",
      );

      return pendingRequests;
    } catch (error) {
      throw error;
    }
  }

  async removeFriend(userId, friendId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId },
      });

      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId },
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FriendService();
