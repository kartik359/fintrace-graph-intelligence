import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDriver, testConnection, closeDriver } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'FinTrace Graph Intelligence API',
    version: '1.0.0',
    description: 'Graph Database Backend powered by CognoDB (Bolt Protocol)',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      graph: '/api/graph',
      uboAnalytics: '/api/analytics/ubo?targetCompanyId=comp-kensington-sovereign',
      circularAnalytics: '/api/analytics/circular-transfers',
      sanctionAnalytics: '/api/analytics/sanctions?startEntityId=comp-kensington-sovereign',
      nomineeClusters: '/api/analytics/nominee-clusters'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nShutting down FinTrace server...');
  await closeDriver();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nTerminating FinTrace server...');
  await closeDriver();
  process.exit(0);
});

// Start Server
app.listen(PORT, async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  FinTrace Graph Intelligence API Server`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════════');

  initDriver();
  const conn = await testConnection();
  if (conn.connected) {
    console.log(`🚀 [Database] Live CognoDB instance active.`);
  } else {
    console.log(`⚡ [Database] Offline / Mock Fallback Engine active.`);
    console.log(`   (To connect live CognoDB, update backend/.env with your bolt+s URI)`);
  }
});
