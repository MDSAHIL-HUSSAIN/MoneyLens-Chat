export default function ChatInput() {
  return (
    <div className="w-full max-w-2xl flex items-center bg-white rounded-xl shadow p-3 mb-6">
      
      <input
        type="text"
        placeholder="Ask anything about your spending..."
        className="flex-1 outline-none px-2"
      />

      <button className="bg-purple-500 text-white px-4 py-2 rounded-lg">
        ↑
      </button>

    </div>
  );
}