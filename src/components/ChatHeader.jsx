export default function ChatHeader({ isSidebarOpen, toggleSidebar }) {
  return (
    <div className="flex justify-between items-center mb-6 w-full">
      
      <div className="flex items-center gap-3">
        {/* Hamburger Menu (Only visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">MoneyLens-Chat</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="cursor-pointer hover:text-purple-500 transition-colors">🔔</span>
        <img
          src="https://i.pravatar.cc/40"
          className="rounded-full w-10 h-10 border-2 border-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          alt="User Profile"
        />
      </div>

    </div>
  );
}