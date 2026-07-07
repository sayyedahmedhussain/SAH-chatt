import { FaCircle } from "react-icons/fa";
import { useChat } from "../../context/ChatContext";

const BACKEND_URL = "http://localhost:5000";

function ConversationCard({ user, isOnline, onClick }) {
  const { selectedUser } = useChat();

  const isSelected = selectedUser?._id === user._id;

  const profileImage = user?.profilePicture
    ? `${BACKEND_URL}${user.profilePicture}`
    : `https://i.pravatar.cc/150?u=${user._id}`;

  return (
    <div
      onClick={onClick}
      className={`group mb-3 cursor-pointer rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
      ${
        isSelected
          ? "border-2 border-indigo-300 bg-slate-50 shadow-md ring-1 ring-indigo-100 dark:border-indigo-500 dark:bg-indigo-600/20 dark:ring-0"
          : "border-2 border-slate-300 bg-slate-50 shadow-sm hover:border-slate-400 hover:bg-white hover:shadow-md dark:border-transparent dark:bg-slate-800/60 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={profileImage}
            alt={user.username}
            className="h-14 w-14 rounded-2xl object-cover"
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/150?u=${user._id}`;
            }}
          />

          {isOnline && (
            <FaCircle className="absolute bottom-0 right-0 text-[12px] text-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {user.username}
            </h3>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isOnline ? "Online" : ""}
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {user.lastMessage?.trim() ||
              user.bio?.trim() ||
              "Start a conversation"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConversationCard;