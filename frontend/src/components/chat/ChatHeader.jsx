import { FaArrowLeft, FaCircle, FaUsers, FaInfoCircle } from "react-icons/fa";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getUsers } from "../../services/userService";
import { useEffect, useState } from "react";
import GroupInfoDrawer from "./GroupInfoDrawer";

const BACKEND_URL = "http://localhost:5000";

function ChatHeader() {
  const {
    selectedUser,
    selectedConversation,
    typingUserId,
    setMobileSidebarOpen,
    groupInfoOpen,
    setGroupInfoOpen,
  } = useChat();

  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (selectedConversation?.isGroup) {
      getUsers()
        .then((res) => setAllUsers(res.data))
        .catch(() => {});
    }
  }, [selectedConversation?.isGroup]);

  if (!selectedConversation) {
    return (
      <div className="m-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg hidden sm:block">
        <div className="flex items-center justify-center h-24">
          <h2 className="text-slate-500 dark:text-slate-400 text-lg">
            Select a user to start chatting
          </h2>
        </div>
      </div>
    );
  }

  const isGroup = selectedConversation.isGroup;

  if (isGroup) {
    const groupIcon = selectedConversation.groupIcon
      ? `${BACKEND_URL}${selectedConversation.groupIcon}`
      : null;

    const onlineMembers = selectedConversation.participants.filter(
      (p) => p._id !== user?._id && onlineUsers.includes(p._id)
    );

    const typingMember = selectedConversation.participants.find(
      (p) => p._id === typingUserId
    );

    return (
      <>
        <div className="m-3 sm:m-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="sm:hidden h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <FaArrowLeft className="text-slate-900 dark:text-white" />
              </button>

              {groupIcon ? (
                <img
                  src={groupIcon}
                  alt={selectedConversation.groupName}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shrink-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <FaUsers className="text-white text-xl" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {selectedConversation.groupName}
                </h2>

                <div className="flex items-center gap-2 mt-1">
                  {typingMember ? (
                    <span className="text-sm text-indigo-500 dark:text-indigo-400 animate-pulse">
                      {typingMember.username} is typing...
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {selectedConversation.participants.length} members
                      {onlineMembers.length > 0 &&
                        ` • ${onlineMembers.length} online`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setGroupInfoOpen(true)}
              className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Group info"
            >
              <FaInfoCircle className="text-slate-900 dark:text-white" />
            </button>
          </div>
        </div>

        <GroupInfoDrawer
          open={groupInfoOpen}
          onClose={() => setGroupInfoOpen(false)}
          allUsers={allUsers}
        />
      </>
    );
  }

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isTyping = typingUserId === selectedUser._id;

  const profileImage = selectedUser?.profilePicture
    ? `${BACKEND_URL}${selectedUser.profilePicture}`
    : `https://i.pravatar.cc/150?u=${selectedUser._id}`;

  return (
    <div className="m-3 sm:m-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="sm:hidden h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <FaArrowLeft className="text-slate-900 dark:text-white" />
          </button>

          <img
            src={profileImage}
            alt={selectedUser.username}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shrink-0"
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/150?u=${selectedUser._id}`;
            }}
          />

          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {selectedUser.username}
            </h2>

            <div className="flex items-center gap-2 mt-1">
              {isTyping ? (
                <span className="text-sm text-indigo-500 dark:text-indigo-400 animate-pulse">
                  typing...
                </span>
              ) : (
                <>
                  {isOnline && (
                    <FaCircle className="text-green-500 text-[10px]" />
                  )}

                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {isOnline ? "Active now" : "Offline"}
                    {selectedUser.bio
                      ? ` • ${selectedUser.bio}`
                      : ""}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ChatHeader;
