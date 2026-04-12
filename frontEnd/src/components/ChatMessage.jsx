import { useState } from "react";
import TrustGraph from "./TrustGraph";

// Helper function to render a beautiful table from the raw JSON data
const DataTable = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-xs text-gray-500 italic p-3">No tabular data returned.</div>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                {h.replace(/_/g, " ")} {/* Cleans up 'transaction_type' to 'transaction type' */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-purple-50/30 transition-colors">
              {headers.map((h) => (
                <td key={h} className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                  {row[h] !== null ? String(row[h]) : <span className="text-gray-400 italic">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const [activeTab, setActiveTab] = useState(null); 

  const toggleTab = (tabName) => {
    setActiveTab(activeTab === tabName ? null : tabName);
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-[90%] sm:max-w-[85%] p-5 rounded-2xl shadow-sm ${
          isUser
            ? "bg-purple-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
        }`}
      >
        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${!isUser && "text-gray-700"}`}>
          {message.text}
        </p>

        {!isUser && message.sql && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleTab("deep")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "deep" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Execution Plan
              </button>

              <button
                onClick={() => toggleTab("deepest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "deepest" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Data & SQL
              </button>

              <button
                onClick={() => toggleTab("graph")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "graph" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Verify Source
              </button>

              {message.expiring_subscriptions && message.expiring_subscriptions.length > 0 && (
                <button
                  onClick={() => toggleTab("subscriptions")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeTab === "subscriptions" ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Subscriptions ({message.expiring_subscriptions.length})
                </button>
              )}
            </div>

            {/* Tab Render Area */}
            <div className="mt-4 overflow-hidden transition-all duration-300">
              
              {/* --- 1. GO DEEP: The Upgraded Execution Plan --- */}
              {activeTab === "deep" && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      AI Reasoning
                    </h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Completed
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-5 bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Analytical Goal</span>
                      <div className="text-sm text-purple-900 font-medium leading-snug">{message.plan?.analytical_goal || "Analyze transaction patterns."}</div>
                    </div>
                    
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3 ml-1">Logical Steps Taken</span>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-200 before:to-transparent">
                        {message.plan?.logical_steps?.map((step, i) => (
                          <div key={i} className="relative flex items-start gap-3 group">
                            <div className="w-7 h-7 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-600 shrink-0 z-10 shadow-sm group-hover:border-purple-400 group-hover:bg-purple-50 transition-colors">
                              {i + 1}
                            </div>
                            <div className="text-xs text-gray-600 pt-1.5 leading-relaxed">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. DATA & SQL: The Upgraded Data Table View --- */}
              {activeTab === "deepest" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  
                  {/* Table rendering FIRST */}
                  <div className="bg-white">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                         Extracted Data
                       </span>
                    </div>
                    <DataTable data={message.rawData} />
                  </div>

                  {/* SQL code rendered SECOND */}
                  <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 shadow-inner">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Executed SQL
                    </span>
                    <pre className="text-xs text-purple-300 overflow-x-auto whitespace-pre-wrap font-mono scrollbar-hide">
                      <code>{message.sql}</code>
                    </pre>
                  </div>
                  
                </div>
              )}

              {/* --- 3. VERIFY SOURCE: The Trust Graph --- */}
              {activeTab === "graph" && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <TrustGraph graphData={message.trustGraph} />
                </div>
              )}

              {/* --- 4. SUBSCRIPTIONS: Expiring Subscriptions List --- */}
              {activeTab === "subscriptions" && message.expiring_subscriptions && message.expiring_subscriptions.length > 0 && (
                <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Expiring Subscriptions
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {message.expiring_subscriptions.map((sub, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{sub.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Expires: <span className="font-semibold text-red-600">{sub.expiry_date_str}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-blue-600">
                              {sub.currency} {sub.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white px-4 py-3 border-t border-blue-100 flex gap-3">
                    <button
                      onClick={() => {
                        // This will be wired up in step 7
                        document.dispatchEvent(new CustomEvent("openCreateRemindersModal", { 
                          detail: { subscriptions: message.expiring_subscriptions } 
                        }));
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Create Reminders
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}