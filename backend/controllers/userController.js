import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Get All Users (Except Logged-in User)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Search Users
export const searchUsers = async (req, res) => {
  res.send("Search Users");
};

// Get User By ID
export const getUserById = async (req, res) => {
  res.send("Get User By ID");
};

// Update Logged-in User's Profile — username, bio, profile picture, and/or password
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, bio, currentPassword, newPassword } = req.body;

    // Username
    if (username && username.trim()) {
      user.username = username.trim();
    }

    // Bio
    if (typeof bio === "string") {
      user.bio = bio.trim();
    }

    // Profile picture
    if (req.file) {
      // Best-effort cleanup of the old uploaded picture (ignore failures,
      // e.g. it was a placeholder / already deleted).
      if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
        const oldPath = path.join(process.cwd(), user.profilePicture);
        fs.unlink(oldPath, () => {});
      }
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    // Password change — requires the correct current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to set a new password",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
};
