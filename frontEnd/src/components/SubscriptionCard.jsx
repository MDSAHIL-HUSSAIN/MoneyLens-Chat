export default function SubscriptionCard({ subscription, compact = false }) {
  const { name, amount, currency, expiry_date_str } = subscription;

  if (compact) {
    return (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-800">{name}</div>
            <div className="text-xs text-gray-600 mt-1">
              Expires: <span className="font-semibold text-red-600">{expiry_date_str}</span>
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="font-bold text-base text-blue-600">
              {currency} {amount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full card view for modals
  return (
    <div className="bg-white border-2 border-blue-100 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-base text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">💳 Active Subscription</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {currency}
          </div>
          <div className="text-xl font-semibold text-gray-800">
            {amount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-300 px-3 py-2 rounded-r">
        <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
          ⏰ Expires
        </div>
        <div className="text-sm font-bold text-red-600">
          {new Date(expiry_date_str).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="mt-3 bg-blue-50 px-3 py-2 rounded">
        <p className="text-xs text-blue-700">
          ℹ️ A reminder will be created on this date at 9:00 AM with email and popup notifications.
        </p>
      </div>
    </div>
  );
}
