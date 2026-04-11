import { useState } from "react";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-2xl flex items-center bg-white rounded-xl shadow p-3 mb-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Ask anything about your spending..."
        className="flex-1 outline-none px-2 bg-transparent text-gray-700 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
      >
        {isLoading ? (
          <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          "↑"
        )}
      </button>
    </div>
  );
}