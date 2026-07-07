import { useRef, useState, useEffect } from "react";
import {
  FaPaperclip,
  FaTimes,
  FaFilePdf,
  FaFileWord,
  FaFile,
  FaSmile,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { sendMessage, uploadFiles } from "../../services/messageService";
import toast from "react-hot-toast";


let typingTimeout = null;

const MAX_FILES = 10;

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FilePreviewIcon = ({ file }) => {
  if (file.type.startsWith("image/")) {
    return (
      <img
        src={URL.createObjectURL(file)}
        alt={file.name}
        className="h-full w-full object-cover"
      />
    );
  }
  if (file.type === "application/pdf") {
    return <FaFilePdf className="text-red-500 text-2xl" />;
  }
  if (file.type.includes("word")) {
    return <FaFileWord className="text-blue-500 text-2xl" />;
  }
  return <FaFile className="text-slate-500 text-2xl" />;
};

function ChatInput() {
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

  const { selectedConversation, selectedUser, setMessages } = useChat();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Other participants to notify for typing indicators / socket targeting.
  // Works for both 1-1 chats (single id) and groups (multiple ids).
  const getOtherParticipantIds = () => {
    if (!selectedConversation) return [];
    if (selectedConversation.isGroup) {
      return selectedConversation.participants
        .map((p) => p._id || p)
        .filter((id) => id !== user?._id);
    }
    return selectedUser ? [selectedUser._id] : [];
  };

  const emitTyping = () => {
    const receiverIds = getOtherParticipantIds();
    if (!socket || !selectedConversation || receiverIds.length === 0) return;

    socket.emit("typing", {
      conversationId: selectedConversation._id,
      receiverIds,
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        conversationId: selectedConversation._id,
        receiverIds,
      });
    }, 1500);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping();
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const combined = [...prev, ...files];
      if (combined.length > MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files at once`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });

    // Allow selecting the same file again later
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!selectedConversation) {
      toast.error("Select a user first");
      return;
    }

    if (!text.trim() && selectedFiles.length === 0) return;

    const messageText = text;
    const filesToSend = selectedFiles;
    setText("");
    clearFiles();

    try {
      let attachments = [];

      if (filesToSend.length > 0) {
        setSending(true);
        attachments = await uploadFiles(filesToSend);
        setSending(false);
      }

      const newMessage = await sendMessage({
        conversationId: selectedConversation._id,
        text: messageText,
        attachments,
      });

      setMessages((prev) => [...prev, newMessage]);

      const receiverIds = getOtherParticipantIds();
      if (socket && receiverIds.length > 0) {
        socket.emit("stopTyping", {
          conversationId: selectedConversation._id,
          receiverIds,
        });
      }
    } catch (error) {
      console.error(error);
      setSending(false);
      toast.error("Failed to send message");
      setText(messageText);
      setSelectedFiles(filesToSend);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSend();
    }

    // Shift + Enter will automatically insert a new line.
  };
 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 pr-3 max-w-[220px]"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <FilePreviewIcon file={file} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center"
              >
                <FaTimes className="text-[9px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
  {showEmojiPicker && (
    <div
      ref={pickerRef}
      className="absolute bottom-20 left-0 z-50"
    >
      <EmojiPicker
        onEmojiClick={onEmojiClick}
        theme="auto"
        width={320}
        height={400}
      />
    </div>
  )}

  <div className="flex items-center gap-2 sm:gap-4 rounded-2xl border-2 border-slate-300 dark:border-transparent p-2">
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      onChange={handleFileSelect}
      className="hidden"
    />

    <button
      onClick={() => fileInputRef.current?.click()}
      className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center"
      title="Attach images, PDF, or Word files"
    >
      <FaPaperclip className="text-slate-700 dark:text-white" />
    </button>

    <button
      onClick={() => setShowEmojiPicker((prev) => !prev)}
      className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center"
      title="Emoji"
    >
      <FaSmile className="text-yellow-500 text-lg" />
    </button>

    <textarea
      placeholder="Type a message..."
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      rows={1}
      className="flex-1 min-w-0 resize-none bg-slate-100 dark:bg-slate-800 rounded-xl px-4 sm:px-5 py-3 text-slate-900 dark:text-white outline-none border-2 border-slate-300 dark:border-slate-700 focus:border-indigo-500 transition"
    />

    <button
      onClick={handleSend}
      disabled={sending}
      className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:scale-105 transition px-4 sm:px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50 border-2 border-slate-300 dark:border-transparent"
    >
      {sending ? "..." : "Send"}
    </button>
  </div>
</div>
    </div>
  );
}

export default ChatInput;
