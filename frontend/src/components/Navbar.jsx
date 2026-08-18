import React from 'react';
import { 
  Database, 
  ShieldAlert, 
  Layers, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  Zap
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
  const isMock = !isConnected;

  return (
    <header className="h-16 border-b border-white/10 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              FinTrace
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              Graph Forensics
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span>Powered by</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400 inline" /> CognoDB
            </span>
            <span className="text-slate-600">•</span>
            <span>Bolt Protocol 5.x</span>
          </p>
        </div>
      </div>

      {/* Scenario Presets Bar */}
      <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-white/10 text-xs">
        <button
          onClick={() => onSelectScenario('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeScenario === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Entities ({stats ? stats.totalNodes : '31'})
        </button>
        <button
          onClick={() => onSelectScenario('pyramid')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeScenario === 'pyramid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          1. Offshore Pyramid (UBO)
        </button>
        <button
          onClick={() => onSelectScenario('circular')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeScenario === 'circular'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" style={{ animationDuration: '3s' }}></span>
          2. Circular Wash-Trading
        </button>
        <button
          onClick={() => onSelectScenario('nominee')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeScenario === 'nominee'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          3. Nominee Mailbox Farm
        </button>
      </div>

      {/* Right Controls & Connection Pill */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onResetLayout}
          title="Reset Graph Layout / Re-center"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Status Badge */}
        <div 
          onClick={onOpenSetupModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-amber-950/60 border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
          }`}
          title="Click for CognoDB Connection Details"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <span>{isConnected ? 'CognoDB Cloud Active' : 'Offline Mock Mode'}</span>
          <HelpCircle className="w-3.5 h-3.5 opacity-70" />
        </div>
      </div>
    </header>
  );
}
