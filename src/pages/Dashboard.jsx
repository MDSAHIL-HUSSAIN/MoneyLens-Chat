import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatInput from "../components/ChatInput";
import ChatCards from "../components/ChatCards";
import ChatMessage from "../components/ChatMessage";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.level_1_simple_answer,
          sql: data.level_2_sql_query,
          rawData: data.level_3_raw_data,
          plan: data.execution_plan, 
          trustGraph: data.trustGraph // <-- ADDED THIS LINE!
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Couldn't connect to backend. Is the Python server running on localhost:8000?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6 flex flex-col relative h-full overflow-hidden">
        <ChatHeader />

        <div className="flex-1 flex flex-col items-center overflow-y-auto mb-4 w-full px-4 pb-20 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
              <h1 className="text-3xl font-semibold mb-2 text-gray-800">
                What will you discover today?
              </h1>
              <p className="text-gray-500 mb-6">
                Your AI credit card assistant
              </p>
              
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              
              <div className="mt-8">
                 <ChatCards />
              </div>
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

        {messages.length > 0 && (
          <div className="absolute bottom-6 left-0 w-full flex justify-center px-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}