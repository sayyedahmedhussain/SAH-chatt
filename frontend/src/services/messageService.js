import api from "./api";

// Get Messages
export const getMessages = async (conversationId) => {
  const res = await api.get(`/messages/${conversationId}`);
  return res.data;
};

// Send Message
export const sendMessage = async (data) => {
  const res = await api.post("/messages", data);
  return res.data;
};

// Edit Message
export const editMessage = async (id, text) => {
  const res = await api.put(`/messages/${id}`, { text });
  return res.data;
};

// Delete Message
export const deleteMessage = async (id) => {
  const res = await api.delete(`/messages/${id}`);
  return res.data;
};

// React to Message
export const reactToMessage = async (id, emoji) => {
  const res = await api.post(`/messages/${id}/react`, { emoji });
  return res.data;
};

// Mark conversation as seen
export const markSeen = async (conversationId) => {
  const res = await api.post(`/messages/seen/${conversationId}`);
  return res.data;
};

// Upload Image (legacy single-file, kept for backward compatibility)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post("/messages/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// Upload multiple files (images, PDFs, Word docs) — returns [{url, name, type, size}]
export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await api.post("/messages/upload-files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.files;
};
