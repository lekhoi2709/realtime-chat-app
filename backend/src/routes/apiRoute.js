const express = require("express");
const messageService = require("../services/messageService");
const router = express.Router();

router.get("/messages/:room", async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const messages = await messageService.getMessage(room, limit);

    res.json({
      room,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/rooms", async (req, res) => {
  try {
    const rooms = await messageService.getAllRooms();
    res.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

module.exports = router;
