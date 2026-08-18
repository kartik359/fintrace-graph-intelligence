import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

let driver = null;
let connectionStatus = {
  connected: false,
  uri: process.env.COGNODB_URI || null,
  user: process.env.COGNODB_USER || 'cognodb',
  error: null,
  database: 'cognodb',
  mode: 'offline_fallback' // 'live_cognodb' or 'offline_fallback'
};

/**
 * Initialize the CognoDB (Neo4j Bolt) Driver Singleton
 */
export function initDriver() {
  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER || 'cognodb';
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !password || uri.includes('<instance-id>')) {
    console.warn('[CognoDB Driver] No valid COGNODB_URI or password configured in environment.');
    console.warn('[CognoDB Driver] Running in resilient OFFLINE DEMO / MOCK MODE.');
    connectionStatus.connected = false;
    connectionStatus.mode = 'offline_fallback';
    connectionStatus.error = 'No CognoDB credentials found in .env';
    return null;
  }

  try {
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 8000,
        disableLosslessIntegers: true
      }
    );

    connectionStatus.uri = uri;
    connectionStatus.user = user;
    return driver;
  } catch (err) {
    console.error('[CognoDB Driver] Initialization error:', err.message);
    connectionStatus.connected = false;
    connectionStatus.mode = 'offline_fallback';
    connectionStatus.error = err.message;
    return null;
  }
}

/**
 * Test connectivity against CognoDB Cloud instance
 */
export async function testConnection() {
  if (!driver) {
    initDriver();
  }

  if (!driver) {
    connectionStatus.connected = false;
    connectionStatus.mode = 'offline_fallback';
    return connectionStatus;
  }

  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 AS ping, timestamp() AS serverTime');
    if (result.records && result.records.length > 0) {
      connectionStatus.connected = true;
      connectionStatus.mode = 'live_cognodb';
      connectionStatus.error = null;
      console.log('✅ [CognoDB Cloud] Connected successfully via Bolt protocol!');
    }
  } catch (err) {
    console.error('⚠️ [CognoDB Cloud] Connection test failed:', err.message);
    connectionStatus.connected = false;
    connectionStatus.mode = 'offline_fallback';
    connectionStatus.error = err.message;
  } finally {
    await session.close();
  }

  return connectionStatus;
}

/**
 * Helper to execute a parameterized Cypher query against CognoDB
 * @param {string} query Cypher query string
 * @param {object} params Parameter map (strictly parameterized)
 * @param {string} accessMode neo4j.session.READ or neo4j.session.WRITE
 */
export async function executeCypher(query, params = {}, accessMode = 'READ') {
  if (!driver || !connectionStatus.connected) {
    throw new Error('Database is offline or not connected');
  }

  const session = driver.session({
    defaultAccessMode: accessMode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ
  });

  const startTime = Date.now();
  try {
    const result = await session.run(query, params);
    const durationMs = Date.now() - startTime;
    return { records: result.records, summary: result.summary, durationMs };
  } finally {
    await session.close();
  }
}

export function getDriver() {
  return driver;
}

export function getConnectionStatus() {
  return connectionStatus;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
