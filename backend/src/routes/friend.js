const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");

router.get("/", async (req, res) => {
  try {
    const friends = await friendService.getFriends(req.userId);
    res.json({ friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/request", async (req, res) => {
  try {
    const { friendCode } = req.body;
    const result = await friendService.sendFriendRequest(
      req.userId,
      friendCode,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/requests", async (req, res) => {
  try {
    const requests = await friendService.getFriendRequests(req.userId);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/requests/:requestId/accept", async (req, res) => {
  try {
    const result = await friendService.acceptFriendRequest(
      req.userId,
      req.params.requestId,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/requests/:requestId/reject", async (req, res) => {
  try {
    const result = await friendService.rejectFriendRequest(
      req.userId,
      req.params.requestId,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:friendId", async (req, res) => {
  try {
    const result = await friendService.removeFriend(
      req.userId,
      req.params.friendId,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
