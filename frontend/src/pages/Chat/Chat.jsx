import { useChat } from "../../context/ChatContext";
import Sidebar from "../../components/chat/Sidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import ChatInput from "../../components/chat/ChatInput";

function Chat() {
  const { mobileSidebarOpen } = useChat();

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 relative overflow-hidden p-0 sm:p-5">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600 blur-[180px] opacity-20"></div>
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500 blur-[180px] opacity-20"></div>

      <div className="relative h-screen sm:h-[calc(100vh-40px)] sm:rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-2xl flex overflow-hidden">

        {/* Sidebar: always visible on desktop, toggled on mobile */}
        <div
          className={`${
            mobileSidebarOpen ? "flex" : "hidden"
          } sm:flex absolute sm:relative z-20 h-full w-full sm:w-[340px]`}
        >
          <Sidebar />
        </div>

        {/* Chat Section: hidden on mobile until a conversation is selected */}
        <div
          className={`${
            mobileSidebarOpen ? "hidden" : "flex"
          } sm:flex flex-1 flex-col bg-sky-200/60 dark:bg-slate-950 w-full`}
        >
          <ChatHeader />
          <MessageList />
          <ChatInput />
        </div>

      </div>
    </div>
  );
}

export default Chat;
