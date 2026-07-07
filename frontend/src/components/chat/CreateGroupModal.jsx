import { useRef, useState } from "react";
import { FaTimes, FaUsers, FaCamera, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";
import { createGroup } from "../../services/conversationService";

function CreateGroupModal({ users, onClose, onCreated }) {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedIds.length < 2) {
      toast.error("Select at least 2 members for a group");
      return;
    }

    try {
      setCreating(true);
      const group = await createGroup(groupName.trim(), selectedIds, iconFile);
      toast.success("Group created!");
      onCreated?.(group);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FaUsers className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              New Group
            </h2>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <FaTimes className="text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Icon + name */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer shrink-0">
              <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Group icon preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera className="text-slate-400" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconChange}
              />
            </label>

            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Member picker */}
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Add members ({selectedIds.length} selected)
            </p>

            <div className="space-y-2">
              {users.map((u) => {
                const checked = selectedIds.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u._id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition border ${
                      checked
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-600/20"
                        : "border-transparent bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 shrink-0 rounded-md flex items-center justify-center border ${
                        checked
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {checked && <FaCheck className="text-white text-[10px]" />}
                    </div>

                    <span className="text-slate-900 dark:text-white text-sm font-medium">
                      {u.username}
                    </span>
                  </div>
                );
              })}

              {users.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">
                  No other users to add yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:scale-[1.01] transition px-4 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
