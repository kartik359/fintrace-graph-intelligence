import React from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  User, 
  CreditCard, 
  MapPin, 
  Globe, 
  ArrowUpRight, 
  ArrowDownLeft, 
  GitFork, 
  Search, 
  Fingerprint, 
  ExternalLink,
  Flame,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function EntityInspector({
  selectedNode,
  relationships = [],
  onClose,
  onRunUBO,
  onRunSanctions,
  onSelectNode
}) {
  if (!selectedNode) return null;

  const props = selectedNode.properties || {};
  const isSanctioned = props.sanctioned || selectedNode.label === 'SanctionList';
  const riskScore = props.riskScore !== undefined ? props.riskScore : (isSanctioned ? 100 : 25);

  // Filter connected relationships
  const connectedRels = relationships.filter(
    r => r.startNode === selectedNode.id || r.endNode === selectedNode.id
  );

  const getRiskBadge = (score) => {
    if (score >= 80) return <span className="badge-critical px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> High Risk ({score}/100)</span>;
    if (score >= 50) return <span className="badge-high px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Medium Risk ({score}/100)</span>;
    return <span className="badge-low px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Low Risk ({score}/100)</span>;
  };

  const getIcon = () => {
    switch (selectedNode.label) {
      case 'Person': return <User className="w-6 h-6 text-sky-400" />;
      case 'Company': return <Building2 className="w-6 h-6 text-emerald-400" />;
      case 'BankAccount': return <CreditCard className="w-6 h-6 text-amber-400" />;
      case 'SanctionList': return <ShieldAlert className="w-6 h-6 text-red-400" />;
      default: return <MapPin className="w-6 h-6 text-purple-400" />;
    }
  };

  return (
    <aside className="w-96 border-l border-white/10 bg-slate-900/95 backdrop-blur-xl flex flex-col h-full z-20 shrink-0 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-inner">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {selectedNode.label}
              </span>
              {props.isPEP && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PEP
                </span>
              )}
              {props.isNominee && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  NOMINEE
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white leading-snug">
              {props.name || props.accountNumber || props.value || selectedNode.id}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Risk Assessment Score Card */}
        <div className="glass-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Risk Assessment</span>
            <div className="mt-1">{getRiskBadge(riskScore)}</div>
          </div>
          {isSanctioned && (
            <div className="px-2.5 py-1 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold animate-pulse">
              SANCTION LISTED
            </div>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          {selectedNode.label === 'Company' && (
            <button
              onClick={() => onRunUBO(selectedNode.id)}
              className="px-3 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <GitFork className="w-3.5 h-3.5" />
              Trace UBO (1..6)
            </button>
          )}
          <button
            onClick={() => onRunSanctions(selectedNode.id)}
            className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Sanction Path
          </button>
        </div>

        {/* Entity Attributes Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            Entity Attributes
          </h3>
          <div className="glass-panel divide-y divide-white/5 text-xs">
            {Object.entries(props).map(([key, val]) => {
              if (key === 'tags' || typeof val === 'object') return null;
              return (
                <div key={key} className="px-3 py-2 flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-slate-200 font-mono text-right truncate max-w-[180px]">
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {props.tags && Array.isArray(props.tags) && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Compliance Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {props.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 text-[11px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connected Edges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Connected Edges ({connectedRels.length})
            </h3>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {connectedRels.map(rel => {
              const isOutgoing = rel.startNode === selectedNode.id;
              const otherNodeId = isOutgoing ? rel.endNode : rel.startNode;

              return (
                <div
                  key={rel.id}
                  onClick={() => onSelectNode(otherNodeId)}
                  className="glass-panel p-2 flex items-center justify-between text-xs hover:border-cyan-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    {isOutgoing ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-300">
                      {rel.type}
                    </span>
                    <span className="text-slate-400 truncate text-[11px]">
                      → {otherNodeId}
                    </span>
                  </div>
                  {rel.properties?.percentage && (
                    <span className="font-mono text-cyan-400 font-bold">
                      {rel.properties.percentage}%
                    </span>
                  )}
                  {rel.properties?.amount && (
                    <span className="font-mono text-amber-400 font-bold">
                      ${(rel.properties.amount / 1000000).toFixed(1)}M
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
