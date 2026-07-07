import { useState } from "react";
import { FaTimes, FaCrown, FaUserMinus, FaSignOutAlt, FaUserPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import {
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
} from "../../services/conversationService";

const BACKEND_URL = "http://localhost:5000";

function GroupInfoDrawer({ open, onClose, allUsers }) {
  const { user } = useAuth();
  const {
    selectedConversation,
    setSelectedConversation,
    setSelectedUser,
    conversations,
    setConversations,
  } = useChat();

  const [adding, setAdding] = useState(false);

  if (!open || !selectedConversation?.isGroup) return null;

  const isAdmin =
    selectedConversation.groupAdmin === user?._id ||
    selectedConversation.groupAdmin?._id === user?._id;

  const memberIds = selectedConversation.participants.map((p) => p._id);
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u._id));

  const groupIcon = selectedConversation.groupIcon
    ? `${BACKEND_URL}${selectedConversation.groupIcon}`
    : `https://i.pravatar.cc/150?u=${selectedConversation._id}`;

  const updateConversationEverywhere = (updated) => {
    setSelectedConversation(updated);
    setConversations((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  const handleAddMember = async (id) => {
    try {
      setAdding(true);
      const updated = await addGroupMembers(selectedConversation._id, [id]);
      updateConversationEverywhere(updated);
      toast.success("Member added");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (id) => {
    try {
      const updated = await removeGroupMember(selectedConversation._id, id);
      updateConversationEverywhere(updated);
      toast.success("Member removed");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(selectedConversation._id);
      setConversations((prev) =>
        prev.filter((c) => c._id !== selectedConversation._id)
      );
      setSelectedConversation(null);
      setSelectedUser(null);
      onClose();
      toast.success("You left the group");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative h-full w-full sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">        <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Group Info
        </h2>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <FaTimes className="text-slate-900 dark:text-white" />
        </button>
      </div>

        <div className="flex flex-col items-center gap-3">
          <img
            src={groupIcon}
            alt={selectedConversation.groupName}
            className="h-20 w-20 rounded-2xl object-cover border border-slate-300 dark:border-slate-700"
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/150?u=${selectedConversation._id}`;
            }}
          />
          <h3 className="text-slate-900 dark:text-white font-semibold text-lg text-center">
            {selectedConversation.groupName}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {selectedConversation.participants.length} members
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
            Members
          </p>

          <div className="space-y-2">
            {selectedConversation.participants.map((p) => {
              const isThisAdmin =
                selectedConversation.groupAdmin === p._id ||
                selectedConversation.groupAdmin?._id === p._id;
              const profileImage = p.profilePicture
                ? `${BACKEND_URL}${p.profilePicture}`
                : `https://i.pravatar.cc/150?u=${p._id}`;

              return (
                <div
                  key={p._id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <img
                    src={profileImage}
                    alt={p.username}
                    className="h-9 w-9 rounded-xl object-cover"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                    {p.username} {p._id === user?._id && "(You)"}
                  </span>
                  {isThisAdmin && (
                    <FaCrown className="text-amber-500 text-xs" title="Admin" />
                  )}
                  {isAdmin && p._id !== user?._id && (
                    <button
                      onClick={() => handleRemoveMember(p._id)}
                      className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
                      title="Remove member"
                    >
                      <FaUserMinus className="text-[10px]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {nonMembers.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Add people
            </p>
            <div className="space-y-2">
              {nonMembers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                    {u.username}
                  </span>
                  <button
                    disabled={adding}
                    onClick={() => handleAddMember(u._id)}
                    className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-500 disabled:opacity-50"
                    title="Add member"
                  >
                    <FaUserPlus className="text-[10px]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleLeaveGroup}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-red-600/20 border border-red-600/40 px-4 py-3 text-red-400 hover:bg-red-600/30 transition"
        >
          <FaSignOutAlt />
          Leave Group
        </button>
      </div>
    </div>
  );
}

export default GroupInfoDrawer;
