import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

// --- Custom Node 1: Source Data Node ---
const SourceNode = ({ data }) => {
  return (
    // Added tabIndex and focus states so mobile users can TAP to see the tooltip
    <div 
      tabIndex={0} 
      className="bg-white border-2 border-indigo-200 rounded-xl p-3 shadow-sm min-w-[160px] relative group transition-all hover:border-indigo-400 hover:shadow-md focus:outline-none focus:border-indigo-400 focus:shadow-md cursor-pointer sm:cursor-default"
    >
      {/* Connection Point */}
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-indigo-500 border-none" />
      
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <div className="text-xs font-bold text-gray-800 truncate">{data.label}</div>
      </div>
      
      {/* Participation Score Bar */}
      <div className="mt-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Participation</div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${data.score}%` }}></div>
      </div>
      <div className="text-right text-[10px] font-bold text-indigo-600 mt-1">{data.score}%</div>

      {/* Hover/Focus Tooltip (Data details) */}
      {/* Added group-focus:opacity-100 for mobile tap support */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[105%] mb-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity w-48 bg-gray-800 text-white text-xs p-2.5 rounded-lg shadow-xl pointer-events-none z-50">
        <div className="font-semibold text-indigo-300 mb-1">Source Details</div>
        {data.details}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
};

// --- Custom Node 2: Final Answer Node ---
const FinalNode = ({ data }) => {
  return (
    // Added tabIndex and focus states so mobile users can TAP to see the tooltip
    <div 
      tabIndex={0}
      className="bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400 rounded-xl p-4 shadow-lg min-w-[150px] relative group text-white focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer sm:cursor-default"
    >
      {/* Connection Point */}
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-white border-none" />
      
      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Final Answer</div>
      <div className="text-sm font-semibold">{data.label}</div>
      
      <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2">
        <span className="text-[10px] uppercase opacity-80">Trust Score</span>
        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{data.trustScore}%</span>
      </div>

      {/* Hover/Focus Tooltip */}
      {/* Added group-focus:opacity-100 for mobile tap support */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[105%] mb-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity w-48 bg-gray-800 text-white text-xs p-2.5 rounded-lg shadow-xl pointer-events-none z-50">
        <div className="font-semibold text-green-400 mb-1">Confidence Metrics</div>
        {data.details}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
};

// --- Main Graph Component ---
export default function TrustGraph({ graphData }) {
  const nodeTypes = useMemo(() => ({ sourceNode: SourceNode, finalNode: FinalNode }), []);

  if (!graphData || !graphData.nodes) {
    return <div className="p-4 text-center text-gray-500 text-sm">Generating trust logic...</div>;
  }

  return (
    // Changed fixed h-[300px] to be slightly shorter on mobile (250px) and expand on larger screens
    <div className="w-full h-[250px] sm:h-[300px] bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={graphData.nodes}
        edges={graphData.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }} // Hides the ReactFlow watermark cleanly
      >
        <Background color="#e2e8f0" gap={16} size={1} />
        {/* On mobile, controls can block nodes, added sm: block visibility classes if needed, but usually opacity helps */}
        <Controls showInteractive={false} className="opacity-50 hover:opacity-100 transition-opacity" />
      </ReactFlow>
    </div>
  );
}