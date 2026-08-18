import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Eye, 
  Filter,
  Shield,
  Building,
  User,
  CreditCard,
  MapPin,
  Flame
} from 'lucide-react';

const NODE_COLORS = {
  Person: '#38bdf8',          // Sky blue
  Company: '#10b981',         // Emerald
  BankAccount: '#f59e0b',     // Amber
  SanctionList: '#ef4444',    // Crimson Red
  SharedIdentifier: '#a855f7' // Purple
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

  // Graph Simulation State
  const simNodesRef = useRef([]);
  const simEdgesRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isRunningRef = useRef(true);

  // Transform / Camera State
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
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

  // Initialize or update nodes and links
  useEffect(() => {
    const existingMap = new Map(simNodesRef.current.map(n => [n.id, n]));
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    simNodesRef.current = nodes.map(n => {
      const existing = existingMap.get(n.id);
      const isSanctioned = n.properties?.sanctioned || n.label === 'SanctionList';
      const isHighRisk = (n.properties?.riskScore || 0) >= 80;

      return {
        ...n,
        x: existing ? existing.x : (width / 2 + (Math.random() - 0.5) * 400),
        y: existing ? existing.y : (height / 2 + (Math.random() - 0.5) * 400),
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: n.label === 'SanctionList' ? 26 : (n.label === 'Person' ? 22 : 20),
        color: NODE_COLORS[n.label] || '#94a3b8',
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

  }, [nodes, relationships]);

  // Centering on first load
  useEffect(() => {
    if (nodes.length > 0 && containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      transformRef.current = { x: width / 2, y: height / 2, k: 0.9 };
      setTransform({ ...transformRef.current });
    }
  }, [nodes.length]);

  // Main Physics Simulation & Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let running = true;

    const render = () => {
      if (!running) return;

      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // 1. Physics Step (if active)
      if (isRunningRef.current) {
        const simNodes = simNodesRef.current;
        const simEdges = simEdgesRef.current;

        // Repulsion (Coulomb force)
        for (let i = 0; i < simNodes.length; i++) {
          for (let j = i + 1; j < simNodes.length; j++) {
            const a = simNodes[i];
            const b = simNodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);

            if (dist < 320) {
              const force = (320 - dist) / (distSq * 0.5 + 10);
              const fx = (dx / dist) * force * 15;
              const fy = (dy / dist) * force * 15;

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

        // Spring Attraction (Hooke's Law for edges)
        for (const edge of simEdges) {
          const s = edge.source;
          const t = edge.target;
          if (!s || !t) continue;

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = edge.type === 'TRANSFERRED' ? 140 : 110;
          const force = (dist - targetDist) * 0.035;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

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
        for (const n of simNodes) {
          if (n === dragRef.current.draggedNode) continue;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // 2. Render Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid
      ctx.save();
      const { x: tx, y: ty, k } = transformRef.current;
      ctx.translate(tx, ty);
      ctx.scale(k, k);

      const hasHighlightedPath = highlightedPathNodeIds.length > 0;
      const highlightNodeSet = new Set(highlightedPathNodeIds);
      const highlightEdgeSet = new Set(highlightedPathEdgeIds);

      // Draw Edges
      for (const edge of simEdgesRef.current) {
        const s = edge.source;
        const t = edge.target;
        if (!s || !t) continue;
        if (!visibleLabels[s.label] || !visibleLabels[t.label]) continue;

        const isEdgeHighlighted = highlightEdgeSet.has(edge.id) || 
          (highlightNodeSet.has(s.id) && highlightNodeSet.has(t.id));
        const isConnectedToSelected = selectedNodeId && (s.id === selectedNodeId || t.id === selectedNodeId);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isEdgeHighlighted) {
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3.5 / k;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 10;
        } else if (isConnectedToSelected) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
          ctx.lineWidth = 2.5 / k;
        } else if (hasHighlightedPath) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1 / k;
        } else {
          if (edge.type === 'TRANSFERRED') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.setLineDash([4 / k, 4 / k]);
          } else if (edge.type === 'LISTED_ON') {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          }
          ctx.lineWidth = 1.5 / k;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Directional Arrow
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const angle = Math.atan2(dy, dx);
        const arrowDist = t.radius + 6;
        const arrowX = t.x - Math.cos(angle) * arrowDist;
        const arrowY = t.y - Math.sin(angle) * arrowDist;

        ctx.fillStyle = isEdgeHighlighted ? '#00f2fe' : (isConnectedToSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)');
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - Math.cos(angle - Math.PI / 7) * (8 / k), arrowY - Math.sin(angle - Math.PI / 7) * (8 / k));
        ctx.lineTo(arrowX - Math.cos(angle + Math.PI / 7) * (8 / k), arrowY - Math.sin(angle + Math.PI / 7) * (8 / k));
        ctx.closePath();
        ctx.fill();

        // Edge Label (if zoomed in or highlighted)
        if (k > 0.75 || isEdgeHighlighted || isConnectedToSelected) {
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          let labelText = edge.type;
          if (edge.type === 'OWNS' && edge.properties?.percentage) {
            labelText = `${edge.properties.percentage}%`;
          } else if (edge.type === 'TRANSFERRED' && edge.properties?.amount) {
            labelText = `$${(edge.properties.amount / 1000000).toFixed(2)}M`;
          }

          ctx.font = `600 ${Math.max(9, 10 / k)}px 'Inter', sans-serif`;
          ctx.fillStyle = isEdgeHighlighted ? '#00f2fe' : (isConnectedToSelected ? '#e2e8f0' : '#64748b');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, midX, midY - 6 / k);
        }

        ctx.restore();
      }

      // Draw Nodes
      for (const node of simNodesRef.current) {
        if (!visibleLabels[node.label]) continue;

        const isSelected = selectedNodeId === node.id;
        const isHighlighted = highlightNodeSet.has(node.id);
        const isHovered = hoveredNode?.id === node.id;
        const isDimmed = hasHighlightedPath && !isHighlighted;

        ctx.save();
        ctx.translate(node.x, node.y);

        // Sanction / High Risk Halo Pulse
        if (node.isSanctioned) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 8 / k, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();
        } else if (node.isHighRisk) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 6 / k, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fill();
        }

        // Selection / Highlight Glow
        if (isSelected || isHighlighted) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 5 / k, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3.5 / k;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 16;
          ctx.stroke();
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? '#1e293b' : node.color;
        ctx.globalAlpha = isDimmed ? 0.25 : 1.0;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2 / k;
        ctx.stroke();

        // Node Name Label
        const displayName = node.properties?.name || node.properties?.accountNumber || node.properties?.value || node.id;
        const truncated = displayName.length > 20 ? displayName.slice(0, 18) + '…' : displayName;

        ctx.font = `600 ${Math.max(10, 11 / k)}px 'Inter', sans-serif`;
        ctx.fillStyle = isDimmed ? '#475569' : (isSelected || isHighlighted ? '#ffffff' : '#e2e8f0');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(truncated, 0, node.radius + 5 / k);

        // Sublabel (Role / Country)
        if (k > 0.7 && !isDimmed) {
          const sub = node.properties?.jurisdiction || node.properties?.role || node.label;
          ctx.font = `400 ${Math.max(8, 9 / k)}px 'Inter', sans-serif`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(sub, 0, node.radius + 18 / k);
        }

        ctx.restore();
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [selectedNodeId, highlightedPathNodeIds, highlightedPathEdgeIds, visibleLabels, hoveredNode]);

  // Mouse / Pan / Drag Handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: tx, y: ty, k } = transformRef.current;
    const worldX = (mouseX - tx) / k;
    const worldY = (mouseY - ty) / k;

    // Check if a node was clicked
    const clickedNode = simNodesRef.current.find(n => {
      if (!visibleLabels[n.label]) return false;
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (clickedNode) {
      dragRef.current = {
        isDraggingCanvas: false,
        isDraggingNode: true,
        draggedNode: clickedNode,
        startX: mouseX,
        startY: mouseY
      };
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

  const handleMouseMove = (e) => {
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
    } else {
      // Hover detection
      const worldX = (mouseX - tx) / k;
      const worldY = (mouseY - ty) / k;
      const found = simNodesRef.current.find(n => {
        if (!visibleLabels[n.label]) return false;
        const dx = n.x - worldX;
        const dy = n.y - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
      });
      setHoveredNode(found || null);
    }
  };

  const handleMouseUp = () => {
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

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const { x: tx, y: ty, k } = transformRef.current;
    const newK = Math.max(0.2, Math.min(3.5, k * zoomFactor));

    const newTx = mouseX - (mouseX - tx) * (newK / k);
    const newTy = mouseY - (mouseY - ty) * (newK / k);

    transformRef.current = { x: newTx, y: newTy, k: newK };
    setTransform({ ...transformRef.current });
  };

  const handleZoom = (delta) => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const { x: tx, y: ty, k } = transformRef.current;
    const newK = Math.max(0.2, Math.min(3.5, k * delta));
    const newTx = width / 2 - (width / 2 - tx) * (newK / k);
    const newTy = height / 2 - (height / 2 - ty) * (newK / k);

    transformRef.current = { x: newTx, y: newTy, k: newK };
    setTransform({ ...transformRef.current });
  };

  const handleFitView = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    transformRef.current = { x: width / 2, y: height / 2, k: 0.85 };
    setTransform({ ...transformRef.current });
  };

  const togglePhysics = () => {
    isRunningRef.current = !isRunningRef.current;
    setIsPhysicsActive(isRunningRef.current);
  };

  const toggleLabelFilter = (label) => {
    setVisibleLabels(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#070b14] overflow-hidden select-none">
      {/* Background Graphic Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          backgroundPosition: `${transform.x}px ${transform.y}px`
        }}
      />

      {/* Main Graph Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 glass-panel p-1.5 shadow-2xl z-20">
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
          title="Fit Graph to Screen"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-px bg-white/10 my-0.5"></div>
        <button
          onClick={togglePhysics}
          title={isPhysicsActive ? 'Freeze Physics Simulation' : 'Resume Physics Simulation'}
          className={`p-2 rounded-lg transition-colors ${
            isPhysicsActive ? 'text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {isPhysicsActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Legend & Filter Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 glass-panel p-2.5 shadow-2xl z-20 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Labels:
        </span>
        {Object.entries(NODE_COLORS).map(([label, color]) => {
          const active = visibleLabels[label];
          return (
            <button
              key={label}
              onClick={() => toggleLabelFilter(label)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border transition-all ${
                active 
                  ? 'bg-slate-800/90 text-slate-200 border-white/20' 
                  : 'bg-slate-900/40 text-slate-500 border-transparent opacity-50 line-through'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Node Hover Tooltip Card */}
      {hoveredNode && (
        <div 
          className="absolute top-4 left-4 pointer-events-none glass-panel p-3 shadow-2xl z-20 max-w-xs animate-in fade-in duration-150 border-cyan-500/30"
        >
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: hoveredNode.color }}
            />
            <span className="text-xs font-semibold text-slate-300 uppercase">
              {hoveredNode.label}
            </span>
            {hoveredNode.isSanctioned && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                SANCTIONED
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-white truncate">
            {hoveredNode.properties?.name || hoveredNode.properties?.accountNumber || hoveredNode.properties?.value}
          </p>
          <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
            {hoveredNode.properties?.jurisdiction && (
              <div>Jurisdiction: <span className="text-slate-200 font-medium">{hoveredNode.properties.jurisdiction}</span></div>
            )}
            {hoveredNode.properties?.riskScore !== undefined && (
              <div>Risk Score: <span className={`font-bold ${hoveredNode.properties.riskScore >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>{hoveredNode.properties.riskScore}/100</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
