import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile backdrop — tap outside to close sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`fixed md:relative top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out flex-shrink-0 bg-white border-r border-gray-200 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.05)] overflow-hidden ${
          isOpen ? "w-72 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="w-72 p-4 h-full flex flex-col">

          <div className="flex items-center justify-between mb-8 px-2 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">MoneyLens</h2>
            </div>

            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-xl mb-6 transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <svg className="w-4 h-4 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-hide">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Recent Conversations
            </h3>

            {chats.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 italic">No recent chats.</p>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className="relative group w-full flex items-center">
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left p-3 text-sm rounded-xl cursor-pointer truncate transition-all flex items-center gap-3 pr-10 ${
                      chat.id === activeChatId
                        ? "bg-purple-50 text-purple-700 font-semibold shadow-sm border border-purple-100"
                        : "text-gray-600 bg-transparent hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 shrink-0 ${chat.id === activeChatId ? "text-purple-500" : "text-gray-400"}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="truncate">{chat.title}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete Chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/reminder")}
            className="w-full bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600"
          >
            + Create Reminder
          </button>

        </div>
      </div>
    </>
  );
}