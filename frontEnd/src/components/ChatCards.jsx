export default function ChatCards() {
  const cards = [
    {
      title: "Spending Insights",
      desc: "Understand where your money goes",
    },
    {
      title: "AI Discoveries",
      desc: "Smart financial patterns",
    },
    {
      title: "Global Insights",
      desc: "Compare trends",
    },
  ];

  return (
    // Changed grid-cols-3 to be responsive: 1 col on mobile, 2 on small tablets, 3 on desktop
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 w-full max-w-3xl">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-50"
        >
          <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{card.title}</h3>
          <p className="text-gray-500 text-xs sm:text-sm">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}