import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  RefreshCw, 
  ShieldAlert, 
  Users, 
  Terminal, 
  Flame, 
  ArrowRight, 
  Play, 
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { 
  fetchUBO, 
  fetchCircularTransfers, 
  fetchSanctions, 
  fetchNomineeClusters, 
  runCypher 
} from '../utils/api';

const CYPHER_PRESETS = [
  {
    name: '1. Multi-Hop UBO Traversal (6 Hops)',
    query: `MATCH path = (ubo:Person)-[rels:OWNS*1..6]->(target:Company {id: 'comp-kensington-sovereign'})
WITH ubo, target, path, rels,
     reduce(acc = 1.0, r IN rels | acc * (toFloat(coalesce(r.percentage, 100.0)) / 100.0)) * 100.0 AS effectivePct
RETURN ubo.name AS UltimateOwner, target.name AS TargetCompany, effectivePct AS EffectiveOwnership, length(path) AS Hops
ORDER BY effectivePct DESC`
  },
  {
    name: '2. Circular Wash-Trading Cycle (3..6 Hops)',
    query: `MATCH path = (origin:BankAccount)-[txs:TRANSFERRED*3..6]->(origin)
WITH origin, path, txs,
     reduce(total = 0.0, tx IN txs | total + toFloat(coalesce(tx.amount, 0.0))) AS totalVolume
RETURN origin.bankName AS OriginBank, origin.accountNumber AS Account, length(path) AS LoopHops, totalVolume AS LaunderingVolume
LIMIT 5`
  },
  {
    name: '3. Shortest Path to Sanctioned Entities',
    query: `MATCH (target:Company {id: 'comp-kensington-sovereign'}), (sanction:SanctionList)
MATCH p = shortestPath((target)-[*1..6]-(sanction))
RETURN [n IN nodes(p) | coalesce(n.name, n.id)] AS ChainNodes, length(p) AS Distance`
  },
  {
    name: '4. Nominee Mailbox Aggregation',
    query: `MATCH (id:SharedIdentifier)<-[:ASSOCIATED_WITH]-(comp:Company)
WITH id, collect(comp.name) AS ShellCompanies, count(comp) AS ShellCount
WHERE ShellCount >= 2
RETURN id.value AS SharedAddress, ShellCount, ShellCompanies
ORDER BY ShellCount DESC`
  }
];

export default function InvestigationPanel({
  companies = [],
  allNodes = [],
  onHighlightPath,
  onClearHighlight,
  onSelectNode
}) {
  const [activeTab, setActiveTab] = useState('ubo');
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  // Tab 1: UBO State
  const [selectedTargetCompany, setSelectedTargetCompany] = useState('comp-kensington-sovereign');
  const [uboResults, setUboResults] = useState(null);

  // Tab 2: Circular Transfers State
  const [circularResults, setCircularResults] = useState(null);

  // Tab 3: Sanctions State
  const [sanctionStartEntity, setSanctionStartEntity] = useState('comp-kensington-sovereign');
  const [sanctionResults, setSanctionResults] = useState(null);

  // Tab 4: Nominee Clusters State
  const [nomineeClusters, setNomineeClusters] = useState(null);

  // Tab 5: Cypher Console State
  const [customCypher, setCustomCypher] = useState(CYPHER_PRESETS[0].query);
  const [cypherOutput, setCypherOutput] = useState(null);

  // Load default UBO on mount
  useEffect(() => {
    runUBOAnalysis('comp-kensington-sovereign');
  }, []);

  const runUBOAnalysis = async (companyId) => {
    const id = companyId || selectedTargetCompany;
    setLoading(true);
    try {
      const data = await fetchUBO(id);
      setUboResults(data);
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        const nodeIds = top.chain.map(n => n.id);
        const edgeIds = top.relationships.map(r => r.id);
        onHighlightPath(nodeIds, edgeIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runCircularScan = async () => {
    setLoading(true);
    try {
      const data = await fetchCircularTransfers();
      setCircularResults(data);
      if (data.loops && data.loops.length > 0) {
        const top = data.loops[0];
        const nodeIds = top.involvedAccounts.map(n => n.id);
        const edgeIds = top.transactions.map(r => r.id);
        onHighlightPath(nodeIds, edgeIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSanctionCheck = async (entityId) => {
    const id = entityId || sanctionStartEntity;
    setLoading(true);
    try {
      const data = await fetchSanctions(id);
      setSanctionResults(data);
      if (data.paths && data.paths.length > 0) {
        const top = data.paths[0];
        const nodeIds = top.nodes.map(n => n.id);
        const edgeIds = top.relationships.map(r => r.id);
        onHighlightPath(nodeIds, edgeIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNomineeClusters = async () => {
    setLoading(true);
    try {
      const data = await fetchNomineeClusters(2);
      setNomineeClusters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeCypherQuery = async () => {
    setLoading(true);
    try {
      const res = await runCypher(customCypher);
      setCypherOutput(res);
    } catch (err) {
      setCypherOutput({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`border-t border-white/10 bg-slate-950/95 backdrop-blur-xl flex flex-col z-20 shrink-0 transition-all duration-300 ${
      isExpanded ? 'h-64 sm:h-72' : 'h-11'
    }`}>
      {/* Tab Navigation & Dock Header */}
      <div className="h-11 flex items-center justify-between border-b border-white/10 px-3 bg-slate-900/80 select-none">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('ubo'); setIsExpanded(true); runUBOAnalysis(selectedTargetCompany); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'ubo' && isExpanded
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            1. UBO Traversal (1..6)
          </button>

          <button
            onClick={() => { setActiveTab('circular'); setIsExpanded(true); runCircularScan(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'circular' && isExpanded
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            2. Circular Wash Loops
          </button>

          <button
            onClick={() => { setActiveTab('sanctions'); setIsExpanded(true); runSanctionCheck(sanctionStartEntity); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'sanctions' && isExpanded
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            3. Sanction Proximity
          </button>

          <button
            onClick={() => { setActiveTab('nominees'); setIsExpanded(true); loadNomineeClusters(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'nominees' && isExpanded
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            4. Nominee Farm
          </button>

          <button
            onClick={() => { setActiveTab('console'); setIsExpanded(true); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'console' && isExpanded
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            5. openCypher Console
          </button>
        </div>

        {/* Right Controls: Clear Highlight & Minimize/Expand */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearHighlight}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-white/5"
            title="Reset active path highlights"
          >
            Clear Highlights
          </button>
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? 'Minimize Dock (Full Screen Graph)' : 'Expand Investigation Dock'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tab Body (Shown when expanded) */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3.5">
          {/* TAB 1: UBO Multi-Hop */}
          {activeTab === 'ubo' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-full">
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Target Commercial Entity:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTargetCompany}
                    onChange={(e) => {
                      setSelectedTargetCompany(e.target.value);
                      runUBOAnalysis(e.target.value);
                    }}
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-xs bg-slate-900 border border-white/10 text-white"
                  >
                    <option value="comp-kensington-sovereign">Kensington Sovereign Properties Ltd (UK Asset)</option>
                    <option value="comp-albion-prime">Albion Prime Real Estate Ltd (UK Operating)</option>
                    <option value="comp-aethelgard-cap">Aethelgard Capital Management Ltd (Jersey)</option>
                    <option value="comp-beacon-uk">Beacon UK Diagnostics Ltd (Clean Enterprise)</option>
                  </select>
                  <button
                    onClick={() => runUBOAnalysis(selectedTargetCompany)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" /> Run
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/5 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-200 block mb-0.5">💡 Graph Traversal:</span>
                  Evaluates 6 levels of ownership <code className="text-cyan-300">{"(:Person)-[:OWNS*1..6]->(:Company)"}</code> multiplying equity across branches in milliseconds.
                </div>
              </div>

              {/* Results Table & Chain */}
              <div className="lg:col-span-2 glass-panel p-3 overflow-y-auto max-h-48">
                {uboResults?.results?.length > 0 ? (
                  <div className="space-y-3">
                    {uboResults.results.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span className="font-bold text-sm text-white">{item.ubo?.properties?.name}</span>
                            <span className="badge-critical text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {item.ubo?.properties?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">Depth: <strong className="text-white">{item.hopCount} Hops</strong></span>
                            <span className="text-sm font-bold font-mono text-cyan-400">
                              Effective Equity: {item.effectiveOwnershipPct}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Path Chips */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {item.chainNames.map((name, i) => (
                            <React.Fragment key={i}>
                              <span 
                                onClick={() => item.chain[i] && onSelectNode(item.chain[i].id)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs text-slate-200 font-medium cursor-pointer transition-colors"
                              >
                                {name}
                              </span>
                              {i < item.chainNames.length - 1 && (
                                <span className="text-[10px] font-mono text-cyan-400 font-bold px-0.5">
                                  —({item.stepPercentages[i]}%)→
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    {loading ? 'Executing recursive graph traversal on CognoDB...' : 'No beneficial ownership chains found for this entity.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Circular Wash Trading */}
          {activeTab === 'circular' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Circular Fund Flow (Wash-Trading) Detector
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Detects closed transaction loops <code className="text-amber-300">{"(a:BankAccount)-[:TRANSFERRED*3..6]->(a)"}</code> where funds return to origin accounts.
                </p>
                <button
                  onClick={runCircularScan}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Scan All SWIFT Accounts
                </button>
              </div>

              <div className="lg:col-span-2 glass-panel p-3 overflow-y-auto max-h-48">
                {circularResults?.loops?.length > 0 ? (
                  <div className="space-y-2.5">
                    {circularResults.loops.map((loop, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                            <span className="font-bold text-amber-200">
                              Closed Loop: {loop.loopLength} Transfers
                            </span>
                          </div>
                          <span className="font-mono font-bold text-amber-300">
                            Total Volume: ${(loop.totalVolume / 1000000).toFixed(2)}M USD
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                          {loop.transactions.map((tx, tIdx) => (
                            <div key={tIdx} className="bg-slate-900/90 p-1.5 rounded border border-white/5">
                              <div className="font-semibold text-slate-300">Hop {tIdx + 1}</div>
                              <div className="text-amber-400 font-mono font-bold">${(tx.properties.amount / 1000000).toFixed(2)}M</div>
                              <div className="text-slate-500 text-[10px] truncate">{tx.properties.invoiceRef}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    {loading ? 'Traversing graph cycles...' : 'Click Scan to detect circular fund routing.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Sanctions */}
          {activeTab === 'sanctions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Subject Entity to Check for Sanction Proximity:
                </label>
                <select
                  value={sanctionStartEntity}
                  onChange={(e) => {
                    setSanctionStartEntity(e.target.value);
                    runSanctionCheck(e.target.value);
                  }}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-slate-900 border border-white/10 text-white"
                >
                  <option value="comp-kensington-sovereign">Kensington Sovereign Properties Ltd</option>
                  <option value="comp-albion-prime">Albion Prime Real Estate Ltd</option>
                  <option value="comp-silverline-raw">SilverLine Raw Materials Corp (BVI)</option>
                  <option value="comp-beacon-health-us">Beacon Health Technologies Inc (Clean Benchmark)</option>
                </select>
                <button
                  onClick={() => runSanctionCheck(sanctionStartEntity)}
                  className="w-full px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Execute Shortest Path
                </button>
              </div>

              <div className="lg:col-span-2 glass-panel p-3 overflow-y-auto max-h-48">
                {sanctionResults?.paths?.length > 0 ? (
                  <div className="space-y-2.5">
                    {sanctionResults.paths.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-red-300">
                            Shortest Path: {p.distance} Degrees of Separation to Watchlist
                          </span>
                          <span className="badge-critical text-[10px] px-2 py-0.5 rounded-full font-bold">
                            SANCTION EXPOSURE
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          {p.nodes.map((node, nIdx) => (
                            <React.Fragment key={nIdx}>
                              <span 
                                onClick={() => onSelectNode(node.id)}
                                className={`px-2 py-0.5 rounded font-medium cursor-pointer border ${
                                  node.label === 'SanctionList' 
                                    ? 'bg-red-900 text-red-100 border-red-500 font-bold' 
                                    : 'bg-slate-800 text-slate-200 border-white/10'
                                }`}
                              >
                                {node.properties?.name || node.id}
                              </span>
                              {nIdx < p.nodes.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-red-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    {loading ? 'Searching graph for shortest path to watchlists...' : 'No direct or indirect connections to sanctions found.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Nominees */}
          {activeTab === 'nominees' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Shared Nominee Directors & Shell Registration Mailboxes (Threshold &ge; 2)
                </span>
                <button
                  onClick={loadNomineeClusters}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Clusters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                {nomineeClusters?.clusters?.map((cluster, idx) => (
                  <div key={idx} className="glass-panel p-2.5 border-purple-800/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-300 truncate max-w-[240px]">
                        {cluster.hub?.properties?.name || cluster.hub?.properties?.value}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold shrink-0">
                        {cluster.companyCount} Shells
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cluster.companies.map((comp, cIdx) => (
                        <span 
                          key={cIdx} 
                          onClick={() => onSelectNode(comp.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer border border-white/5"
                        >
                          {comp.properties?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Cypher Console */}
          {activeTab === 'console' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Query Presets:</span>
                </div>
                <select
                  onChange={(e) => {
                    const preset = CYPHER_PRESETS.find(p => p.name === e.target.value);
                    if (preset) setCustomCypher(preset.query);
                  }}
                  className="w-full rounded-lg px-2 py-1 text-xs bg-slate-900 border border-white/10 text-slate-200"
                >
                  {CYPHER_PRESETS.map((p, i) => (
                    <option key={i} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <textarea
                  value={customCypher}
                  onChange={(e) => setCustomCypher(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg p-2 font-mono text-xs bg-slate-950 border border-cyan-800/40 text-cyan-300 focus:border-cyan-400"
                />
                <button
                  onClick={executeCypherQuery}
                  className="w-full px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Execute openCypher Query
                </button>
              </div>

              <div className="lg:col-span-2 glass-panel p-2.5 overflow-y-auto max-h-48 font-mono text-xs">
                {cypherOutput ? (
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5 text-[11px] text-slate-400">
                      <span>Status: <strong className={cypherOutput.success ? 'text-emerald-400' : 'text-red-400'}>{cypherOutput.success ? 'Success' : 'Error'}</strong></span>
                      {cypherOutput.durationMs !== undefined && (
                        <span>Latency: <strong className="text-cyan-400">{cypherOutput.durationMs}ms</strong></span>
                      )}
                      {cypherOutput.rowCount !== undefined && (
                        <span>Rows: <strong className="text-white">{cypherOutput.rowCount}</strong></span>
                      )}
                    </div>
                    {cypherOutput.error ? (
                      <div className="text-red-400 p-2 bg-red-950/40 rounded border border-red-800/40">
                        {cypherOutput.error}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] divide-y divide-white/10">
                          <thead>
                            <tr>
                              {cypherOutput.columns?.map(col => (
                                <th key={col} className="px-2 py-1 text-slate-400 font-semibold">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {cypherOutput.rows?.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/5">
                                {cypherOutput.columns?.map(col => (
                                  <td key={col} className="px-2 py-1">
                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Select a query preset or type custom Cypher above and click Execute.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
