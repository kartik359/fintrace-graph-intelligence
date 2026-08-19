export const demoNodes = [
  { id: 'person-elena-rostova', label: 'Person', properties: { name: 'Elena Rostova', role: 'Ultimate Beneficial Owner', jurisdiction: 'Cyprus', riskScore: 94 } },
  { id: 'person-daniel-hart', label: 'Person', properties: { name: 'Daniel Hart', role: 'Director', jurisdiction: 'United Kingdom', riskScore: 22 } },
  { id: 'comp-aethelgard-cap', label: 'Company', properties: { name: 'Aethelgard Capital Management Ltd', jurisdiction: 'Jersey', riskScore: 88 } },
  { id: 'comp-albion-prime', label: 'Company', properties: { name: 'Albion Prime Real Estate Ltd', jurisdiction: 'United Kingdom', riskScore: 82 } },
  { id: 'comp-kensington-sovereign', label: 'Company', properties: { name: 'Kensington Sovereign Properties Ltd', jurisdiction: 'United Kingdom', riskScore: 86 } },
  { id: 'comp-beacon-uk', label: 'Company', properties: { name: 'Beacon UK Diagnostics Ltd', jurisdiction: 'United Kingdom', riskScore: 18 } },
  { id: 'comp-beacon-health-us', label: 'Company', properties: { name: 'Beacon Health Technologies Inc', jurisdiction: 'United States', riskScore: 14 } },
  { id: 'comp-boreas-trading', label: 'Company', properties: { name: 'Boreas Trading Ltd', jurisdiction: 'BVI', riskScore: 78 } },
  { id: 'comp-zephyr-capital', label: 'Company', properties: { name: 'Zephyr Capital Holdings', jurisdiction: 'BVI', riskScore: 81 } },
  { id: 'comp-nordic-silk', label: 'Company', properties: { name: 'Nordic Silk Ventures', jurisdiction: 'Panama', riskScore: 76 } },
  { id: 'comp-pinnacle-crest', label: 'Company', properties: { name: 'Pinnacle Crest SA', jurisdiction: 'Seychelles', riskScore: 84 } },
  { id: 'comp-silverline-raw', label: 'Company', properties: { name: 'SilverLine Raw Materials Corp', jurisdiction: 'BVI', riskScore: 96 } },
  { id: 'ident-mailbox-tortola', label: 'SharedIdentifier', properties: { value: 'P.O. Box 438, Tortola', identifierType: 'Registered address', riskScore: 72 } },
  { id: 'acct-apex-zurich', label: 'BankAccount', properties: { accountNumber: 'APEX-ZRH-8841', jurisdiction: 'Switzerland', riskScore: 89 } },
  { id: 'acct-meridian-dubai', label: 'BankAccount', properties: { accountNumber: 'MER-DXB-2209', jurisdiction: 'UAE', riskScore: 87 } },
  { id: 'acct-bluewave-sg', label: 'BankAccount', properties: { accountNumber: 'BLW-SG-7190', jurisdiction: 'Singapore', riskScore: 85 } },
  { id: 'acct-silverline-bvi', label: 'BankAccount', properties: { accountNumber: 'SLV-BVI-1048', jurisdiction: 'BVI', riskScore: 92 } },
  { id: 'sanction-volkov', label: 'SanctionList', properties: { name: 'Viktor Volkov', list: 'International Watchlist', sanctioned: true, riskScore: 100 } },
];

export const demoRelationships = [
  { id: 'rel-own-1', type: 'OWNS', startNode: 'person-elena-rostova', endNode: 'comp-aethelgard-cap', properties: { percentage: 80 } },
  { id: 'rel-own-2', type: 'OWNS', startNode: 'comp-aethelgard-cap', endNode: 'comp-albion-prime', properties: { percentage: 75 } },
  { id: 'rel-own-3', type: 'OWNS', startNode: 'comp-albion-prime', endNode: 'comp-kensington-sovereign', properties: { percentage: 65 } },
  { id: 'rel-director-clean', type: 'DIRECTOR_OF', startNode: 'person-daniel-hart', endNode: 'comp-beacon-uk', properties: {} },
  { id: 'rel-subsidiary-clean', type: 'OWNS', startNode: 'comp-beacon-health-us', endNode: 'comp-beacon-uk', properties: { percentage: 100 } },
  { id: 'rel-nominee-1', type: 'DIRECTOR_OF', startNode: 'person-elena-rostova', endNode: 'comp-boreas-trading', properties: {} },
  { id: 'rel-nominee-2', type: 'DIRECTOR_OF', startNode: 'person-elena-rostova', endNode: 'comp-zephyr-capital', properties: {} },
  { id: 'rel-nominee-3', type: 'DIRECTOR_OF', startNode: 'person-elena-rostova', endNode: 'comp-nordic-silk', properties: {} },
  { id: 'rel-nominee-4', type: 'DIRECTOR_OF', startNode: 'person-elena-rostova', endNode: 'comp-pinnacle-crest', properties: {} },
  { id: 'rel-address-1', type: 'REGISTERED_AT', startNode: 'comp-boreas-trading', endNode: 'ident-mailbox-tortola', properties: {} },
  { id: 'rel-address-2', type: 'REGISTERED_AT', startNode: 'comp-zephyr-capital', endNode: 'ident-mailbox-tortola', properties: {} },
  { id: 'rel-address-3', type: 'REGISTERED_AT', startNode: 'comp-nordic-silk', endNode: 'ident-mailbox-tortola', properties: {} },
  { id: 'rel-address-4', type: 'REGISTERED_AT', startNode: 'comp-pinnacle-crest', endNode: 'ident-mailbox-tortola', properties: {} },
  { id: 'rel-risk-link', type: 'SUPPLIER_OF', startNode: 'comp-kensington-sovereign', endNode: 'comp-silverline-raw', properties: {} },
  { id: 'rel-sanction-link', type: 'CONTROLLED_BY', startNode: 'comp-silverline-raw', endNode: 'sanction-volkov', properties: {} },
  { id: 'rel-transfer-1', type: 'TRANSFERRED', startNode: 'acct-apex-zurich', endNode: 'acct-meridian-dubai', properties: { amount: 12800000, invoiceRef: 'INV-44018' } },
  { id: 'rel-transfer-2', type: 'TRANSFERRED', startNode: 'acct-meridian-dubai', endNode: 'acct-bluewave-sg', properties: { amount: 12500000, invoiceRef: 'CONS-8821' } },
  { id: 'rel-transfer-3', type: 'TRANSFERRED', startNode: 'acct-bluewave-sg', endNode: 'acct-silverline-bvi', properties: { amount: 12100000, invoiceRef: 'SHIP-1194' } },
  { id: 'rel-transfer-4', type: 'TRANSFERRED', startNode: 'acct-silverline-bvi', endNode: 'acct-apex-zurich', properties: { amount: 11800000, invoiceRef: 'ADV-7702' } },
];

const nodeById = new Map(demoNodes.map((node) => [node.id, node]));
const relationshipById = new Map(demoRelationships.map((relationship) => [relationship.id, relationship]));

const getNodes = (ids) => ids.map((id) => nodeById.get(id)).filter(Boolean);
const getRelationships = (ids) => ids.map((id) => relationshipById.get(id)).filter(Boolean);

export function getDemoStats() {
  return {
    totalNodes: demoNodes.length,
    totalRelationships: demoRelationships.length,
    highRiskEntities: demoNodes.filter((node) => (node.properties?.riskScore || 0) >= 80).length,
  };
}

export function searchDemoNodes(query) {
  const normalizedQuery = query.trim().toLowerCase();
  return demoNodes.filter((node) => JSON.stringify(node).toLowerCase().includes(normalizedQuery));
}

export function getDemoUBO(targetCompanyId = 'comp-kensington-sovereign') {
  if (targetCompanyId === 'comp-beacon-uk') return { results: [] };

  const chainIds = ['person-elena-rostova', 'comp-aethelgard-cap', 'comp-albion-prime', 'comp-kensington-sovereign'];
  const relationshipIds = ['rel-own-1', 'rel-own-2', 'rel-own-3'];
  const chain = getNodes(chainIds);

  return {
    results: [{
      ubo: chain[0],
      target: nodeById.get(targetCompanyId) || chain.at(-1),
      hopCount: relationshipIds.length,
      effectiveOwnershipPct: 39,
      chain,
      chainNames: chain.map((node) => node.properties.name),
      relationships: getRelationships(relationshipIds),
      stepPercentages: [80, 75, 65],
    }],
  };
}

export function getDemoCircularTransfers() {
  const transactionIds = ['rel-transfer-1', 'rel-transfer-2', 'rel-transfer-3', 'rel-transfer-4'];
  const transactions = getRelationships(transactionIds);
  return {
    loops: [{
      loopLength: transactions.length,
      totalVolume: transactions.reduce((total, transaction) => total + transaction.properties.amount, 0),
      involvedAccounts: getNodes(['acct-apex-zurich', 'acct-meridian-dubai', 'acct-bluewave-sg', 'acct-silverline-bvi']),
      transactions,
    }],
  };
}

export function getDemoSanctions(startEntityId = 'comp-kensington-sovereign') {
  const startNode = nodeById.get(startEntityId);
  if (!startNode || startEntityId.startsWith('comp-beacon')) return { paths: [] };

  const middleNode = nodeById.get('comp-silverline-raw');
  const sanctionNode = nodeById.get('sanction-volkov');
  const usesRiskLink = startEntityId === 'comp-kensington-sovereign';
  return {
    paths: [{
      distance: usesRiskLink ? 2 : 1,
      nodes: usesRiskLink ? [startNode, middleNode, sanctionNode] : [startNode, sanctionNode],
      relationships: usesRiskLink
        ? getRelationships(['rel-risk-link', 'rel-sanction-link'])
        : getRelationships(['rel-sanction-link']),
    }],
  };
}

export function getDemoNomineeClusters() {
  const companyIds = ['comp-boreas-trading', 'comp-zephyr-capital', 'comp-nordic-silk', 'comp-pinnacle-crest'];
  return {
    clusters: [{
      hub: nodeById.get('person-elena-rostova'),
      companyCount: companyIds.length,
      companies: getNodes(companyIds),
    }, {
      hub: nodeById.get('ident-mailbox-tortola'),
      companyCount: companyIds.length,
      companies: getNodes(companyIds),
    }],
  };
}

export function getDemoNeighborhood(nodeId) {
  const relationships = demoRelationships.filter((relationship) => relationship.startNode === nodeId || relationship.endNode === nodeId);
  const connectedIds = new Set([nodeId]);
  relationships.forEach((relationship) => {
    connectedIds.add(relationship.startNode);
    connectedIds.add(relationship.endNode);
  });
  return { nodes: getNodes([...connectedIds]), relationships };
}
