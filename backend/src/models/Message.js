const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      default: "Anonymous",
    },
    userId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamp: true },
);

messageSchema.index({ room: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);
