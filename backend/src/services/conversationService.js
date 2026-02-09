const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

class ConversationService {
  async getUserConversations(userId) {
    try {
      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate("participants", "username displayName avatar status")
        .populate("lastMessage")
        .populate("admin", "username displayName")
        .sort({ lastMessageAt: -1 });

      return conversations;
    } catch (error) {
      throw error;
    }
  }

  async getOrCreatePrivateConversation(user1Id, user2Id) {
    try {
      let conversation = await Conversation.findOne({
        type: "private",
        participants: { $all: [user1Id, user2Id], $size: 2 },
      }).populate("participants", "username displayName avatar status");

      if (!conversation) {
        conversation = await Conversation.create({
          type: "private",
          participants: [user1Id, user2Id],
        });

        conversation = await conversation.populate(
          "participants",
          "username displayName avatar status",
        );
      }

      return conversation;
    } catch (error) {
      throw error;
    }
  }

  async createGroupConversation(adminId, groupData) {
    try {
      const { name, participants, description } = groupData;

      const allParticipants = [
        adminId,
        ...participants.filter((p) => p !== adminId),
      ];

      const conversation = await Conversation.create({
        type: "group",
        name,
        description,
        participants: allParticipants,
        admin: adminId,
      });

      return await conversation.populate(
        "participants",
        "username displayName avatar status",
      );
    } catch (error) {
      throw error;
    }
  }

  async addParticipant(conversationId, userId, newParticipantId) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      if (conversation.type !== "group") {
        throw new Error("Can only add participants to group chats");
      }

      if (conversation.admin.toString() !== userId.toString()) {
        throw new Error("Only admin can add participants");
      }

      if (conversation.participants.includes(newParticipantId)) {
        throw new Error("User is already a participant");
      }

      conversation.participants.push(newParticipantId);
      await conversation.save();

      return await conversation.populate(
        "participants",
        "username displayName avatar status",
      );
    } catch (error) {
      throw error;
    }
  }

  async removeParticipant(conversationId, userId, participantId) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      if (conversation.admin.toString() !== userId.toString()) {
        throw new Error("Only admin can remove participants");
      }

      if (conversation.admin.toString() === participantId.toString()) {
        throw new Error("Cannot remove admin from group");
      }

      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== participantId.toString(),
      );

      await conversation.save();

      return conversation;
    } catch (error) {
      throw error;
    }
  }

  async getMessages(conversationId, userId, limit = 50, before = null) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      if (!conversation.hasParticipant(userId)) {
        throw new Error("Not authorized to view this conversation");
      }

      const query = {
        conversationId,
        deletedFor: { $ne: userId },
      };

      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "username displayName avatar");

      return messages.reverse();
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(conversationId, userId, content) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      if (!conversation.hasParticipant(userId)) {
        throw new Error("Not authorized to send messages");
      }

      const message = await Message.create({
        conversationId,
        sender: userId,
        content,
      });

      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      return await message.populate("sender", "username displayName avatar");
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(conversationId, userId) {
    try {
      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: userId },
          "readBy.user": { $ne: userId },
        },
        {
          $push: {
            readBy: {
              user: userId,
              readAt: new Date(),
            },
          },
        },
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ConversationService();
