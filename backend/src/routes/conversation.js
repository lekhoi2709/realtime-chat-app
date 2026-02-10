const express = require("express");
const router = express.Router();
const conversationService = require("../services/conversationService");

router.get("/", async (req, res) => {
  try {
    const conversations = await conversationService.getUserConversations(
      req.userId,
    );
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/private", async (req, res) => {
  try {
    const { friendId } = req.body;
    const conversation =
      await conversationService.getOrCreatePrivateConversation(
        req.userId,
        friendId,
      );
    res.json({ conversation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/group", async (req, res) => {
  try {
    const conversation = await conversationService.createGroupConversation(
      req.userId,
      req.body,
    );
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:conversationId/messages", async (req, res) => {
  try {
    const { limit, before } = req.query;
    const messages = await conversationService.getMessages(
      req.params.conversationId,
      req.userId,
      parseInt(limit) || 50,
      before,
    );
    res.json({ messages });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/:conversationId/messages", async (req, res) => {
  try {
    const { content } = req.body;
    const message = await conversationService.sendMessage(
      req.params.conversationId,
      req.userId,
      content,
    );
    res.status(201).json({ message });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/:conversationId/read", async (req, res) => {
  try {
    const result = await conversationService.markAsRead(
      req.params.conversationId,
      req.userId,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/:conversationId/participants", async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await conversationService.addParticipant(
      req.params.conversationId,
      req.userId,
      userId,
    );
    res.json({ conversation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete(
  "/:conversationId/participants/:participantId",
  async (req, res) => {
    try {
      const conversation = await conversationService.removeParticipant(
        req.params.conversationId,
        req.userId,
        req.params.participantId,
      );
      res.json({ conversation });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

module.exports = router;
