import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import EntityInspector from './components/EntityInspector';
import InvestigationPanel from './components/InvestigationPanel';
import ConnectionModal from './components/ConnectionModal';
import { 
  fetchHealth, 
  fetchStats, 
  fetchGraph, 
  searchNodes, 
  fetchNeighborhood, 
  fetchUBO, 
  fetchSanctions 
} from './utils/api';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState({ connected: false, mode: 'offline_fallback' });
  const [stats, setStats] = useState(null);
  
  // Graph State
  const [nodes, setNodes] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [highlightedPathNodeIds, setHighlightedPathNodeIds] = useState([]);
  const [highlightedPathEdgeIds, setHighlightedPathEdgeIds] = useState([]);
  const [activeScenario, setActiveScenario] = useState('all');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals & UI
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [healthData, statsData, graphData] = await Promise.all([
        fetchHealth(),
        fetchStats(),
        fetchGraph(250)
      ]);

      setConnection(healthData);
      setStats(statsData);
      setNodes(graphData.nodes || []);
      setRelationships(graphData.relationships || []);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scenario Switcher
  const handleSelectScenario = async (scenario) => {
    setActiveScenario(scenario);
    setHighlightedPathNodeIds([]);
    setHighlightedPathEdgeIds([]);
    setSelectedNodeId(null);

    if (scenario === 'all') {
      const data = await fetchGraph(250);
      setNodes(data.nodes || []);
      setRelationships(data.relationships || []);
    } else if (scenario === 'pyramid') {
      const uboData = await fetchUBO('comp-kensington-sovereign');
      if (uboData.results && uboData.results.length > 0) {
        const chain = uboData.results[0];
        setHighlightedPathNodeIds(chain.chain.map(n => n.id));
        setHighlightedPathEdgeIds(chain.relationships.map(r => r.id));
        setSelectedNodeId('comp-kensington-sovereign');
      }
    } else if (scenario === 'circular') {
      const circularNodeIds = ['acct-apex-zurich', 'acct-meridian-dubai', 'acct-bluewave-sg', 'acct-silverline-bvi'];
      setHighlightedPathNodeIds(circularNodeIds);
      setSelectedNodeId('acct-apex-zurich');
    } else if (scenario === 'nominee') {
      const nomineeNodeIds = [
        'person-elena-rostova', 
        'ident-mailbox-tortola', 
        'comp-boreas-trading', 
        'comp-zephyr-capital', 
        'comp-nordic-silk', 
        'comp-pinnacle-crest', 
        'comp-silverline-raw'
      ];
      setHighlightedPathNodeIds(nomineeNodeIds);
      setSelectedNodeId('person-elena-rostova');
    }
  };

  // Handle Search
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 1) {
      setIsSearching(true);
      try {
        const res = await searchNodes(q);
        setSearchResults(res.results || []);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (node) => {
    setSelectedNodeId(node.id);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Highlights
  const handleHighlightPath = (nodeIds, edgeIds) => {
    setHighlightedPathNodeIds(nodeIds);
    setHighlightedPathEdgeIds(edgeIds);
  };

  const handleClearHighlight = () => {
    setHighlightedPathNodeIds([]);
    setHighlightedPathEdgeIds([]);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const companyNodes = nodes.filter(n => n.label === 'Company');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        connection={connection}
        stats={stats}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onResetLayout={loadInitialData}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        loading={loading}
      />

      {/* Main Workspace (Graph Canvas + Search overlay + Side Inspector) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Search & Quick Filter Overlay (Top Left of Canvas) */}
        <div className="absolute top-4 left-4 z-20 w-80">
          <div className="glass-panel p-1.5 flex items-center gap-2 shadow-2xl border-white/15">
            <Search className="w-4 h-4 text-cyan-400 ml-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search companies, oligarchs, accounts..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none w-full text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-0 p-1"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="glass-panel mt-1.5 p-1.5 max-h-60 overflow-y-auto space-y-1 shadow-2xl z-30 border-cyan-500/30">
              {searchResults.map(node => (
                <div
                  key={node.id}
                  onClick={() => handleSelectSearchResult(node)}
                  className="p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="truncate">
                    <div className="font-semibold text-white truncate">
                      {node.properties?.name || node.properties?.accountNumber || node.properties?.value || node.id}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {node.label} • {node.properties?.jurisdiction || node.properties?.role || 'Node'}
                    </div>
                  </div>
                  {node.properties?.sanctioned && (
                    <span className="badge-critical text-[9px] px-1.5 py-0.5 rounded font-bold">
                      OFAC
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 h-full relative">
          <GraphCanvas
            nodes={nodes}
            relationships={relationships}
            selectedNodeId={selectedNodeId}
            highlightedPathNodeIds={highlightedPathNodeIds}
            highlightedPathEdgeIds={highlightedPathEdgeIds}
            onSelectNode={setSelectedNodeId}
            loading={loading}
          />
        </div>

        {/* Entity Inspector Side Drawer */}
        {selectedNode && (
          <EntityInspector
            selectedNode={selectedNode}
            relationships={relationships}
            onClose={() => setSelectedNodeId(null)}
            onRunUBO={(companyId) => {
              setActiveScenario('pyramid');
              handleSelectScenario('pyramid');
            }}
            onRunSanctions={async (entityId) => {
              const res = await fetchSanctions(entityId);
              if (res.paths && res.paths.length > 0) {
                handleHighlightPath(res.paths[0].nodes.map(n => n.id), res.paths[0].relationships.map(r => r.id));
              }
            }}
            onSelectNode={setSelectedNodeId}
          />
        )}
      </div>

      {/* Forensic Investigation Panel (Bottom Dock) */}
      <InvestigationPanel
        companies={companyNodes}
        allNodes={nodes}
        onHighlightPath={handleHighlightPath}
        onClearHighlight={handleClearHighlight}
        onSelectNode={setSelectedNodeId}
      />

      {/* CognoDB Connection & Instructions Modal */}
      <ConnectionModal
        connection={connection}
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}
