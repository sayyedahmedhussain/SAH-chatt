import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { getMessages, markSeen } from "../../services/messageService";
import toast from "react-hot-toast";

function MessageList() {
  const { selectedConversation, messages, setMessages, setTypingUserId } = useChat();
  const { socket } = useSocket();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markSeen(selectedConversation._id).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message) => {
      if (message.conversationId === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
        markSeen(selectedConversation._id).catch(() => {});
      }
    };

    const handleEdited = (message) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    const handleDeleted = ({ _id }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === _id ? { ...m, deleted: true, text: "", image: "" } : m))
      );
    };

    const handleReacted = (message) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    const handleSeen = ({ conversationId }) => {
      if (conversationId === selectedConversation?._id) {
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
      }
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === selectedConversation?._id) {
        setTypingUserId(userId);
      }
    };

    const handleStopTyping = ({ conversationId }) => {
      if (conversationId === selectedConversation?._id) {
        setTypingUserId(null);
      }
    };

    socket.on("receiveMessage", handleIncoming);
    socket.on("messageEdited", handleEdited);
    socket.on("messageDeleted", handleDeleted);
    socket.on("messageReacted", handleReacted);
    socket.on("messagesSeen", handleSeen);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleIncoming);
      socket.off("messageEdited", handleEdited);
      socket.off("messageDeleted", handleDeleted);
      socket.off("messageReacted", handleReacted);
      socket.off("messagesSeen", handleSeen);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedConversation]);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(selectedConversation._id);
      setMessages(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load messages");
    }
  };

  const handleUpdate = (updated) => {
    setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  };

  const handleDelete = (id) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === id ? { ...m, deleted: true, text: "", image: "" } : m))
    );
  };

  if (!selectedConversation) {
    return (
      <div className="hidden sm:flex flex-1 items-center justify-center text-slate-400 dark:text-slate-500">
        Select a user to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
          No messages yet.
          <br />
          Start the conversation 🚀
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isGroup={selectedConversation?.isGroup}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
