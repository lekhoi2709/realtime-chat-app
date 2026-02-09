const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group"],
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 250,
  },
  avatar: {
    type: String,
    default: null,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((p) => p.toString() === userId.toString());
};

module.exports = mongoose.model("Conversation", conversationSchema);
