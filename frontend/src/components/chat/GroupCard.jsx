import { FaUsers } from "react-icons/fa";

const BACKEND_URL = "http://localhost:5000";

function GroupCard({ group, isSelected, onClick }) {
  const groupIcon = group.groupIcon
    ? `${BACKEND_URL}${group.groupIcon}`
    : null;

  return (
    <div
      onClick={onClick}
      className={`group mb-3 cursor-pointer rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
      ${
        isSelected
          ? "border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-600/20 shadow-lg"
          : "border-2 border-slate-300 bg-slate-100/70 dark:border-transparent dark:bg-slate-800/60 hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {groupIcon ? (
            <img
              src={groupIcon}
              alt={group.groupName}
              className="h-14 w-14 rounded-2xl object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <FaUsers className="text-white text-xl" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {group.groupName}
            </h3>

            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              {group.participants?.length || 0} members
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {group.lastMessage?.trim() || "Start the conversation"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GroupCard;
