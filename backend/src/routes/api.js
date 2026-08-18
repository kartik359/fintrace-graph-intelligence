import { Router } from 'express';
import { graphController } from '../controllers/graphController.js';

const router = Router();

// Health & System Info
router.get('/health', graphController.getHealth);
router.get('/stats', graphController.getStats);

// Graph Data & Explorer
router.get('/graph', graphController.getGraph);
router.get('/nodes/search', graphController.searchNodes);
router.get('/nodes/:id/neighborhood', graphController.getNeighborhood);

// Forensic Graph Analytics & Algorithms
router.get('/analytics/ubo', graphController.getUBOChains);
router.get('/analytics/circular-transfers', graphController.getCircularTransfers);
router.get('/analytics/sanctions', graphController.getSanctionShortestPath);
router.get('/analytics/nominee-clusters', graphController.getNomineeClusters);

// Custom Cypher Console (Parameterized)
router.post('/cypher/run', graphController.runCustomCypher);

export default router;
