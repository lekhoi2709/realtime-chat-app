const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authMiddleware } = require("../middlewares/auth");

router.post("/register", async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        friendCode: req.user.friendCode,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
        bio: req.user.bio,
        status: req.user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    req.user.status = "offline";
    await req.user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
