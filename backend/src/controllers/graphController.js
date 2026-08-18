import { graphService } from '../services/graphService.js';
import { getConnectionStatus, testConnection } from '../config/db.js';

export const graphController = {
  async getHealth(req, res) {
    try {
      const status = await testConnection();
      res.json({
        status: status.connected ? 'healthy' : 'degraded',
        dbMode: status.mode,
        connected: status.connected,
        uri: status.uri ? status.uri.replace(/:[^:@]+@/, ':***@') : null,
        error: status.error,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getStats(req, res) {
    try {
      const data = await graphService.getOverviewStats();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getGraph(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 200;
      const data = await graphService.getAllGraph(limit);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async searchNodes(req, res) {
    try {
      const query = req.query.q || '';
      const limit = parseInt(req.query.limit, 10) || 20;
      const results = await graphService.searchNodes(query, limit);
      res.json({ query, count: results.length, results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getNeighborhood(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit, 10) || 50;
      const data = await graphService.getNeighborhood(id, limit);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUBOChains(req, res) {
    try {
      const { targetCompanyId } = req.query;
      if (!targetCompanyId) {
        return res.status(400).json({ error: 'targetCompanyId parameter is required' });
      }
      const data = await graphService.findUBOChains(targetCompanyId);
      res.json({
        targetCompanyId,
        chainCount: data.length,
        results: data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getCircularTransfers(req, res) {
    try {
      const data = await graphService.findCircularTransfers();
      res.json({
        detectedLoops: data.length,
        loops: data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSanctionShortestPath(req, res) {
    try {
      const { startEntityId } = req.query;
      if (!startEntityId) {
        return res.status(400).json({ error: 'startEntityId parameter is required' });
      }
      const paths = await graphService.findShortestPathToSanction(startEntityId);
      res.json({
        startEntityId,
        pathCount: paths.length,
        paths
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getNomineeClusters(req, res) {
    try {
      const threshold = parseInt(req.query.threshold, 10) || 2;
      const clusters = await graphService.findNomineeClusters(threshold);
      res.json({
        threshold,
        clusterCount: clusters.length,
        clusters
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async runCustomCypher(req, res) {
    try {
      const { query, params } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Valid Cypher query string is required' });
      }
      const result = await graphService.runCustomCypher(query, params || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
