import { useState } from "react";
import TrustGraph from "./TrustGraph";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const [activeTab, setActiveTab] = useState(null); 

  const toggleTab = (tabName) => {
    setActiveTab(activeTab === tabName ? null : tabName);
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-[85%] sm:max-w-[85%] p-5 rounded-2xl shadow-sm ${
          isUser
            ? "bg-purple-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
        }`}
      >
        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${!isUser && "text-gray-700"}`}>
          {message.text}
        </p>

        {!isUser && message.sql && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleTab("deep")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "deep" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Go Deep
              </button>

              <button
                onClick={() => toggleTab("deepest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "deepest" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                SQL & Data
              </button>

              <button
                onClick={() => toggleTab("graph")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "graph" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                Verify Source
              </button>
            </div>

            {/* Tab Render Area */}
            <div className="mt-3 overflow-hidden transition-all duration-300">
              
              {activeTab === "deep" && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">AI Execution Plan</h4>
                  <div className="text-sm text-purple-900 mb-3">
                    <span className="font-semibold">Goal:</span> {message.plan?.analytical_goal || "Analyze transaction patterns."}
                  </div>
                  <ul className="list-decimal pl-5 space-y-1 text-xs text-purple-800">
                    {message.plan?.logical_steps?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "deepest" && (
                <div className="space-y-3">
                  <div className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2 block">Executed SQL</span>
                    <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono scrollbar-hide">
                      <code>{message.sql}</code>
                    </pre>
                  </div>
                  {message.rawData && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                       <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2 block">Raw JSON Data</span>
                      <pre className="text-xs text-gray-600 overflow-x-auto max-h-48 font-mono scrollbar-hide">
                        <code>{JSON.stringify(message.rawData, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* The Graph Integration */}
              {activeTab === "graph" && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <TrustGraph graphData={message.trustGraph} />
                </div>
              )}
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}