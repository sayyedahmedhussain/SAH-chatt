import { useState } from "react";
import {
  FaCheckDouble,
  FaCheck,
  FaTrash,
  FaPen,
  FaFilePdf,
  FaFileWord,
  FaFile,
  FaDownload,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { editMessage, deleteMessage } from "../../services/messageService";
import toast from "react-hot-toast";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileIcon = ({ type }) => {
  if (type === "application/pdf") return <FaFilePdf className="text-red-500 text-xl" />;
  if (type?.includes("word")) return <FaFileWord className="text-blue-500 text-xl" />;
  return <FaFile className="text-slate-400 text-xl" />;
};

function AttachmentGrid({ attachments, own }) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type?.startsWith("image/"));
  const documents = attachments.filter((a) => !a.type?.startsWith("image/"));

  return (
    <div className="mb-2 space-y-2">
      {images.length > 0 && (
        <div
          className={`grid gap-1.5 ${
            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {images.map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={img.url}
                alt={img.name || "attachment"}
                className="max-h-56 w-full rounded-xl object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {documents.map((doc, i) => (
        <a
          key={i}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          download={doc.name}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
            own
              ? "bg-white/15 hover:bg-white/25"
              : "bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <FileIcon type={doc.type} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{doc.name || "File"}</p>
            <p className={`text-xs ${own ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
              {formatSize(doc.size)}
            </p>
          </div>
          <FaDownload className="text-sm opacity-70 shrink-0" />
        </a>
      ))}
    </div>
  );
}

function MessageBubble({ message, onUpdate, onDelete, isGroup }) {
  const { user } = useAuth();

  const senderId = message.sender?._id || message.sender;
  const own = String(senderId) === String(user?._id);
  const senderName = message.sender?.username;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async () => {
    try {
      await deleteMessage(message._id);
      onDelete?.(message._id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete message");
    }
  };

  const handleEditSave = async () => {
    if (!editText.trim()) return;
    try {
      const updated = await editMessage(message._id, editText.trim());
      onUpdate?.(updated);
      setEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit message");
    }
  };

  if (message.deleted) {
    return (
      <div className={`flex mb-6 ${own ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[70%] rounded-3xl px-5 py-3 italic text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex mb-6 ${own ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[85%] sm:max-w-[70%]">

        {own && !editing && (
          <div className="absolute -top-3 right-2 hidden group-hover:flex gap-1 z-10">
            <button
              onClick={() => setEditing(true)}
              className="h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
              title="Edit"
            >
              <FaPen className="text-[10px]" />
            </button>
            <button
              onClick={handleDelete}
              className="h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-red-600"
              title="Delete"
            >
              <FaTrash className="text-[10px]" />
            </button>
          </div>
        )}

        <div
          className={`rounded-3xl px-4 sm:px-5 py-4 transition-all duration-300 hover:shadow-xl ${
            own
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-lg"
              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-700 rounded-bl-lg"
          }`}
        >
          {isGroup && !own && senderName && (
            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1">
              {senderName}
            </p>
          )}

          {/* Legacy single-image field (older messages) */}
          {message.image && (
            <a href={message.image} target="_blank" rel="noopener noreferrer">
              <img
                src={message.image}
                alt="attachment"
                className="mb-2 max-h-64 w-full rounded-xl object-cover"
              />
            </a>
          )}

          <AttachmentGrid attachments={message.attachments} own={own} />

          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                className="rounded-lg px-3 py-2 text-sm bg-white/20 outline-none"
                autoFocus
              />
              <div className="flex gap-2 text-xs">
                <button onClick={handleEditSave} className="underline">Save</button>
                <button onClick={() => setEditing(false)} className="underline opacity-70">Cancel</button>
              </div>
            </div>
          ) : (
            message.text && <p className="leading-7 text-[15px] whitespace-pre-wrap break-words">{message.text}</p>
          )}

          <div
            className={`flex items-center justify-end gap-2 mt-3 text-xs ${
              own ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {message.edited && <span className="italic">edited</span>}
            <span>{time}</span>
            {own && (message.seen ? (
              <FaCheckDouble className="text-blue-200" />
            ) : (
              <FaCheck className="text-blue-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
