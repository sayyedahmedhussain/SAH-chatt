import express from "express";
import {
  getUsers,
  searchUsers,
  getUserById,
  updateProfile,
} from "../controllers/userController.js";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Get all users
router.get("/", protect, getUsers);

// Search users
router.get("/search", protect, searchUsers);

// Update own profile (username / bio / profile picture / password)
router.put(
  "/profile",
  protect,
  upload.single("profilePicture"),
  updateProfile
);

// Get user by ID
router.get("/:id", protect, getUserById);

export default router;
