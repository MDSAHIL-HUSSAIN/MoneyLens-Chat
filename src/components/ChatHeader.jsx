export default function ChatHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-semibold">MoneyLens-Chat</h1>
      <div className="flex items-center gap-4">
        <span>🔔</span>
        <img
          src="https://i.pravatar.cc/40"
          className="rounded-full"
        />
      </div>

    </div>
  );
}