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
    <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-3xl">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer"
        >
          <h3 className="font-semibold mb-2">{card.title}</h3>
          <p className="text-gray-500 text-sm">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}