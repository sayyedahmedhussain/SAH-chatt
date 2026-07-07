import express from "express";
import {
  createConversation,
  createGroupConversation,
  getConversations,
  addGroupMembers,
  removeGroupMember,
  updateGroupInfo,
} from "../controllers/conversationController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Create a new 1-to-1 conversation
router.post("/", protect, createConversation);

// Get all conversations of the logged-in user
router.get("/", protect, getConversations);

// Create a new group conversation (optional group icon upload)
router.post(
  "/group",
  protect,
  upload.single("groupIcon"),
  createGroupConversation
);

// Rename a group / update its icon
router.put(
  "/group/:id",
  protect,
  upload.single("groupIcon"),
  updateGroupInfo
);

// Add member(s) to a group
router.post("/group/:id/add", protect, addGroupMembers);

// Remove a member from a group, or leave it yourself
router.post("/group/:id/remove", protect, removeGroupMember);

export default router;
