/**
 * API Client Utility for FinTrace Backend & CognoDB
 */

const API_BASE = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
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
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to load stats');
  return await res.json();
}

export async function fetchGraph(limit = 200) {
  const res = await fetch(`${API_BASE}/graph?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load graph data');
  return await res.json();
}

export async function searchNodes(query) {
  if (!query || query.trim() === '') return { results: [] };
  const res = await fetch(`${API_BASE}/nodes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return await res.json();
}

export async function fetchNeighborhood(nodeId) {
  const res = await fetch(`${API_BASE}/nodes/${nodeId}/neighborhood`);
  if (!res.ok) throw new Error('Failed to load node neighborhood');
  return await res.json();
}

export async function fetchUBO(targetCompanyId) {
  const res = await fetch(`${API_BASE}/analytics/ubo?targetCompanyId=${encodeURIComponent(targetCompanyId)}`);
  if (!res.ok) throw new Error('Failed to execute UBO analysis');
  return await res.json();
}

export async function fetchCircularTransfers() {
  const res = await fetch(`${API_BASE}/analytics/circular-transfers`);
  if (!res.ok) throw new Error('Failed to execute circular transfer detection');
  return await res.json();
}

export async function fetchSanctions(startEntityId) {
  const res = await fetch(`${API_BASE}/analytics/sanctions?startEntityId=${encodeURIComponent(startEntityId)}`);
  if (!res.ok) throw new Error('Failed to trace sanction shortest path');
  return await res.json();
}

export async function fetchNomineeClusters(threshold = 2) {
  const res = await fetch(`${API_BASE}/analytics/nominee-clusters?threshold=${threshold}`);
  if (!res.ok) throw new Error('Failed to load nominee clusters');
  return await res.json();
}

export async function runCypher(query, params = {}) {
  const res = await fetch(`${API_BASE}/cypher/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, params })
  });
  return await res.json();
}
