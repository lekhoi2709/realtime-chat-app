const authService = require("../services/authService");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await authService.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const user = await authService.getUserByToken(token);

    if (!user) {
      return next(new Error("Invalid or expired token"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};

module.exports = { authMiddleware, socketAuthMiddleware };
