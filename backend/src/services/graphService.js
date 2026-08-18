import { executeCypher, getConnectionStatus } from '../config/db.js';
import { CYPHER_QUERIES } from './cypherQueries.js';
import { dataset } from '../data/realisticDataset.js';

/**
 * Format a Neo4j Record / Value into clean JSON
 */
function neo4jToPlain(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    if (value.identity !== undefined && value.properties !== undefined) {
      // It's a Node or Relationship
      return {
        id: value.properties.id || String(value.identity),
        labels: value.labels || [value.type],
        type: value.type,
        properties: value.properties
      };
    }
    if (Array.isArray(value)) {
      return value.map(neo4jToPlain);
    }
    const plain = {};
    for (const key of Object.keys(value)) {
      plain[key] = neo4jToPlain(value[key]);
    }
    return plain;
  }
  return value;
}

/**
 * In-memory graph analytics fallback engine for offline / demo mode
 */
const mockEngine = {
  getOverviewStats() {
    const totalNodes = dataset.nodes.length;
    const totalEdges = dataset.relationships.length;
    const labelCounts = {};
    for (const node of dataset.nodes) {
      labelCounts[node.label] = (labelCounts[node.label] || 0) + 1;
    }
    const typeCounts = {};
    for (const rel of dataset.relationships) {
      typeCounts[rel.type] = (typeCounts[rel.type] || 0) + 1;
    }

    return {
      totalNodes,
      totalEdges,
      nodeLabels: Object.entries(labelCounts).map(([label, count]) => ({ label, count })),
      edgeTypes: Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
    };
  },

  getAllGraph(limit = 200) {
    return {
      nodes: dataset.nodes.slice(0, limit),
      relationships: dataset.relationships.slice(0, limit)
    };
  },

  searchNodes(searchTerm = '', limit = 20) {
    const term = searchTerm.toLowerCase();
    const matches = dataset.nodes.filter(n => {
      const p = n.properties;
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.id && p.id.toLowerCase().includes(term)) ||
        (p.taxId && p.taxId.toLowerCase().includes(term)) ||
        (p.jurisdiction && p.jurisdiction.toLowerCase().includes(term)) ||
        (p.accountNumber && p.accountNumber.toLowerCase().includes(term)) ||
        (p.value && p.value.toLowerCase().includes(term))
      );
    });
    return matches.slice(0, limit);
  },

  getNeighborhood(nodeId, limit = 50) {
    const node = dataset.nodes.find(n => n.id === nodeId);
    if (!node) return { nodes: [], relationships: [] };

    const rels = dataset.relationships.filter(
      r => r.startNode === nodeId || r.endNode === nodeId
    ).slice(0, limit);

    const neighborIds = new Set([nodeId]);
    rels.forEach(r => {
      neighborIds.add(r.startNode);
      neighborIds.add(r.endNode);
    });

    const nodes = dataset.nodes.filter(n => neighborIds.has(n.id));
    return { nodes, relationships: rels };
  },

  findUBOChains(targetCompanyId) {
    // Traverse OWNS relationships backwards from targetCompanyId to Person nodes (up to 6 hops)
    const results = [];

    function traverse(currentId, currentChain, currentRels, currentPct) {
      if (currentRels.length > 6) return;

      // Find incoming OWNS relationships to currentId
      const incoming = dataset.relationships.filter(
        r => r.type === 'OWNS' && r.endNode === currentId
      );

      for (const rel of incoming) {
        const ownerNode = dataset.nodes.find(n => n.id === rel.startNode);
        if (!ownerNode) continue;

        const stepPct = Number(rel.properties.percentage || 100.0);
        const newPct = currentPct * (stepPct / 100.0);
        const newChain = [ownerNode, ...currentChain];
        const newRels = [rel, ...currentRels];

        if (ownerNode.label === 'Person') {
          // Found ultimate human owner!
          results.push({
            ubo: ownerNode,
            target: dataset.nodes.find(n => n.id === targetCompanyId),
            effectiveOwnershipPct: Number(newPct.toFixed(2)),
            hopCount: newRels.length,
            chain: newChain,
            relationships: newRels,
            chainNames: newChain.map(n => n.properties.name || n.id),
            stepPercentages: newRels.map(r => r.properties.percentage)
          });
        } else if (ownerNode.label === 'Company') {
          // Recurse further up the holding pyramid
          traverse(ownerNode.id, newChain, newRels, newPct);
        }
      }
    }

    const targetNode = dataset.nodes.find(n => n.id === targetCompanyId);
    if (targetNode) {
      traverse(targetCompanyId, [targetNode], [], 100.0);
    }

    return results.sort((a, b) => b.effectiveOwnershipPct - a.effectiveOwnershipPct);
  },

  findCircularTransfers() {
    // Detect closed loops in TRANSFERRED edges
    const txRels = dataset.relationships.filter(r => r.type === 'TRANSFERRED');
    const loops = [];

    // Simple DFS for loops of length 3 to 6
    function findCycles(startNodeId, currentPath, visitedNodes) {
      if (currentPath.length >= 6) return;

      const lastNodeId = currentPath.length === 0 ? startNodeId : currentPath[currentPath.length - 1].endNode;
      const outgoing = txRels.filter(r => r.startNode === lastNodeId);

      for (const rel of outgoing) {
        if (rel.endNode === startNodeId && currentPath.length >= 2) {
          // Closed loop detected!
          const fullPath = [...currentPath, rel];
          const totalVol = fullPath.reduce((acc, r) => acc + (r.properties.amount || 0), 0);
          const involvedAccountIds = new Set(fullPath.flatMap(r => [r.startNode, r.endNode]));
          const involvedAccounts = dataset.nodes.filter(n => involvedAccountIds.has(n.id));

          loops.push({
            originId: startNodeId,
            originAccount: dataset.nodes.find(n => n.id === startNodeId),
            loopLength: fullPath.length,
            totalVolume: totalVol,
            transactions: fullPath,
            involvedAccounts
          });
          return;
        }

        if (!visitedNodes.has(rel.endNode) && currentPath.length < 5) {
          visitedNodes.add(rel.endNode);
          findCycles(startNodeId, [...currentPath, rel], new Set(visitedNodes));
          visitedNodes.delete(rel.endNode);
        }
      }
    }

    const accountNodes = dataset.nodes.filter(n => n.label === 'BankAccount');
    for (const acct of accountNodes) {
      findCycles(acct.id, [], new Set([acct.id]));
    }

    // Deduplicate cycles
    const uniqueLoops = [];
    const seen = new Set();
    for (const l of loops) {
      const key = l.transactions.map(t => t.id).sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLoops.push(l);
      }
    }

    return uniqueLoops;
  },

  findShortestPathToSanction(startEntityId) {
    // BFS to find shortest path to any SanctionList or Sanctioned Person
    const startNode = dataset.nodes.find(n => n.id === startEntityId);
    if (!startNode) return [];

    const queue = [[{ node: startNode, edge: null }]];
    const visited = new Set([startEntityId]);
    const paths = [];

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const lastItem = currentPath[currentPath.length - 1];
      const currentNode = lastItem.node;

      // Check if currentNode is a sanction target
      if (currentNode.label === 'SanctionList' || (currentNode.label === 'Person' && currentNode.properties.sanctioned)) {
        if (currentPath.length > 1) {
          paths.push({
            distance: currentPath.length - 1,
            nodes: currentPath.map(p => p.node),
            relationships: currentPath.slice(1).map(p => p.edge)
          });
          if (paths.length >= 3) break;
        }
      }

      // Find neighbors (undirected)
      const connectedEdges = dataset.relationships.filter(
        r => r.startNode === currentNode.id || r.endNode === currentNode.id
      );

      for (const edge of connectedEdges) {
        const nextId = edge.startNode === currentNode.id ? edge.endNode : edge.startNode;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          const nextNode = dataset.nodes.find(n => n.id === nextId);
          if (nextNode) {
            queue.push([...currentPath, { node: nextNode, edge }]);
          }
        }
      }
    }

    return paths;
  },

  findNomineeClusters(threshold = 2) {
    const hubMap = new Map();

    for (const rel of dataset.relationships) {
      if (rel.type === 'SERVES_AS' || rel.type === 'ASSOCIATED_WITH') {
        const hubId = rel.endNode;
        const compId = rel.startNode;
        const hubNode = dataset.nodes.find(n => n.id === hubId);
        const compNode = dataset.nodes.find(n => n.id === compId && n.label === 'Company');

        if (hubNode && compNode) {
          if (!hubMap.has(hubId)) {
            hubMap.set(hubId, { hub: hubNode, companies: [], relationships: [] });
          }
          const cluster = hubMap.get(hubId);
          if (!cluster.companies.some(c => c.id === compId)) {
            cluster.companies.push(compNode);
            cluster.relationships.push(rel);
          }
        }
      }
    }

    const clusters = Array.from(hubMap.values())
      .filter(c => c.companies.length >= threshold)
      .map(c => ({
        hub: c.hub,
        companies: c.companies,
        companyCount: c.companies.length,
        relationships: c.relationships
      }))
      .sort((a, b) => b.companyCount - a.companyCount);

    return clusters;
  }
};

/**
 * Main Service Layer
 */
export const graphService = {
  async getOverviewStats() {
    const status = getConnectionStatus();
    if (!status.connected) {
      return {
        ...mockEngine.getOverviewStats(),
        connection: status,
        source: 'mock_fallback'
      };
    }

    try {
      const statsRes = await executeCypher(CYPHER_QUERIES.GET_OVERVIEW_STATS);
      const labelsRes = await executeCypher(CYPHER_QUERIES.GET_NODES_BY_LABEL);
      const typesRes = await executeCypher(CYPHER_QUERIES.GET_EDGES_BY_TYPE);

      const record = statsRes.records[0];
      return {
        totalNodes: record ? record.get('totalNodes') : 0,
        totalEdges: record ? record.get('totalEdges') : 0,
        nodeLabels: labelsRes.records.map(r => ({
          label: r.get('label'),
          count: r.get('count')
        })),
        edgeTypes: typesRes.records.map(r => ({
          type: r.get('type'),
          count: r.get('count')
        })),
        connection: status,
        source: 'live_cognodb'
      };
    } catch (err) {
      console.warn('Error fetching live stats, falling back to mock:', err.message);
      return {
        ...mockEngine.getOverviewStats(),
        connection: { ...status, error: err.message },
        source: 'mock_fallback'
      };
    }
  },

  async getAllGraph(limit = 200) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return {
        ...mockEngine.getAllGraph(limit),
        source: 'mock_fallback'
      };
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.GET_ALL_GRAPH, { limit: neo4j.int(limit) });
      const nodesMap = new Map();
      const relsMap = new Map();

      for (const record of res.records) {
        const n = record.get('n');
        const r = record.get('r');
        const m = record.get('m');

        if (n) nodesMap.set(n.properties.id || String(n.identity), {
          id: n.properties.id || String(n.identity),
          label: n.labels[0],
          properties: n.properties
        });
        if (m) nodesMap.set(m.properties.id || String(m.identity), {
          id: m.properties.id || String(m.identity),
          label: m.labels[0],
          properties: m.properties
        });
        if (r) relsMap.set(String(r.identity), {
          id: r.properties.id || String(r.identity),
          type: r.type,
          startNode: n ? (n.properties.id || String(n.identity)) : null,
          endNode: m ? (m.properties.id || String(m.identity)) : null,
          properties: r.properties
        });
      }

      return {
        nodes: Array.from(nodesMap.values()),
        relationships: Array.from(relsMap.values()),
        durationMs: res.durationMs,
        source: 'live_cognodb'
      };
    } catch (err) {
      console.warn('Error fetching live graph, falling back to mock:', err.message);
      return {
        ...mockEngine.getAllGraph(limit),
        source: 'mock_fallback'
      };
    }
  },

  async searchNodes(searchTerm, limit = 20) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.searchNodes(searchTerm, limit);
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.SEARCH_NODES, {
        searchTerm,
        limit: neo4j.int(limit)
      });
      return res.records.map(r => {
        const n = r.get('n');
        return {
          id: n.properties.id || String(n.identity),
          label: n.labels[0],
          properties: n.properties
        };
      });
    } catch (err) {
      return mockEngine.searchNodes(searchTerm, limit);
    }
  },

  async getNeighborhood(nodeId, limit = 50) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.getNeighborhood(nodeId, limit);
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.GET_NEIGHBORHOOD, {
        nodeId,
        limit: neo4j.int(limit)
      });
      const nodesMap = new Map();
      const relsMap = new Map();

      for (const record of res.records) {
        const n = record.get('n');
        const r = record.get('r');
        const neighbor = record.get('neighbor');

        if (n) nodesMap.set(n.properties.id || String(n.identity), {
          id: n.properties.id || String(n.identity),
          label: n.labels[0],
          properties: n.properties
        });
        if (neighbor) nodesMap.set(neighbor.properties.id || String(neighbor.identity), {
          id: neighbor.properties.id || String(neighbor.identity),
          label: neighbor.labels[0],
          properties: neighbor.properties
        });
        if (r) relsMap.set(String(r.identity), {
          id: r.properties.id || String(r.identity),
          type: r.type,
          startNode: String(r.startNodeElementId || r.start),
          endNode: String(r.endNodeElementId || r.end),
          properties: r.properties
        });
      }

      return {
        nodes: Array.from(nodesMap.values()),
        relationships: Array.from(relsMap.values())
      };
    } catch (err) {
      return mockEngine.getNeighborhood(nodeId, limit);
    }
  },

  async findUBOChains(targetCompanyId) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.findUBOChains(targetCompanyId);
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.FIND_UBO_CHAINS, {
        targetCompanyId
      });
      return res.records.map(r => ({
        ubo: neo4jToPlain(r.get('ubo')),
        target: neo4jToPlain(r.get('target')),
        effectiveOwnershipPct: r.get('effectiveOwnershipPct'),
        hopCount: r.get('hopCount'),
        chainNames: r.get('chainNames'),
        stepPercentages: r.get('stepPercentages'),
        path: neo4jToPlain(r.get('path'))
      }));
    } catch (err) {
      console.warn('Error running UBO cypher, fallback to mock:', err.message);
      return mockEngine.findUBOChains(targetCompanyId);
    }
  },

  async findCircularTransfers() {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.findCircularTransfers();
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.FIND_CIRCULAR_TRANSFERS);
      return res.records.map(r => ({
        originAccount: neo4jToPlain(r.get('origin')),
        loopLength: r.get('loopLength'),
        totalVolume: r.get('totalVolume'),
        transactions: neo4jToPlain(r.get('transactions')),
        involvedAccounts: neo4jToPlain(r.get('involvedAccounts'))
      }));
    } catch (err) {
      console.warn('Error running circular transfer cypher, fallback to mock:', err.message);
      return mockEngine.findCircularTransfers();
    }
  },

  async findShortestPathToSanction(startEntityId) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.findShortestPathToSanction(startEntityId);
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.FIND_SHORTEST_PATH_TO_SANCTION, {
        startEntityId
      });
      return res.records.map(r => ({
        distance: r.get('distance'),
        nodes: neo4jToPlain(r.get('pathNodes')),
        relationships: neo4jToPlain(r.get('pathEdges'))
      }));
    } catch (err) {
      console.warn('Error running shortest path cypher, fallback to mock:', err.message);
      return mockEngine.findShortestPathToSanction(startEntityId);
    }
  },

  async findNomineeClusters(threshold = 2) {
    const status = getConnectionStatus();
    if (!status.connected) {
      return mockEngine.findNomineeClusters(threshold);
    }

    try {
      const res = await executeCypher(CYPHER_QUERIES.FIND_NOMINEE_AND_ADDRESS_CLUSTERS, {
        threshold: neo4j.int(threshold)
      });
      return res.records.map(r => ({
        hub: neo4jToPlain(r.get('hub')),
        companies: neo4jToPlain(r.get('companies')),
        companyCount: r.get('companyCount'),
        relationships: neo4jToPlain(r.get('rels'))
      }));
    } catch (err) {
      console.warn('Error running nominee cluster cypher, fallback to mock:', err.message);
      return mockEngine.findNomineeClusters(threshold);
    }
  },

  async runCustomCypher(query, params = {}) {
    const status = getConnectionStatus();
    const startTime = Date.now();

    // If connected to live CognoDB cluster, execute via Bolt driver
    if (status.connected) {
      try {
        const res = await executeCypher(query, params, 'READ');
        const rows = res.records.map(rec => {
          const row = {};
          rec.keys.forEach(k => {
            row[k] = neo4jToPlain(rec.get(k));
          });
          return row;
        });

        return {
          success: true,
          columns: res.records.length > 0 ? res.records[0].keys : [],
          rows,
          rowCount: rows.length,
          durationMs: res.durationMs,
          mode: 'live_cognodb'
        };
      } catch (err) {
        return {
          success: false,
          error: err.message,
          mode: 'live_cognodb'
        };
      }
    }

    // In Offline Mock Mode, evaluate queries against the realistic in-memory graph
    const qLower = query.toLowerCase();

    // 1. UBO Traversal Query
    if (qLower.includes('ubo') || qLower.includes('owns*')) {
      const uboData = mockEngine.findUBOChains('comp-kensington-sovereign');
      const rows = uboData.map(item => ({
        UltimateOwner: item.ubo?.properties?.name || 'Viktor Volkov',
        TargetCompany: item.target?.properties?.name || 'Kensington Sovereign Properties Ltd',
        EffectiveOwnership: `${item.effectiveOwnershipPct}%`,
        Hops: item.hopCount,
        OwnershipChain: item.chainNames.join(' ➔ ')
      }));

      return {
        success: true,
        columns: ['UltimateOwner', 'TargetCompany', 'EffectiveOwnership', 'Hops', 'OwnershipChain'],
        rows,
        rowCount: rows.length,
        durationMs: Date.now() - startTime + 4,
        mode: 'mock_offline'
      };
    }

    // 2. Circular Wash Trading Query
    if (qLower.includes('transferred*') || qLower.includes('closed') || qLower.includes('wash')) {
      const loopData = mockEngine.findCircularTransfers();
      const rows = loopData.map(l => ({
        OriginBank: l.originAccount?.properties?.bankName || 'Banque Privée Zurich',
        Account: l.originAccount?.properties?.accountNumber || 'CH93000000192837465',
        LoopHops: l.loopLength,
        LaunderingVolume: `$${(l.totalVolume / 1000000).toFixed(2)}M USD`,
        Currency: 'USD',
        RiskRating: 'HIGH (Suspicious Closed Cycle)'
      }));

      return {
        success: true,
        columns: ['OriginBank', 'Account', 'LoopHops', 'LaunderingVolume', 'Currency', 'RiskRating'],
        rows,
        rowCount: rows.length,
        durationMs: Date.now() - startTime + 3,
        mode: 'mock_offline'
      };
    }

    // 3. Shortest Path Query
    if (qLower.includes('shortestpath')) {
      const pathData = mockEngine.findShortestPathToSanction('comp-kensington-sovereign');
      const rows = pathData.map(p => ({
        SubjectEntity: 'Kensington Sovereign Properties Ltd',
        TargetWatchlist: 'OFAC Specially Designated Nationals (SDN)',
        DegreesOfSeparation: p.distance,
        ConnectionTrace: p.nodes.map(n => n.properties?.name || n.id).join(' ➔ '),
        RiskLevel: 'CRITICAL OFAC LISTED'
      }));

      return {
        success: true,
        columns: ['SubjectEntity', 'TargetWatchlist', 'DegreesOfSeparation', 'ConnectionTrace', 'RiskLevel'],
        rows: rows.length > 0 ? rows : [{
          SubjectEntity: 'Kensington Sovereign Properties Ltd',
          TargetWatchlist: 'OFAC Specially Designated Nationals (SDN)',
          DegreesOfSeparation: 6,
          ConnectionTrace: 'Kensington ➔ Albion Prime ➔ Aethelgard ➔ Cayman ➔ Cyprus ➔ Viktor Volkov ➔ OFAC SDN',
          RiskLevel: 'CRITICAL OFAC LISTED'
        }],
        rowCount: rows.length || 1,
        durationMs: Date.now() - startTime + 5,
        mode: 'mock_offline'
      };
    }

    // 4. Nominee / Address Clusters Query
    if (qLower.includes('sharedidentifier') || qLower.includes('nominee') || qLower.includes('shell')) {
      const clusterData = mockEngine.findNomineeClusters(2);
      const rows = clusterData.map(c => ({
        RegistrationHub: c.hub?.properties?.value || c.hub?.properties?.name,
        ShellCount: c.companyCount,
        ShellEntities: c.companies.map(comp => comp.properties?.name).join(', ')
      }));

      return {
        success: true,
        columns: ['RegistrationHub', 'ShellCount', 'ShellEntities'],
        rows,
        rowCount: rows.length,
        durationMs: Date.now() - startTime + 3,
        mode: 'mock_offline'
      };
    }

    // 5. Default Generic Query (Return dataset entities)
    const genericRows = dataset.nodes.slice(0, 10).map(n => ({
      ID: n.id,
      Label: n.label,
      Name: n.properties?.name || n.properties?.accountNumber || n.properties?.value,
      Jurisdiction: n.properties?.jurisdiction || 'N/A',
      RiskScore: `${n.properties?.riskScore || 0}/100`
    }));

    return {
      success: true,
      columns: ['ID', 'Label', 'Name', 'Jurisdiction', 'RiskScore'],
      rows: genericRows,
      rowCount: genericRows.length,
      durationMs: Date.now() - startTime + 2,
      mode: 'mock_offline'
    };
  }
};
