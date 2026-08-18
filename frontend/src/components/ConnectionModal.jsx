import React from 'react';
import { X, Database, CheckCircle2, AlertTriangle, ExternalLink, Terminal, Key, ShieldCheck } from 'lucide-react';

export default function ConnectionModal({ connection, isOpen, onClose }) {
  if (!isOpen) return null;

  const isConnected = connection && connection.connected;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl bg-slate-900/95 border border-white/15 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">CognoDB Cloud Connection Status</h2>
              <p className="text-xs text-slate-400">Bolt Protocol 5.x Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Current Status Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected 
              ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {isConnected ? 'Connected to Live CognoDB Cloud' : 'Running in Offline Mock / Demo Mode'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isConnected 
                  ? `Active Bolt session connected to ${connection.uri}. Queries are running directly against your managed graph database cluster.`
                  : `No CognoDB credentials found in .env. FinTrace is serving the rich forensic dataset with in-memory graph analytics fallback so all UI workflows, UBO algorithms, and visualisations remain 100% testable.`
                }
              </p>
            </div>
          </div>

          {/* How to Connect CognoDB Cloud */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              How to Connect Your Free CognoDB Cloud Instance:
            </h3>

            <div className="space-y-2.5 text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Sign up for CognoDB Cloud:</strong>
                  <div className="mt-0.5 text-slate-400">
                    Visit{' '}
                    <a 
                      href="https://console.cognodb.com/signup" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cyan-400 underline inline-flex items-center gap-1 hover:text-cyan-300"
                    >
                      console.cognodb.com/signup <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    (Free tier, provisions in under 1 minute, no credit card required).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Create a Free (c0) Instance:</strong>
                  <div className="mt-0.5 text-slate-400">
                    Pick any region. Copy your <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">bolt+s://&lt;instance-id&gt;.databases.cognodb.cloud</code> URI and generated password.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Update backend/.env:</strong>
                  <div className="mt-1 font-mono p-2.5 bg-slate-950 rounded-lg border border-white/10 text-cyan-300 space-y-1">
                    <div>COGNODB_URI=bolt+s://&lt;your-instance-id&gt;.databases.cognodb.cloud</div>
                    <div>COGNODB_USER=cognodb</div>
                    <div>COGNODB_PASSWORD=&lt;your-generated-password&gt;</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong>Seed the Database:</strong>
                  <div className="mt-1 font-mono p-2 bg-slate-950 rounded-lg border border-white/10 text-emerald-400 flex items-center justify-between">
                    <span>npm run seed</span>
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
