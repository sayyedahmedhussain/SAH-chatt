import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getIO, getOnlineUsers } from "../socket/socket.js";

// Returns the socketIds of every participant in the conversation
// EXCEPT the current user — works for both 1-1 chats and groups.
const getOtherParticipantSockets = (conversation, myId) => {
  const onlineUsers = getOnlineUsers();

  return conversation.participants
    .map((p) => (p._id || p).toString())
    .filter((id) => id !== myId.toString())
    .map((id) => onlineUsers.get(id))
    .filter(Boolean);
};

const emitToConversation = (conversation, myId, event, payload) => {
  const io = getIO();
  const socketIds = getOtherParticipantSockets(conversation, myId);
  socketIds.forEach((socketId) => io.to(socketId).emit(event, payload));
};

// Send Message (text and/or image) — works for direct AND group conversations
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, image, replyTo, attachments } = req.body;

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!conversationId || (!text?.trim() && !image && !hasAttachments)) {
      return res.status(400).json({
        message:
          "Conversation ID and message text, image, or attachment are required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: text?.trim() || "",
      image: image || "",
      attachments: hasAttachments ? attachments : [],
      replyTo: replyTo || null,
    });

    await message.populate("sender", "username profilePicture");
    await message.populate("replyTo");

    const lastMessagePreview =
      text?.trim() ||
      (hasAttachments
        ? attachments.length === 1
          ? `📎 ${attachments[0].name || "Attachment"}`
          : `📎 ${attachments.length} files`
        : image
        ? "📷 Image"
        : "");

    conversation.lastMessage = lastMessagePreview;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    emitToConversation(conversation, req.user._id, "receiveMessage", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get Messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate("sender", "username profilePicture")
      .populate("replyTo")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Edit Message
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.text = text?.trim() || message.text;
    message.edited = true;
    await message.save();
    await message.populate("sender", "username profilePicture");

    const conversation = await Conversation.findById(message.conversationId);
    emitToConversation(conversation, req.user._id, "messageEdited", message);

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.deleted = true;
    message.text = "";
    message.image = "";
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    emitToConversation(conversation, req.user._id, "messageDeleted", {
      _id: message._id,
    });

    res.status(200).json({ _id: message._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// React to Message (toggle)
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIndex !== -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions = message.reactions.filter(
        (r) => r.user.toString() !== req.user._id.toString()
      );
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    emitToConversation(conversation, req.user._id, "messageReacted", message);

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as seen
export const markSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        seen: false,
      },
      { $set: { seen: true } }
    );

    const conversation = await Conversation.findById(conversationId);
    emitToConversation(conversation, req.user._id, "messagesSeen", {
      conversationId,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Upload Image (legacy single-file endpoint, kept for backward compatibility)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Upload multiple files (images, PDFs, Word docs) — returns metadata for each
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const base = `${req.protocol}://${req.get("host")}`;

    const files = req.files.map((file) => ({
      url: `${base}/uploads/${file.filename}`,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    }));

    res.status(200).json({ files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
