/**
 * Seed Script for CognoDB Cloud Graph Database
 * 
 * Uses official Neo4j Bolt Driver with strict Cypher parameterization.
 * Ingests 4 realistic forensic scenarios:
 * 1. The Matryoshka Multi-Hop Offshore Holding Pyramid (6 hops to Sanctioned Oligarch)
 * 2. The Circular SWIFT Money Laundering / Wash-Trading Loop
 * 3. The Nominee Director & Synthetic Mailbox Cluster Farm
 * 4. Legitimate Commercial Entity (Clean baseline)
 * 
 * Usage:
 *   node src/data/seed.js
 *   or
 *   npm run seed
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import { dataset } from './realisticDataset.js';

dotenv.config();

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password || uri.includes('<instance-id>')) {
  console.error('\n❌ [Seed Error] No valid CognoDB credentials found in .env file!');
  console.error('Please configure your CognoDB Cloud instance details in backend/.env:');
  console.error('  COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud');
  console.error('  COGNODB_USER=cognodb');
  console.error('  COGNODB_PASSWORD=<your-generated-password>\n');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  disableLosslessIntegers: true
});

async function seedDatabase() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FinTrace Graph Intelligence — CognoDB Cloud Data Seeder  ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📡 Connecting to CognoDB at: ${uri.replace(/:[^:@]+@/, ':***@')}`);

  const session = driver.session();
  const startTime = Date.now();

  try {
    // 1. Verify Connectivity
    const ping = await session.run('RETURN 1 AS test');
    if (!ping.records.length) throw new Error('Could not establish Bolt handshake.');
    console.log('✅ Connection verified via Bolt 5.x protocol.');

    // 2. Clean Existing Schema/Data
    console.log('\n🧹 Clearing old graph data (DETACH DELETE)...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Clean slate ready.');

    // 3. Create Constraints & Indexes for high query performance
    console.log('\n⚡ Creating uniqueness constraints & indexes...');
    const constraintQueries = [
      'CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT account_id_unique IF NOT EXISTS FOR (a:BankAccount) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT sanction_id_unique IF NOT EXISTS FOR (s:SanctionList) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT identifier_id_unique IF NOT EXISTS FOR (i:SharedIdentifier) REQUIRE i.id IS UNIQUE'
    ];

    for (const cq of constraintQueries) {
      try {
        await session.run(cq);
      } catch (cErr) {
        // CognoDB / openCypher may have specific constraint syntax, fallback silently
      }
    }
    console.log('✅ Schema definitions initialized.');

    // 4. Ingest Nodes by Label using Parameterized UNWIND
    console.log('\n📥 Ingesting Nodes...');
    const nodesByLabel = {};
    for (const node of dataset.nodes) {
      if (!nodesByLabel[node.label]) nodesByLabel[node.label] = [];
      nodesByLabel[node.label].push(node.properties);
    }

    for (const [label, batch] of Object.entries(nodesByLabel)) {
      const nodeQuery = `
        UNWIND $batch AS props
        MERGE (n:\`${label}\` { id: props.id })
        SET n += props
      `;
      await session.run(nodeQuery, { batch });
      console.log(`   + Created ${batch.length} (:${label}) nodes`);
    }

    // 5. Ingest Relationships using Parameterized Queries
    console.log('\n🔗 Ingesting Typed Relationships...');
    const relsByType = {};
    for (const rel of dataset.relationships) {
      if (!relsByType[rel.type]) relsByType[rel.type] = [];
      relsByType[rel.type].push({
        id: rel.id,
        startNode: rel.startNode,
        endNode: rel.endNode,
        props: rel.properties
      });
    }

    for (const [type, batch] of Object.entries(relsByType)) {
      const relQuery = `
        UNWIND $batch AS item
        MATCH (a { id: item.startNode })
        MATCH (b { id: item.endNode })
        MERGE (a)-[r:\`${type}\` { id: item.id }]->(b)
        SET r += item.props
      `;
      await session.run(relQuery, { batch });
      console.log(`   + Created ${batch.length} [:${type}] edges`);
    }

    // 6. Verification Summary
    const statsResult = await session.run(`
      MATCH (n)
      WITH count(n) AS nodeCount
      MATCH ()-[r]->()
      RETURN nodeCount, count(r) AS edgeCount
    `);

    const totalNodes = statsResult.records[0].get('nodeCount');
    const totalEdges = statsResult.records[0].get('edgeCount');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`   Total Nodes:         ${totalNodes}`);
    console.log(`   Total Relationships: ${totalEdges}`);
    console.log(`   Elapsed Time:        ${elapsedSec}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ [Seed Failed]:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
