import chatHistory from "../data/chatHistory";

export default function Sidebar() {
  return (
    <div className="w-72 bg-white p-4 shadow-md">
      
      <h2 className="text-lg font-semibold mb-4">Chat History</h2>

      <button className="w-full bg-purple-500 text-white py-2 rounded-lg mb-4">
        + New Chat
      </button>

      <div className="space-y-3">
        {chatHistory.map((item, index) => (
          <div
            key={index}
            className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}