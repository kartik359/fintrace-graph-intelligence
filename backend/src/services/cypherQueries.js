/**
 * Strictly Parameterized Cypher Queries for FinTrace Graph Intelligence
 * 
 * Demonstrates openCypher capabilities on CognoDB:
 * - Multi-hop recursive ownership traversals (1..6 hops)
 * - Circular wash-trading / cycle detection (awkward & prohibitive in SQL)
 * - Native shortest-path graph algorithms
 * - Shared identifier cluster aggregation
 */

export const CYPHER_QUERIES = {
  /**
   * 1. Overview Statistics
   */
  GET_OVERVIEW_STATS: `
    MATCH (n)
    WITH count(n) AS totalNodes, collect(labels(n)) AS allLabels
    OPTIONAL MATCH ()-[r]->()
    WITH totalNodes, allLabels, count(r) AS totalEdges, collect(type(r)) AS allTypes
    RETURN totalNodes, totalEdges
  `,

  GET_NODES_BY_LABEL: `
    MATCH (n)
    RETURN labels(n)[0] AS label, count(n) AS count
    ORDER BY count DESC
  `,

  GET_EDGES_BY_TYPE: `
    MATCH ()-[r]->()
    RETURN type(r) AS type, count(r) AS count
    ORDER BY count DESC
  `,

  /**
   * 2. Full Graph / Scenario Explorer
   */
  GET_ALL_GRAPH: `
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN n, r, m
    LIMIT $limit
  `,

  GET_NEIGHBORHOOD: `
    MATCH (n {id: $nodeId})
    OPTIONAL MATCH (n)-[r]-(neighbor)
    RETURN n, r, neighbor
    LIMIT $limit
  `,

  SEARCH_NODES: `
    MATCH (n)
    WHERE toLower(coalesce(n.name, n.accountNumber, n.value, '')) CONTAINS toLower($searchTerm)
       OR toLower(coalesce(n.taxId, n.jurisdiction, n.role, '')) CONTAINS toLower($searchTerm)
    RETURN n
    LIMIT $limit
  `,

  /**
   * 3. Multi-Hop Ultimate Beneficial Ownership (UBO) Calculation (1 to 6 hops)
   * 
   * Traverses variable-length ownership paths to find human individuals (:Person)
   * holding indirect equity in a target company. Calculates cumulative ownership percentage.
   */
  FIND_UBO_CHAINS: `
    MATCH path = (ubo:Person)-[rels:OWNS*1..6]->(target:Company {id: $targetCompanyId})
    WITH ubo, target, path, rels,
         reduce(acc = 1.0, r IN rels | acc * (toFloat(coalesce(r.percentage, 100.0)) / 100.0)) * 100.0 AS effectiveOwnershipPct
    RETURN ubo,
           target,
           path,
           effectiveOwnershipPct,
           length(path) AS hopCount,
           [n IN nodes(path) | coalesce(n.name, n.id)] AS chainNames,
           [r IN rels | r.percentage] AS stepPercentages
    ORDER BY effectiveOwnershipPct DESC
  `,

  /**
   * 4. Circular Money Laundering / Wash-Trading Cycle Detection
   * 
   * Finds closed transaction loops (3 to 6 hops) where funds are routed through
   * intermediate accounts and returned to the origin entity.
   * In Relational SQL, this requires expensive recursive joins and cycle trackers.
   */
  FIND_CIRCULAR_TRANSFERS: `
    MATCH path = (origin:BankAccount)-[txs:TRANSFERRED*3..6]->(origin)
    WITH origin, path, txs,
         reduce(total = 0.0, tx IN txs | total + toFloat(coalesce(tx.amount, 0.0))) AS totalVolume,
         length(path) AS loopLength
    RETURN origin,
           path,
           nodes(path) AS involvedAccounts,
           txs AS transactions,
           totalVolume,
           loopLength
    LIMIT 10
  `,

  /**
   * 5. Shortest Path to Sanctioned Entities / PEPs
   * 
   * Uses native graph traversal to trace the shortest chain of connections
   * between any subject entity and global sanction lists or flagged individuals.
   */
  FIND_SHORTEST_PATH_TO_SANCTION: `
    MATCH (start {id: $startEntityId}), (sanction:SanctionList)
    MATCH p = shortestPath((start)-[*1..6]-(sanction))
    RETURN p,
           length(p) AS distance,
           nodes(p) AS pathNodes,
           relationships(p) AS pathEdges
    ORDER BY distance ASC
    LIMIT 5
  `,

  FIND_ALL_SANCTION_EXPOSURES: `
    MATCH (target:Company)
    MATCH p = shortestPath((target)-[*1..5]-(sanctioned:Person {sanctioned: true}))
    WHERE target <> sanctioned
    RETURN target,
           sanctioned,
           length(p) AS hopsToSanction,
           [n IN nodes(p) | coalesce(n.name, n.id)] AS connectionTrace
    ORDER BY hopsToSanction ASC
    LIMIT 20
  `,

  /**
   * 6. Nominee Director & Synthetic Mailbox Cluster Analysis
   * 
   * Detects hubs where multiple corporate entities share the same nominee director
   * or registered mailbox address above a configurable threshold.
   */
  FIND_NOMINEE_AND_ADDRESS_CLUSTERS: `
    MATCH (hub)<-[rel:SERVES_AS|ASSOCIATED_WITH]-(comp:Company)
    WHERE hub:Person OR hub:SharedIdentifier
    WITH hub, collect(comp) AS companies, count(comp) AS companyCount, collect(rel) AS rels
    WHERE companyCount >= $threshold
    RETURN hub,
           companies,
           companyCount,
           rels
    ORDER BY companyCount DESC
  `
};
