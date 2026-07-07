import express from "express";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  markSeen,
  uploadImage,
  uploadFiles,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import upload, { uploadChatFiles } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessages);
router.put("/:id", protect, editMessage);
router.delete("/:id", protect, deleteMessage);
router.post("/:id/react", protect, reactToMessage);
router.post("/seen/:conversationId", protect, markSeen);
router.post("/upload", protect, upload.single("image"), uploadImage);
router.post(
  "/upload-files",
  protect,
  uploadChatFiles.array("files", 10),
  uploadFiles
);

export default router;
