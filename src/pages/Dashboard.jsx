import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatInput from "../components/ChatInput";
import ChatCards from "../components/ChatCards";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 p-6 flex flex-col">
        
        <ChatHeader />

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          
          <h1 className="text-3xl font-semibold mb-2">
            What will you discover today?
          </h1>
          <p className="text-gray-500 mb-6">
            Your AI credit card assistant
          </p>

          <ChatInput />

          <ChatCards />

        </div>

      </div>
    </div>
  );
}