import api from "./api";

export const getUsers = () => {
  return api.get("/users");
};

// Update logged-in user's profile: username, bio, profile picture, password
// payload: { username?, bio?, profilePictureFile?, currentPassword?, newPassword? }
export const updateProfile = (payload) => {
  const formData = new FormData();

  if (payload.username !== undefined) formData.append("username", payload.username);
  if (payload.bio !== undefined) formData.append("bio", payload.bio);
  if (payload.currentPassword) formData.append("currentPassword", payload.currentPassword);
  if (payload.newPassword) formData.append("newPassword", payload.newPassword);
  if (payload.profilePictureFile) formData.append("profilePicture", payload.profilePictureFile);

  return api.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
