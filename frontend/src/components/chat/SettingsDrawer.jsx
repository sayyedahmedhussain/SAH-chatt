import { useRef, useState } from "react";
import {
  FaTimes,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaCamera,
  FaPen,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { updateProfile } from "../../services/userService";

const BACKEND_URL = "http://localhost:5000";

function SettingsDrawer({ open, onClose }) {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [username, setUsername] = useState(user?.username || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const profileImage =
    avatarPreview ||
    (user?.profilePicture
      ? `${BACKEND_URL}${user.profilePicture}`
      : `https://i.pravatar.cc/150?u=${user?._id}`);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const startEditingProfile = () => {
    setUsername(user?.username || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setEditingProfile(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setUsername(user?.username || "");
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Username can't be empty");
      return;
    }

    try {
      setSaving(true);
      const res = await updateProfile({
        username: username.trim(),
        profilePictureFile: avatarFile,
      });
      setUser(res.data.user);
      toast.success("Profile updated");
      setEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const startChangingPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(true);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ currentPassword, newPassword });
      toast.success("Password updated");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative h-full w-full sm:w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Settings
          </h2>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <FaTimes className="text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <img
              src={profileImage}
              alt={user?.username}
              className="h-20 w-20 rounded-2xl object-cover border border-slate-300 dark:border-slate-700"
              onError={(e) => {
                e.target.src = `https://i.pravatar.cc/150?u=${user?._id}`;
              }}
            />

            {editingProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700"
                title="Change photo"
              >
                <FaCamera className="text-xs" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {editingProfile ? (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full text-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
            />
          ) : (
            <h3 className="text-slate-900 dark:text-white font-semibold text-lg break-words text-center">
              {user?.username}
            </h3>
          )}

          <p className="text-slate-500 dark:text-slate-400 text-sm break-all text-center">
            {user?.email}
          </p>

          {editingProfile ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <FaCheck className="text-xs" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEditingProfile}
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition py-2.5 text-sm font-semibold text-slate-900 dark:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={startEditingProfile}
              className="flex items-center gap-2 text-indigo-500 hover:text-indigo-400 text-sm font-semibold"
            >
              <FaPen className="text-xs" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Password change */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          {changingPassword ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                <FaLock className="text-indigo-500" />
                Change Password
              </div>

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                </button>
              </div>

              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
              />

              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update Password"}
                </button>
                <button
                  onClick={() => setChangingPassword(false)}
                  className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition py-2 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startChangingPassword}
              className="w-full flex items-center justify-between text-slate-900 dark:text-white text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <FaLock className="text-indigo-500" />
                Change Password
              </span>
              <FaPen className="text-xs text-slate-400" />
            </button>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>

          {theme === "dark" ? <FaMoon /> : <FaSun />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-red-600/20 border border-red-600/40 px-4 py-3 text-red-400 hover:bg-red-600/30 transition"
        >
          <FaSignOutAlt />
          Log Out
        </button>
      </div>
    </div>
  );
}

export default SettingsDrawer;
