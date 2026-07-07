import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [typingUserId, setTypingUserId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        selectedUser,
        setSelectedUser,

        selectedConversation,
        setSelectedConversation,

        messages,
        setMessages,

        conversations,
        setConversations,

        typingUserId,
        setTypingUserId,

        mobileSidebarOpen,
        setMobileSidebarOpen,

        groupInfoOpen,
        setGroupInfoOpen,

        createGroupOpen,
        setCreateGroupOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
