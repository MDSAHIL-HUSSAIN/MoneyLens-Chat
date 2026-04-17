export default function SubscriptionCard({ subscription, compact = false }) {
  const { name, amount, currency, expiry_date_str } = subscription;

  if (compact) {
    return (
      <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-100 hover:border-blue-300 transition-colors">
        <div className="flex justify-between items-start gap-2">
          {/* min-w-0 allows the truncate to work properly inside a flex container */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-800 truncate">{name}</div>
            <div className="text-[11px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
              Expires: <span className="font-semibold text-red-600">{expiry_date_str}</span>
            </div>
          </div>
          {/* shrink-0 ensures the price never gets squished by a long name */}
          <div className="text-right shrink-0">
            <div className="font-bold text-sm sm:text-base text-blue-600">
              {currency} {amount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full card view for modals
  return (
    <div className="bg-white border-2 border-blue-100 rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          {/* Added break-words so a super long string will wrap nicely instead of spilling out */}
          <h3 className="font-bold text-sm sm:text-base text-gray-900 break-words leading-tight">{name}</h3>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 flex items-center gap-1">
            💳 Active Subscription
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 leading-none">
            {currency}
          </div>
          <div className="text-base sm:text-xl font-semibold text-gray-800 mt-1">
            {amount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-300 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-r">
        <div className="text-[10px] sm:text-xs font-semibold text-red-700 uppercase tracking-wider mb-0.5">
          ⏰ Expires
        </div>
        <div className="text-xs sm:text-sm font-bold text-red-600">
          {new Date(expiry_date_str).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 bg-blue-50 px-2.5 py-2 sm:px-3 sm:py-2 rounded">
        <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
          ℹ️ A reminder will be created on this date at 9:00 AM with email and popup notifications.
        </p>
      </div>
    </div>
  );
}