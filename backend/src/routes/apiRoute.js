const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const friendRoutes = require("./friend");
const conversationRoutes = require("./conversation");

router.use("/auth", authRoutes);
router.use("/friends", friendRoutes);
router.use("/conversations", conversationRoutes);

module.exports = router;
