import React from 'react';
import { 
  Database, 
  Layers, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  GitFork,
  Flame,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  connection, 
  stats, 
  activeScenario, 
  onSelectScenario, 
  onResetLayout, 
  onOpenSetupModal,
  loading 
}) {
  const isConnected = connection && connection.connected;

  return (
    <header className="h-14 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl px-3.5 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
            FinTrace
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 hidden sm:inline">
            Graph Intelligence
          </span>
        </div>
      </div>

      {/* Scenario Presets Pill Bar */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
        <button
          onClick={() => onSelectScenario('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
            activeScenario === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Entities ({stats ? stats.totalNodes : '31'})
        </button>
        <button
          onClick={() => onSelectScenario('pyramid')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeScenario === 'pyramid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          1. Offshore UBO
        </button>
        <button
          onClick={() => onSelectScenario('circular')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeScenario === 'circular'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          2. Wash Loops
        </button>
        <button
          onClick={() => onSelectScenario('nominee')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 hidden md:flex ${
            activeScenario === 'nominee'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          3. Nominee Farm
        </button>
      </div>

      {/* Right Controls & Connection Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={onResetLayout}
          title="Reset Graph Layout & Refresh"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* CognoDB Status Badge */}
        <div 
          onClick={onOpenSetupModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
            isConnected
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-amber-950/70 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
          }`}
          title="Click for CognoDB Connection Details"
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-[11px]">{isConnected ? 'CognoDB Cloud' : 'Offline Mode'}</span>
          <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
        </div>
      </div>
    </header>
  );
}
