import { useEffect, useState } from "react";
import { FaComments, FaSearch, FaCog, FaUsers, FaPlus } from "react-icons/fa";
import ConversationCard from "./ConversationCard";
import GroupCard from "./GroupCard";
import CreateGroupModal from "./CreateGroupModal";
import SettingsDrawer from "./SettingsDrawer";
import { getUsers } from "../../services/userService";
import {
  createConversation,
  getConversations,
} from "../../services/conversationService";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";

function Sidebar() {
  const BACKEND_URL = "http://localhost:5000";

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState("chats"); // "chats" | "groups"

  const { user } = useAuth();
  const { onlineUsers, socket } = useSocket();

  const {
    setSelectedUser,
    selectedConversation,
    setSelectedConversation,
    conversations,
    setConversations,
    setMobileSidebarOpen,
    createGroupOpen,
    setCreateGroupOpen,
  } = useChat();

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversationId);

        if (idx === -1) {
          fetchConversations();
          return prev;
        }

        const updatedConversation = {
          ...prev[idx],
          lastMessage: message.text || (message.image ? "📷 Image" : ""),
          lastMessageTime: message.createdAt,
        };

        const rest = prev.filter((c) => c._id !== message.conversationId);
        return [updatedConversation, ...rest];
      });
    };

    // A new group we were added to just got created
    const handleGroupCreated = (conversation) => {
      setConversations((prev) => {
        if (prev.find((c) => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
      toast.success(`You were added to "${conversation.groupName}"`);
    };

    // Group info changed (members added/removed, renamed, icon changed)
    const handleGroupUpdated = (conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversation._id);
        if (!exists) return [conversation, ...prev];
        return prev.map((c) => (c._id === conversation._id ? conversation : c));
      });

      // Keep the open chat's header/info panel in sync if it's this group
      setSelectedConversation((prevSelected) =>
        prevSelected && prevSelected._id === conversation._id
          ? conversation
          : prevSelected
      );
    };

    socket.on("receiveMessage", handleIncoming);
    socket.on("groupCreated", handleGroupCreated);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("receiveMessage", handleIncoming);
      socket.off("groupCreated", handleGroupCreated);
      socket.off("groupUpdated", handleGroupUpdated);
    };
  }, [socket]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectUser = async (selUser) => {
    try {
      setSelectedUser(selUser);

      const conversation = await createConversation(selUser._id);

      setSelectedConversation(conversation);
      setMobileSidebarOpen(false);

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversation._id);

        if (exists) return prev;

        return [conversation, ...prev];
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to open conversation");
    }
  };

  const handleSelectGroup = (conversation) => {
    setSelectedUser(null);
    setSelectedConversation(conversation);
    setMobileSidebarOpen(false);
  };

  const handleGroupCreated = (conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    setTab("groups");
    handleSelectGroup(conversation);
  };

  const groupConversations = conversations.filter((c) => c.isGroup);

  const enrichedUsers = users.map((u) => {
    const conv = conversations.find(
      (c) => !c.isGroup && c.participants?.some((p) => p._id === u._id)
    );

    return {
      ...u,
      conversation: conv || null,
      lastMessage: conv?.lastMessage || "",
      lastMessageTime: conv?.lastMessageTime || null,
    };
  });

  const filteredUsers = enrichedUsers
    .filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

  const filteredGroups = groupConversations
    .filter((g) => g.groupName.toLowerCase().includes(search.toLowerCase()))
    .sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

  const profileImage = user?.profilePicture
    ? `${BACKEND_URL}${user.profilePicture}`
    : `https://i.pravatar.cc/150?u=${user?._id}`;

  return (
<div className="w-full sm:w-[340px] bg-indigo-300 dark:bg-slate-900/80 backdrop-blur-xl border-r border-indigo-400 dark:border-slate-800 flex flex-col">
      <div className="px-6 py-6 border-b border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <FaComments className="text-white text-2xl" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              SAH-Chatt
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-transparent p-1">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition border ${tab === "chats"
              ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-transparent text-indigo-600 dark:text-indigo-400 shadow"
              : "border-transparent text-slate-500 dark:text-slate-400"
              }`}
          >
            Chats
          </button>
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 border ${tab === "groups"
              ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-transparent text-indigo-600 dark:text-indigo-400 shadow"
              : "border-transparent text-slate-500 dark:text-slate-400"
              }`}
          >
            <FaUsers className="text-xs" />
            Groups
          </button>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder={tab === "chats" ? "Search people..." : "Search groups..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 py-3 pl-11 pr-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
          />
        </div>

        {tab === "groups" && (
          <button
            onClick={() => setCreateGroupOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition py-2.5 text-sm font-semibold text-white"
          >
            <FaPlus className="text-xs" />
            New Group
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5">
        {tab === "chats" ? (
          <>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Contacts
            </h3>

            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <ConversationCard
                  key={u._id}
                  user={u}
                  isOnline={onlineUsers.includes(u._id)}
                  onClick={() => handleSelectUser(u)}
                />
              ))
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-center mt-10">
                No users found
              </p>
            )}
          </>
        ) : (
          <>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Your Groups
            </h3>

            {filteredGroups.length > 0 ? (
              filteredGroups.map((g) => (
                <GroupCard
                  key={g._id}
                  group={g}
                  isSelected={selectedConversation?._id === g._id}
                  onClick={() => handleSelectGroup(g)}
                />
              ))
            ) : (
              <div className="text-center mt-10">
                <p className="text-slate-400 dark:text-slate-500 mb-4">
                  No groups yet
                </p>
                <button
                  onClick={() => setCreateGroupOpen(true)}
                  className="text-indigo-500 hover:text-indigo-400 text-sm font-semibold"
                >
                  Create your first group
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
<div className="border-t border-indigo-500 dark:border-slate-800 bg-indigo-500/15 dark:bg-transparent px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-300 dark:border-transparent p-2">

          <div className="flex items-center gap-3 min-w-0">

            <img
              src={profileImage}
              alt="Profile"
              className="h-12 w-12 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
              onError={(e) => {
                e.target.src = `https://i.pravatar.cc/150?u=${user?._id}`;
              }}
            />

            <div className="min-w-0">
              <h4 className="text-slate-900 dark:text-white font-semibold truncate">
                {user?.username || "You"}
              </h4>

              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Online
              </p>
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            <FaCog className="text-slate-900 dark:text-white" />
          </button>

        </div>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {createGroupOpen && (
        <CreateGroupModal
          users={users}
          onClose={() => setCreateGroupOpen(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

export default Sidebar;
