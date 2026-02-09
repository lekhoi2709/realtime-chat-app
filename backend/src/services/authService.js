const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

class AuthService {
  generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async register(userData) {
    try {
      const { username, email, password } = userData;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error("Email already registered");
        }
        if (existingUser.username === username) {
          throw new Error("Username already taken");
        }
      }

      let friendCode;
      let isUnique = false;
      while (!isUnique) {
        friendCode = User.generateFriendCode();
        const existing = await User.findOne({ friendCode });
        if (!existing) isUnique = true;
      }

      const user = await User.create({
        username,
        email,
        password,
        friendCode,
      });

      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          friendCode: user.friendCode,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { email, password } = credentials;

      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }

      user.status = "online";
      user.lastSeen = new Date();
      await user.save();

      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          friendCode: user.friendCode,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserByToken(token) {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) return null;

      const user = await User.findById(decoded.userId).select("-password");
      return user;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();
