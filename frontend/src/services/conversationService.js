import api from "./api";

// Create or Get 1-to-1 Conversation
export const createConversation = async (receiverId) => {
  const res = await api.post("/conversations", {
    receiverId,
  });

  return res.data;
};

// Get Logged-in User Conversations (includes groups)
export const getConversations = async () => {
  const res = await api.get("/conversations");

  return res.data;
};

// Create a Group Conversation
// participantIds: array of user ids (not including yourself)
// groupIconFile: optional File object
export const createGroup = async (groupName, participantIds, groupIconFile) => {
  const formData = new FormData();
  formData.append("groupName", groupName);
  formData.append("participantIds", JSON.stringify(participantIds));

  if (groupIconFile) {
    formData.append("groupIcon", groupIconFile);
  }

  const res = await api.post("/conversations/group", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// Rename a group / change its icon
export const updateGroupInfo = async (conversationId, groupName, groupIconFile) => {
  const formData = new FormData();
  if (groupName) formData.append("groupName", groupName);
  if (groupIconFile) formData.append("groupIcon", groupIconFile);

  const res = await api.put(`/conversations/group/${conversationId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// Add member(s) to a group
export const addGroupMembers = async (conversationId, participantIds) => {
  const res = await api.post(`/conversations/group/${conversationId}/add`, {
    participantIds,
  });

  return res.data;
};

// Remove a member from a group (admin only)
export const removeGroupMember = async (conversationId, memberId) => {
  const res = await api.post(`/conversations/group/${conversationId}/remove`, {
    memberId,
  });

  return res.data;
};

// Leave a group yourself
export const leaveGroup = async (conversationId) => {
  const res = await api.post(`/conversations/group/${conversationId}/remove`, {});

  return res.data;
};
