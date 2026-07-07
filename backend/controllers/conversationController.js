import Conversation from "../models/Conversation.js";
import { getIO, getOnlineUsers } from "../socket/socket.js";

const POPULATE_FIELDS = "username profilePicture bio isOnline";

// Notify every participant (except the actor) that something about the
// conversation changed, so their sidebar / group info can refresh live.
const notifyParticipants = (conversation, actorId, event, payload) => {
  const io = getIO();
  const onlineUsers = getOnlineUsers();

  conversation.participants.forEach((p) => {
    const participantId = (p._id || p).toString();
    if (participantId === actorId.toString()) return;

    const socketId = onlineUsers.get(participantId);
    if (socketId) {
      io.to(socketId).emit(event, payload);
    }
  });
};

// Create (or fetch existing) 1-to-1 Conversation
export const createConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    const existingConversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId], $size: 2 },
    }).populate("participants", POPULATE_FIELDS);

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const conversation = await Conversation.create({
      participants: [senderId, receiverId],
      isGroup: false,
    });

    await conversation.populate("participants", POPULATE_FIELDS);

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Create a Group Conversation
export const createGroupConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { groupName, participantIds } = req.body;

    let ids = participantIds;
    if (typeof ids === "string") {
      try {
        ids = JSON.parse(ids);
      } catch {
        ids = ids.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    if (!groupName?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({
        message: "A group needs at least 2 other members",
      });
    }

    const participants = Array.from(new Set([senderId.toString(), ...ids]));

    const groupIcon = req.file ? `/uploads/${req.file.filename}` : "";

    const conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: groupName.trim(),
      groupIcon,
      groupAdmin: senderId,
    });

    await conversation.populate("participants", POPULATE_FIELDS);

    notifyParticipants(conversation, senderId, "groupCreated", conversation);

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all conversations (1-1 and group) for the logged-in user
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", POPULATE_FIELDS)
      .sort({ lastMessageTime: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add member(s) to a group
export const addGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    let { participantIds } = req.body;

    if (!Array.isArray(participantIds)) {
      participantIds = [participantIds].filter(Boolean);
    }

    const conversation = await Conversation.findById(id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    const existing = conversation.participants.map((p) => p.toString());
    const toAdd = participantIds.filter((pid) => !existing.includes(pid));

    conversation.participants.push(...toAdd);
    await conversation.save();
    await conversation.populate("participants", POPULATE_FIELDS);

    notifyParticipants(conversation, req.user._id, "groupUpdated", conversation);

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a member from a group (admin only) or leave the group (self)
export const removeGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;
    const actingId = memberId || req.user._id.toString();

    const conversation = await Conversation.findById(id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isSelf = actingId.toString() === req.user._id.toString();
    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString();

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== actingId.toString()
    );

    // Reassign admin if the admin left, promoting the next member
    if (conversation.groupAdmin?.toString() === actingId.toString()) {
      conversation.groupAdmin = conversation.participants[0] || null;
    }

    await conversation.save();
    await conversation.populate("participants", POPULATE_FIELDS);

    notifyParticipants(conversation, req.user._id, "groupUpdated", conversation);

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rename a group / update its icon
export const updateGroupInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName } = req.body;

    const conversation = await Conversation.findById(id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groupName?.trim()) {
      conversation.groupName = groupName.trim();
    }

    if (req.file) {
      conversation.groupIcon = `/uploads/${req.file.filename}`;
    }

    await conversation.save();
    await conversation.populate("participants", POPULATE_FIELDS);

    notifyParticipants(conversation, req.user._id, "groupUpdated", conversation);

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
