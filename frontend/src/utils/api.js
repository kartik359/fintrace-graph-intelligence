import {
  demoNodes,
  demoRelationships,
  getDemoCircularTransfers,
  getDemoNeighborhood,
  getDemoNomineeClusters,
  getDemoSanctions,
  getDemoStats,
  getDemoUBO,
  searchDemoNodes,
} from '../data/demoGraph.js';

const API_BASE = '/api';

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error('API returned a non-JSON response');
  }

  return response.json();
}

export async function fetchHealth() {
  try {
    return await requestJson('/health');
  } catch (err) {
    return {
      status: 'offline',
      connected: false,
      dbMode: 'offline_fallback',
      error: err.message
    };
  }
}

export async function fetchStats() {
  try {
    return await requestJson('/stats');
  } catch {
    return getDemoStats();
  }
}

export async function fetchGraph(limit = 200) {
  try {
    return await requestJson(`/graph?limit=${limit}`);
  } catch {
    return { nodes: demoNodes.slice(0, limit), relationships: demoRelationships };
  }
}

export async function searchNodes(query) {
  if (!query || query.trim() === '') return { results: [] };
  try {
    return await requestJson(`/nodes/search?q=${encodeURIComponent(query)}`);
  } catch {
    return { results: searchDemoNodes(query) };
  }
}

export async function fetchNeighborhood(nodeId) {
  try {
    return await requestJson(`/nodes/${nodeId}/neighborhood`);
  } catch {
    return getDemoNeighborhood(nodeId);
  }
}

export async function fetchUBO(targetCompanyId) {
  try {
    return await requestJson(`/analytics/ubo?targetCompanyId=${encodeURIComponent(targetCompanyId)}`);
  } catch {
    return getDemoUBO(targetCompanyId);
  }
}

export async function fetchCircularTransfers() {
  try {
    return await requestJson('/analytics/circular-transfers');
  } catch {
    return getDemoCircularTransfers();
  }
}

export async function fetchSanctions(startEntityId) {
  try {
    return await requestJson(`/analytics/sanctions?startEntityId=${encodeURIComponent(startEntityId)}`);
  } catch {
    return getDemoSanctions(startEntityId);
  }
}

export async function fetchNomineeClusters(threshold = 2) {
  try {
    return await requestJson(`/analytics/nominee-clusters?threshold=${threshold}`);
  } catch {
    return getDemoNomineeClusters();
  }
}

export async function runCypher(query, params = {}) {
  try {
    return await requestJson('/cypher/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params })
    });
  } catch {
    return {
      success: true,
      mode: 'offline_fallback',
      records: [],
      summary: 'The query console requires a connected CognoDB backend. The interactive demo graph remains available.',
    };
  }
}
