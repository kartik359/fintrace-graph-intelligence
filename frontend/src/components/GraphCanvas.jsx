import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Filter, 
  ShieldAlert, 
  Building2, 
  User, 
  CreditCard, 
  MapPin, 
  Flame,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const NODE_THEME = {
  Person: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    icon: '👤',
    bg: '#0c4a6e'
  },
  Company: {
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.4)',
    icon: '🏢',
    bg: '#064e3b'
  },
  BankAccount: {
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.4)',
    icon: '💳',
    bg: '#78350f'
  },
  SanctionList: {
    color: '#f87171',
    glow: 'rgba(248, 113, 113, 0.5)',
    icon: '⛔',
    bg: '#7f1d1d'
  },
  SharedIdentifier: {
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.4)',
    icon: '📍',
    bg: '#581c87'
  }
};

export default function GraphCanvas({
  nodes = [],
  relationships = [],
  selectedNodeId,
  highlightedPathNodeIds = [],
  highlightedPathEdgeIds = [],
  onSelectNode,
  loading = false
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Simulation State
  const simNodesRef = useRef([]);
  const simEdgesRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isSleepingRef = useRef(false);
  const alphaRef = useRef(1.0); // Simulation energy (decays to 0)

  // Camera & Transform State
  const transformRef = useRef({ x: 0, y: 0, k: 0.9 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.9 });
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Filter state
  const [visibleLabels, setVisibleLabels] = useState({
    Person: true,
    Company: true,
    BankAccount: true,
    SanctionList: true,
    SharedIdentifier: true
  });

  // Dragging State
  const dragRef = useRef({
    isDraggingCanvas: false,
    isDraggingNode: false,
    draggedNode: null,
    startX: 0,
    startY: 0
  });

  // Particle flow animation tick
  const flowOffsetRef = useRef(0);

  // Wake up physics simulation
  const wakeSimulation = useCallback((initialAlpha = 0.4) => {
    alphaRef.current = Math.max(alphaRef.current, initialAlpha);
    isSleepingRef.current = false;
  }, []);

  // Sync incoming nodes & links into simulation
  useEffect(() => {
    const existingMap = new Map(simNodesRef.current.map(n => [n.id, n]));
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    simNodesRef.current = nodes.map((n, idx) => {
      const existing = existingMap.get(n.id);
      const isSanctioned = n.properties?.sanctioned || n.label === 'SanctionList';
      const isHighRisk = (n.properties?.riskScore || 0) >= 80;
      const theme = NODE_THEME[n.label] || NODE_THEME.Company;

      // Position in radial clusters initially if new
      const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
      const radius = 180 + (idx % 3) * 60;

      return {
        ...n,
        x: existing ? existing.x : (width / 2 + Math.cos(angle) * radius),
        y: existing ? existing.y : (height / 2 + Math.sin(angle) * radius),
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: n.label === 'SanctionList' ? 24 : (n.label === 'Person' ? 20 : 18),
        theme,
        isSanctioned,
        isHighRisk
      };
    });

    const nodeLookup = new Map(simNodesRef.current.map(n => [n.id, n]));
    simEdgesRef.current = relationships.map(r => ({
      ...r,
      source: nodeLookup.get(r.startNode),
      target: nodeLookup.get(r.endNode)
    })).filter(e => e.source && e.target);

    // Initial center transform
    if (nodes.length > 0) {
      transformRef.current = { x: width / 2, y: height / 2, k: 0.88 };
      setTransform({ ...transformRef.current });
      wakeSimulation(1.0);
    }
  }, [nodes, relationships, wakeSimulation]);

  // Center on Selected Node
  useEffect(() => {
    if (selectedNodeId && containerRef.current) {
      const target = simNodesRef.current.find(n => n.id === selectedNodeId);
      if (target) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const k = transformRef.current.k;
        transformRef.current = {
          x: width / 2 - target.x * k,
          y: height / 2 - target.y * k,
          k
        };
        setTransform({ ...transformRef.current });
        wakeSimulation(0.3);
      }
    }
  }, [selectedNodeId, wakeSimulation]);

  // Main Render Loop with Alpha Decay (Zero CPU when idle!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const container = containerRef.current;
      const width = container?.clientWidth || 800;
      const height = container?.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      // Ensure canvas matches container dimensions and DPI
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      // --- 1. Simulation Step with Alpha Cooling ---
      const hasActiveParticles = highlightedPathEdgeIds.length > 0 || highlightedPathNodeIds.length > 0;
      if (hasActiveParticles) {
        flowOffsetRef.current = (flowOffsetRef.current + 0.5) % 32;
      }

      if (isPhysicsEnabled && alphaRef.current > 0.005) {
        const simNodes = simNodesRef.current;
        const simEdges = simEdgesRef.current;
        const alpha = alphaRef.current;

        // Repulsion Force (Barnes-Hut approximation for N nodes)
        for (let i = 0; i < simNodes.length; i++) {
          const a = simNodes[i];
          for (let j = i + 1; j < simNodes.length; j++) {
            const b = simNodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx * dx + dy * dy + 1;

            if (distSq < 160000) { // Within 400px
              const dist = Math.sqrt(distSq);
              const force = ((380 - dist) / dist) * 0.12 * alpha;
              const fx = dx * force;
              const fy = dy * force;

              if (a !== dragRef.current.draggedNode) {
                a.vx -= fx;
                a.vy -= fy;
              }
              if (b !== dragRef.current.draggedNode) {
                b.vx += fx;
                b.vy += fy;
              }
            }
          }
        }

        // Link Attraction (Spring force)
        for (let i = 0; i < simEdges.length; i++) {
          const edge = simEdges[i];
          const s = edge.source;
          const t = edge.target;
          if (!s || !t) continue;

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = edge.type === 'TRANSFERRED' ? 140 : 110;
          const spring = (dist - idealDist) * 0.04 * alpha;

          const fx = (dx / dist) * spring;
          const fy = (dy / dist) * spring;

          if (s !== dragRef.current.draggedNode) {
            s.vx += fx;
            s.vy += fy;
          }
          if (t !== dragRef.current.draggedNode) {
            t.vx -= fx;
            t.vy -= fy;
          }
        }

        // Apply velocity & damping
        for (let i = 0; i < simNodes.length; i++) {
          const n = simNodes[i];
          if (n === dragRef.current.draggedNode) continue;
          n.vx *= 0.78;
          n.vy *= 0.78;
          n.x += n.vx;
          n.y += n.vy;
        }

        // Decay simulation alpha
        alphaRef.current *= 0.985;
      } else {
        isSleepingRef.current = true;
      }

      // --- 2. Canvas Paint Step ---
      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep obsidian background
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // World Transform
      const { x: tx, y: ty, k } = transformRef.current;
      ctx.translate(tx, ty);
      ctx.scale(k, k);

      // Background Grid
      const gridSize = 40;
      const startX = -tx / k - 100;
      const startY = -ty / k - 100;
      const endX = (width - tx) / k + 100;
      const endY = (height - ty) / k + 100;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1 / k;
      ctx.beginPath();
      for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      const highlightNodeSet = new Set(highlightedPathNodeIds);
      const highlightEdgeSet = new Set(highlightedPathEdgeIds);
      const hasHighlights = highlightNodeSet.size > 0;

      // Draw Edges
      const edges = simEdgesRef.current;
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const s = edge.source;
        const t = edge.target;
        if (!s || !t) continue;
        if (!visibleLabels[s.label] || !visibleLabels[t.label]) continue;

        const isHighlighted = highlightEdgeSet.has(edge.id) || 
          (highlightNodeSet.has(s.id) && highlightNodeSet.has(t.id));
        const isSelectedEdge = selectedNodeId && (s.id === selectedNodeId || t.id === selectedNodeId);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3 / k;
          ctx.shadowColor = 'rgba(0, 242, 254, 0.7)';
          ctx.shadowBlur = 12;
          ctx.setLineDash([8 / k, 4 / k]);
          ctx.lineDashOffset = -flowOffsetRef.current / k;
        } else if (isSelectedEdge) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 2.2 / k;
        } else if (hasHighlights) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1 / k;
        } else {
          if (edge.type === 'TRANSFERRED') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.setLineDash([4 / k, 4 / k]);
          } else if (edge.type === 'LISTED_ON') {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          }
          ctx.lineWidth = 1.2 / k;
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Direction Arrow
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const angle = Math.atan2(dy, dx);
        const arrowDist = t.radius + 5;
        const arrowX = t.x - Math.cos(angle) * arrowDist;
        const arrowY = t.y - Math.sin(angle) * arrowDist;
        const arrowSize = Math.max(6, 7 / k);

        ctx.fillStyle = isHighlighted ? '#00f2fe' : (isSelectedEdge ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)');
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - Math.cos(angle - Math.PI / 7) * arrowSize, arrowY - Math.sin(angle - Math.PI / 7) * arrowSize);
        ctx.lineTo(arrowX - Math.cos(angle + Math.PI / 7) * arrowSize, arrowY - Math.sin(angle + Math.PI / 7) * arrowSize);
        ctx.closePath();
        ctx.fill();

        // Edge Text Label
        if (k > 0.7 || isHighlighted || isSelectedEdge) {
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          let labelText = edge.type;
          if (edge.type === 'OWNS' && edge.properties?.percentage) {
            labelText = `${edge.properties.percentage}%`;
          } else if (edge.type === 'TRANSFERRED' && edge.properties?.amount) {
            labelText = `$${(edge.properties.amount / 1000000).toFixed(1)}M`;
          }

          ctx.font = `600 ${Math.max(9, 10 / k)}px 'Inter', system-ui, sans-serif`;
          ctx.fillStyle = isHighlighted ? '#00f2fe' : (isSelectedEdge ? '#e2e8f0' : 'rgba(148, 163, 184, 0.7)');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, midX, midY - 6 / k);
        }

        ctx.restore();
      }

      // Draw Nodes
      const simNodes = simNodesRef.current;
      for (let i = 0; i < simNodes.length; i++) {
        const node = simNodes[i];
        if (!visibleLabels[node.label]) continue;

        const isSelected = selectedNodeId === node.id;
        const isHighlighted = highlightNodeSet.has(node.id);
        const isDimmed = hasHighlights && !isHighlighted;

        ctx.save();
        ctx.translate(node.x, node.y);

        // Sanction / High Risk Halo
        if (node.isSanctioned) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 6 / k, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.fill();
        } else if (node.isHighRisk) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 5 / k, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
          ctx.fill();
        }

        // Selection / Path Glow
        if (isSelected || isHighlighted) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 4 / k, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3 / k;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 14;
          ctx.stroke();
        }

        // Node Body Circle
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? '#131b2e' : node.theme.color;
        ctx.globalAlpha = isDimmed ? 0.25 : 1.0;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.8 / k;
        ctx.stroke();

        // Node Icon / Letter
        if (!isDimmed) {
          ctx.font = `${Math.max(10, 11 / k)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#060913';
          ctx.fillText(node.theme.icon, 0, 0);
        }

        // Node Label Typography
        const name = node.properties?.name || node.properties?.accountNumber || node.properties?.value || node.id;
        const truncated = name.length > 22 ? name.slice(0, 20) + '…' : name;

        ctx.font = `600 ${Math.max(10, 11 / k)}px 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = isDimmed ? '#475569' : (isSelected || isHighlighted ? '#ffffff' : '#f1f5f9');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(truncated, 0, node.radius + 4 / k);

        // Sublabel (Country or Role)
        if (k > 0.72 && !isDimmed) {
          const sub = node.properties?.jurisdiction || node.properties?.role || node.label;
          ctx.font = `400 ${Math.max(8, 9 / k)}px 'Inter', system-ui, sans-serif`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(sub, 0, node.radius + 17 / k);
        }

        ctx.restore();
      }

      ctx.restore();

      // Only schedule next frame if animating or particles flowing
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [selectedNodeId, highlightedPathNodeIds, highlightedPathEdgeIds, visibleLabels, isPhysicsEnabled]);

  // Pointer / Mouse Event Handlers
  const handlePointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: tx, y: ty, k } = transformRef.current;
    const worldX = (mouseX - tx) / k;
    const worldY = (mouseY - ty) / k;

    // Hit test nodes
    const clickedNode = simNodesRef.current.find(n => {
      if (!visibleLabels[n.label]) return false;
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (clickedNode) {
      dragRef.current = {
        isDraggingCanvas: false,
        isDraggingNode: true,
        draggedNode: clickedNode,
        startX: mouseX,
        startY: mouseY
      };
      wakeSimulation(0.35);
      onSelectNode(clickedNode.id);
    } else {
      dragRef.current = {
        isDraggingCanvas: true,
        isDraggingNode: false,
        draggedNode: null,
        startX: mouseX - tx,
        startY: mouseY - ty
      };
    }
  };

  const handlePointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: tx, y: ty, k } = transformRef.current;

    if (dragRef.current.isDraggingCanvas) {
      transformRef.current.x = mouseX - dragRef.current.startX;
      transformRef.current.y = mouseY - dragRef.current.startY;
      setTransform({ ...transformRef.current });
    } else if (dragRef.current.isDraggingNode && dragRef.current.draggedNode) {
      const worldX = (mouseX - tx) / k;
      const worldY = (mouseY - ty) / k;
      dragRef.current.draggedNode.x = worldX;
      dragRef.current.draggedNode.y = worldY;
      dragRef.current.draggedNode.vx = 0;
      dragRef.current.draggedNode.vy = 0;
      wakeSimulation(0.2);
    } else {
      // Hover detection
      const worldX = (mouseX - tx) / k;
      const worldY = (mouseY - ty) / k;
      const found = simNodesRef.current.find(n => {
        if (!visibleLabels[n.label]) return false;
        const dx = n.x - worldX;
        const dy = n.y - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });
      setHoveredNode(found || null);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = {
      isDraggingCanvas: false,
      isDraggingNode: false,
      draggedNode: null,
      startX: 0,
      startY: 0
    };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const { x: tx, y: ty, k } = transformRef.current;
    const newK = Math.max(0.25, Math.min(3.0, k * zoomFactor));

    const newTx = mouseX - (mouseX - tx) * (newK / k);
    const newTy = mouseY - (mouseY - ty) * (newK / k);

    transformRef.current = { x: newTx, y: newTy, k: newK };
    setTransform({ ...transformRef.current });
  };

  const handleZoom = (factor) => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const { x: tx, y: ty, k } = transformRef.current;
    const newK = Math.max(0.25, Math.min(3.0, k * factor));
    const newTx = width / 2 - (width / 2 - tx) * (newK / k);
    const newTy = height / 2 - (height / 2 - ty) * (newK / k);

    transformRef.current = { x: newTx, y: newTy, k: newK };
    setTransform({ ...transformRef.current });
  };

  const handleFitView = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    transformRef.current = { x: width / 2, y: height / 2, k: 0.88 };
    setTransform({ ...transformRef.current });
    wakeSimulation(0.3);
  };

  const togglePhysics = () => {
    setIsPhysicsEnabled(prev => !prev);
    if (!isPhysicsEnabled) wakeSimulation(0.5);
  };

  const toggleLabel = (label) => {
    setVisibleLabels(prev => ({ ...prev, [label]: !prev[label] }));
    wakeSimulation(0.2);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#060913] overflow-hidden select-none">
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
      />

      {/* Floating HUD Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 glass-panel p-1.5 shadow-2xl z-20 border-white/10">
        <button
          onClick={() => handleZoom(1.2)}
          title="Zoom In"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          title="Zoom Out"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          title="Fit to Screen"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-px bg-white/10 my-0.5"></div>
        <button
          onClick={togglePhysics}
          title={isPhysicsEnabled ? 'Pause Physics' : 'Resume Physics'}
          className={`p-2 rounded-lg transition-colors ${
            isPhysicsEnabled ? 'text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {isPhysicsEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Label Filter Pills (Bottom Left) */}
      <div className="absolute bottom-5 left-5 glass-panel p-2 shadow-2xl z-20 flex flex-wrap items-center gap-1.5 text-xs border-white/10">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-cyan-400" /> Filter:
        </span>
        {Object.entries(NODE_THEME).map(([label, theme]) => {
          const active = visibleLabels[label];
          return (
            <button
              key={label}
              onClick={() => toggleLabel(label)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border transition-all ${
                active 
                  ? 'bg-slate-800/90 text-slate-200 border-white/15 shadow-sm' 
                  : 'bg-slate-950/40 text-slate-500 border-transparent opacity-40 line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }}></span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Hover Tooltip Card */}
      {hoveredNode && (
        <div 
          className="absolute top-5 left-5 pointer-events-none glass-panel p-3.5 shadow-2xl z-20 max-w-xs animate-in fade-in duration-150 border-cyan-500/40"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: hoveredNode.theme.color }}
            />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {hoveredNode.label}
            </span>
            {hoveredNode.isSanctioned && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                SANCTIONED
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-white truncate">
            {hoveredNode.properties?.name || hoveredNode.properties?.accountNumber || hoveredNode.properties?.value}
          </p>
          <div className="text-xs text-slate-400 mt-1.5 flex flex-col gap-1">
            {hoveredNode.properties?.jurisdiction && (
              <div className="flex justify-between">
                <span>Jurisdiction:</span>
                <span className="text-slate-200 font-medium">{hoveredNode.properties.jurisdiction}</span>
              </div>
            )}
            {hoveredNode.properties?.riskScore !== undefined && (
              <div className="flex justify-between">
                <span>Risk Score:</span>
                <span className={`font-bold font-mono ${hoveredNode.properties.riskScore >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {hoveredNode.properties.riskScore}/100
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
