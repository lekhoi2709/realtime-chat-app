const Message = require("../models/Message");
const Room = require("../models/Room");

class MessageService {
  async saveMessage(roomName, messageData) {
    try {
      const message = await Message.create({
        room: roomName,
        message: messageData.content,
        username: messageData.username || "Anonymous",
        userId: messageData.userId,
        timestamp: new Date(),
      });

      await Room.findOneAndUpdate(
        { name: roomName },
        {
          $inc: { messageCount: 1 },
          lastActivity: new Date(),
        },
        { upsert: true, new: true },
      );

      return message;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  }

  async getMessage(roomName, limit = 50) {
    try {
      const messages = await Message.find({ room: roomName })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return messages.reverse();
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async getAllRooms() {
    try {
      const rooms = await Room.find().sort({ lastActivity: -1 }).lean();

      return rooms;
    } catch (error) {
      console.error("Error getting rooms:", error);
      throw error;
    }
  }

  async getOrCreateRoom(roomName, createdBy = "system") {
    try {
      let room = await Room.findOne({ name: roomName });

      if (!room) {
        room = await Room.create({
          name: roomName,
          createdBy,
          lastActivity: new Date(),
        });
        console.log(`Created new room: ${roomName}`);
      }

      return room;
    } catch (error) {
      console.error("Error creating/getting room:", error);
      throw error;
    }
  }

  async deleteOldMessages(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Message.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      console.log(`Deleted ${result.deletedCount} old messages`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error deleting old messages:", error);
      throw error;
    }
  }
}

module.exports = new MessageService();
