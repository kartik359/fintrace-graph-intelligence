import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Building2, 
  User, 
  CreditCard, 
  MapPin, 
  Globe, 
  ArrowUpRight, 
  ArrowDownLeft, 
  GitFork, 
  Fingerprint, 
  Flame,
  CheckCircle,
  AlertCircle,
  FileCode
} from 'lucide-react';

export default function EntityInspector({
  selectedNode,
  relationships = [],
  onClose,
  onRunUBO,
  onRunSanctions,
  onSelectNode
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!selectedNode) return null;

  const props = selectedNode.properties || {};
  const isSanctioned = props.sanctioned || selectedNode.label === 'SanctionList';
  const riskScore = props.riskScore !== undefined ? props.riskScore : (isSanctioned ? 100 : 25);

  // Filter connected relationships
  const connectedRels = relationships.filter(
    r => r.startNode === selectedNode.id || r.endNode === selectedNode.id
  );

  const getRiskBadge = (score) => {
    if (score >= 80) return <span className="badge-critical px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><Flame className="w-3 h-3" /> High Risk ({score}/100)</span>;
    if (score >= 50) return <span className="badge-high px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Medium Risk ({score}/100)</span>;
    return <span className="badge-low px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Low Risk ({score}/100)</span>;
  };

  const getIcon = () => {
    switch (selectedNode.label) {
      case 'Person': return <User className="w-5 h-5 text-sky-400" />;
      case 'Company': return <Building2 className="w-5 h-5 text-emerald-400" />;
      case 'BankAccount': return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'SanctionList': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      default: return <MapPin className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <aside className="w-80 sm:w-88 border-l border-white/10 bg-slate-950/95 backdrop-blur-2xl flex flex-col h-full z-20 shrink-0 shadow-2xl overflow-hidden select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-start justify-between gap-2 bg-slate-900/60">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
            {getIcon()}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {selectedNode.label}
              </span>
              {props.isPEP && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PEP
                </span>
              )}
              {props.isNominee && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  NOMINEE
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white leading-snug truncate">
              {props.name || props.accountNumber || props.value || selectedNode.id}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 text-xs bg-slate-900/40 px-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'text-cyan-300 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
            activeTab === 'connections'
              ? 'text-cyan-300 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Edges ({connectedRels.length})
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
            activeTab === 'json'
              ? 'text-cyan-300 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Risk Assessment Score Card */}
            <div className="glass-panel p-2.5 flex items-center justify-between border-white/10">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Risk Assessment</span>
                <div className="mt-1">{getRiskBadge(riskScore)}</div>
              </div>
              {isSanctioned && (
                <div className="px-2 py-0.5 rounded bg-red-950/90 border border-red-700 text-red-300 text-[10px] font-bold animate-pulse">
                  OFAC LISTED
                </div>
              )}
            </div>

            {/* Action Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              {selectedNode.label === 'Company' && (
                <button
                  onClick={() => onRunUBO(selectedNode.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  Trace UBO
                </button>
              )}
              <button
                onClick={() => onRunSanctions(selectedNode.id)}
                className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Sanction Path
              </button>
            </div>

            {/* Entity Attributes Table */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3 text-cyan-400" />
                Attributes
              </h3>
              <div className="glass-panel divide-y divide-white/5 text-xs border-white/10">
                {Object.entries(props).map(([key, val]) => {
                  if (key === 'tags' || typeof val === 'object') return null;
                  return (
                    <div key={key} className="px-2.5 py-1.5 flex justify-between items-start gap-2">
                      <span className="text-slate-400 font-medium capitalize text-[11px]">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-slate-200 font-mono text-right truncate max-w-[150px] text-[11px]">
                        {String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance Tags */}
            {props.tags && Array.isArray(props.tags) && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {props.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-white/10 text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-1.5">
            {connectedRels.length > 0 ? (
              connectedRels.map(rel => {
                const isOutgoing = rel.startNode === selectedNode.id;
                const otherNodeId = isOutgoing ? rel.endNode : rel.startNode;

                return (
                  <div
                    key={rel.id}
                    onClick={() => onSelectNode(otherNodeId)}
                    className="glass-panel p-2 flex items-center justify-between text-xs hover:border-cyan-500/50 cursor-pointer transition-colors border-white/10"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isOutgoing ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-300 text-[11px]">
                        {rel.type}
                      </span>
                      <span className="text-slate-400 truncate text-[10px]">
                        → {otherNodeId}
                      </span>
                    </div>
                    {rel.properties?.percentage && (
                      <span className="font-mono text-cyan-400 font-bold text-[11px]">
                        {rel.properties.percentage}%
                      </span>
                    )}
                    {rel.properties?.amount && (
                      <span className="font-mono text-amber-400 font-bold text-[11px]">
                        ${(rel.properties.amount / 1000000).toFixed(1)}M
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">No direct relationships.</div>
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <pre className="glass-panel p-2.5 font-mono text-[10px] text-cyan-300 overflow-x-auto border-white/10 max-h-96">
            {JSON.stringify(selectedNode, null, 2)}
          </pre>
        )}
      </div>
    </aside>
  );
}
