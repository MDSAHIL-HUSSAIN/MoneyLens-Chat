import { useState, useRef, useEffect } from "react";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize the textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto first to calculate the new scrollHeight
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
      // Snap the height back down after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    // If user presses Enter WITHOUT Shift, send the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Stop it from actually adding a new line
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl flex items-end bg-white rounded-xl shadow-md border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Ask anything about your spending..."
        rows={1}
        className="flex-1 outline-none px-3 py-2 bg-transparent text-gray-700 disabled:opacity-50 resize-none max-h-32 overflow-y-auto min-h-[44px] scrollbar-hide"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="mb-0.5 ml-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px] h-[44px] shrink-0 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
}