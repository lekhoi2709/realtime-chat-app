const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const friendRoutes = require("./friend");
const conversationRoutes = require("./conversation");
const { authMiddleware } = require("../middlewares/auth");

router.use("/auth", authRoutes);
router.use("/friends", authMiddleware, friendRoutes);
router.use("/conversations", authMiddleware, conversationRoutes);

module.exports = router;
