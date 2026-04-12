import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatInput from "../components/ChatInput";
import ChatCards from "../components/ChatCards";
import ChatMessage from "../components/ChatMessage";
import ConfirmRemindersModal from "../components/ConfirmRemindersModal";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("moneylens_chats");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => {
    const savedChats = localStorage.getItem("moneylens_chats");
    const parsed = savedChats ? JSON.parse(savedChats) : [];
    return parsed.length > 0 ? parsed[0].id : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [modalSubscriptions, setModalSubscriptions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("moneylens_chats", JSON.stringify(chats));
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChatId, isLoading]);

  // Listen for custom event to open reminders modal from ChatMessage
  useEffect(() => {
    const handleOpenRemindersModal = (event) => {
      const { subscriptions } = event.detail;
      setModalSubscriptions(subscriptions);
      setShowRemindersModal(true);
    };

    document.addEventListener("openCreateRemindersModal", handleOpenRemindersModal);
    return () => {
      document.removeEventListener("openCreateRemindersModal", handleOpenRemindersModal);
    };
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  const handleNewChat = () => setActiveChatId(null);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const handleDeleteChat = (chatIdToDelete) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatIdToDelete));
    if (activeChatId === chatIdToDelete) setActiveChatId(null);
  };

  const handleSendMessage = async (text) => {
    let currentChatId = activeChatId;

    if (!currentChatId) {
      const newChat = {
        id: Date.now().toString(),
        title: text.length > 25 ? text.substring(0, 25) + '...' : text,
        messages: []
      };
      currentChatId = newChat.id;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(currentChatId);
    }

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === currentChatId) {
        return { ...chat, messages: [...chat.messages, { role: "user", text }] };
      }
      return chat;
    }));
    
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();

      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                role: "assistant",
                text: data.level_1_simple_answer,
                sql: data.level_2_sql_query,
                rawData: data.level_3_raw_data,
                plan: data.execution_plan,
                trustGraph: data.trustGraph,
                expiring_subscriptions: data.expiring_subscriptions || []
              }
            ]
          };
        }
        return chat;
      }));

    } catch (error) {
      console.error("Chat Error:", error);
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                role: "assistant",
                text: "⚠️ Couldn't connect to backend. Is the Python server running on localhost:8000?",
              }
            ]
          };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        chats={chats} activeChatId={activeChatId} onSelectChat={setActiveChatId} 
        onNewChat={handleNewChat} onDeleteChat={handleDeleteChat} 
        isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}
      />
      <div className="flex-1 p-6 flex flex-col relative h-full overflow-hidden transition-all duration-300">
        <ChatHeader isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="flex-1 flex flex-col items-center overflow-y-auto mb-4 w-full px-4 pb-20 scrollbar-hide">
          {!activeChatId || messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
              <h1 className="text-3xl font-semibold mb-2 text-gray-800">What will you discover today?</h1>
              <p className="text-gray-500 mb-6">Your AI credit card assistant</p>
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              <div className="mt-8"><ChatCards /></div>
            </div>
          ) : (
            <div className="flex-1 w-full max-w-4xl flex flex-col pt-4">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex w-full justify-start mb-4">
                  <div className="max-w-[80%] p-4 rounded-xl shadow-sm bg-white border border-gray-100 rounded-bl-none flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {activeChatId && messages.length > 0 && (
          <div className="absolute bottom-6 left-0 w-full flex justify-center px-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl shadow-lg rounded-xl">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* Reminders Modal */}
      {showRemindersModal && (
        <ConfirmRemindersModal
          subscriptions={modalSubscriptions}
          onClose={() => setShowRemindersModal(false)}
          onSuccess={() => {
            // Optionally add a success toast notification here
          }}
        />
      )}
    </div>
  );
}