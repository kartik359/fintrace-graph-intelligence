/**
 * Realistic Graph Dataset for FinTrace Graph Intelligence
 * 
 * Modeled for Real-World AML, Sanction Forensics, and Ultimate Beneficial Ownership (UBO) discovery.
 * 
 * Contains 4 Interconnected Scenarios:
 * 1. The Matryoshka Offshore Holding Pyramid (Multi-Hop 6-level indirect ownership hiding a sanctioned oligarch)
 * 2. The Smurfing & Circular Wash-Trading Ring (4-hop circular SWIFT fund routing loop)
 * 3. The Nominee Director & Mailbox Farm (Shared nominee & shell company farm in Tortola BVI)
 * 4. Legitimate Commercial Entity (Clean benchmark for contrast)
 */

export const dataset = {
  nodes: [
    // ==========================================
    // SCENARIO 1: The Matryoshka Pyramid
    // ==========================================
    {
      id: 'person-volkov',
      label: 'Person',
      properties: {
        id: 'person-volkov',
        name: 'Viktor Volkov',
        nationality: 'Russian / Cypriot',
        dateOfBirth: '1968-04-12',
        role: 'Oligarch & Industrialist',
        riskLevel: 'CRITICAL',
        riskScore: 98,
        isPEP: true,
        sanctioned: true,
        tags: ['PEP', 'Sanctioned', 'Oligarch', 'Metals & Mining']
      }
    },
    {
      id: 'comp-volkov-alpha',
      label: 'Company',
      properties: {
        id: 'comp-volkov-alpha',
        name: 'Volkov Alpha Holdings LLC',
        jurisdiction: 'Seychelles',
        incorporationDate: '2015-06-18',
        entityType: 'Holding Company',
        taxId: 'SC-982141',
        riskLevel: 'HIGH',
        riskScore: 88,
        tags: ['Offshore Shell', 'Layer 1']
      }
    },
    {
      id: 'comp-cyprus-maritime',
      label: 'Company',
      properties: {
        id: 'comp-cyprus-maritime',
        name: 'Cyprus Maritime Ventures Ltd',
        jurisdiction: 'Cyprus',
        incorporationDate: '2016-11-04',
        entityType: 'Special Purpose Vehicle (SPV)',
        taxId: 'CY-10492834K',
        riskLevel: 'HIGH',
        riskScore: 82,
        tags: ['Offshore Shell', 'Layer 2']
      }
    },
    {
      id: 'comp-cayman-intermed',
      label: 'Company',
      properties: {
        id: 'comp-cayman-intermed',
        name: 'Cayman Island Intermediary Corp',
        jurisdiction: 'Cayman Islands',
        incorporationDate: '2018-02-22',
        entityType: 'Holding Trust',
        taxId: 'KY-883921',
        riskLevel: 'HIGH',
        riskScore: 79,
        tags: ['Offshore Trust', 'Layer 3']
      }
    },
    {
      id: 'comp-aethelgard-cap',
      label: 'Company',
      properties: {
        id: 'comp-aethelgard-cap',
        name: 'Aethelgard Capital Management Ltd',
        jurisdiction: 'Jersey (Channel Islands)',
        incorporationDate: '2019-08-14',
        entityType: 'Asset Management Entity',
        taxId: 'JE-449102',
        riskLevel: 'MEDIUM',
        riskScore: 68,
        tags: ['Asset Manager', 'Layer 4']
      }
    },
    {
      id: 'comp-albion-prime',
      label: 'Company',
      properties: {
        id: 'comp-albion-prime',
        name: 'Albion Prime Real Estate Ltd',
        jurisdiction: 'United Kingdom',
        incorporationDate: '2020-03-10',
        entityType: 'Commercial Real Estate',
        taxId: 'UK-09948217',
        riskLevel: 'HIGH',
        riskScore: 74,
        tags: ['Operating Company', 'UK Target', 'Layer 5']
      }
    },
    {
      id: 'comp-kensington-sovereign',
      label: 'Company',
      properties: {
        id: 'comp-kensington-sovereign',
        name: 'Kensington Sovereign Properties Ltd',
        jurisdiction: 'United Kingdom',
        incorporationDate: '2021-09-01',
        entityType: 'Luxury Property Asset',
        taxId: 'UK-12849203',
        riskLevel: 'HIGH',
        riskScore: 85,
        tags: ['Luxury Asset', 'High Value Target', 'Layer 6']
      }
    },
    {
      id: 'sanction-ofac-sdn',
      label: 'SanctionList',
      properties: {
        id: 'sanction-ofac-sdn',
        name: 'OFAC Specially Designated Nationals (SDN)',
        authority: 'US Department of the Treasury',
        jurisdiction: 'United States',
        program: 'RUSSIA-EO14024',
        datePublished: '2022-03-15',
        riskLevel: 'CRITICAL',
        riskScore: 100
      }
    },
    {
      id: 'sanction-eu-freeze',
      label: 'SanctionList',
      properties: {
        id: 'sanction-eu-freeze',
        name: 'EU Consolidated Sanctions List',
        authority: 'European Union External Action',
        jurisdiction: 'European Union',
        program: 'REG-269-2014',
        datePublished: '2022-04-08',
        riskLevel: 'CRITICAL',
        riskScore: 100
      }
    },

    // ==========================================
    // SCENARIO 2: Circular Wash-Trading Ring
    // ==========================================
    {
      id: 'comp-apex-trading',
      label: 'Company',
      properties: {
        id: 'comp-apex-trading',
        name: 'Apex Global Commodity Trading AG',
        jurisdiction: 'Switzerland',
        incorporationDate: '2017-05-12',
        entityType: 'Commodity Trading Firm',
        taxId: 'CHE-119.482.912',
        riskLevel: 'HIGH',
        riskScore: 84,
        tags: ['Wash Trading Ring', 'Origin & Sink']
      }
    },
    {
      id: 'comp-meridian-logistics',
      label: 'Company',
      properties: {
        id: 'comp-meridian-logistics',
        name: 'Meridian Oil & Gas Logistics FZE',
        jurisdiction: 'United Arab Emirates (Dubai)',
        incorporationDate: '2019-01-20',
        entityType: 'Free Zone Entity',
        taxId: 'UAE-FZ-84920',
        riskLevel: 'HIGH',
        riskScore: 81,
        tags: ['Wash Trading Ring', 'Hop 1']
      }
    },
    {
      id: 'comp-bluewave-marine',
      label: 'Company',
      properties: {
        id: 'comp-bluewave-marine',
        name: 'BlueWave Marine Charter Ltd',
        jurisdiction: 'Singapore',
        incorporationDate: '2020-07-15',
        entityType: 'Maritime Freight',
        taxId: 'SG-202019482C',
        riskLevel: 'HIGH',
        riskScore: 78,
        tags: ['Wash Trading Ring', 'Hop 2']
      }
    },
    {
      id: 'comp-silverline-raw',
      label: 'Company',
      properties: {
        id: 'comp-silverline-raw',
        name: 'SilverLine Raw Materials Corp',
        jurisdiction: 'British Virgin Islands',
        incorporationDate: '2021-04-03',
        entityType: 'Offshore Trading LLC',
        taxId: 'BVI-8849210',
        riskLevel: 'HIGH',
        riskScore: 86,
        tags: ['Wash Trading Ring', 'Hop 3']
      }
    },
    // Bank Accounts for Circular Ring
    {
      id: 'acct-apex-zurich',
      label: 'BankAccount',
      properties: {
        id: 'acct-apex-zurich',
        accountNumber: 'CH93000000192837465',
        bankName: 'Banque Privée Zurich',
        swiftBic: 'BPZUCHZZXXX',
        jurisdiction: 'Switzerland',
        currency: 'USD',
        balance: 14250000,
        riskLevel: 'HIGH',
        riskScore: 80
      }
    },
    {
      id: 'acct-meridian-dubai',
      label: 'BankAccount',
      properties: {
        id: 'acct-meridian-dubai',
        accountNumber: 'AE0703300000182736451',
        bankName: 'Emirates Gulf International Bank',
        swiftBic: 'EGIBDDAEXXX',
        jurisdiction: 'UAE',
        currency: 'USD',
        balance: 8900000,
        riskLevel: 'HIGH',
        riskScore: 79
      }
    },
    {
      id: 'acct-bluewave-sg',
      label: 'BankAccount',
      properties: {
        id: 'acct-bluewave-sg',
        accountNumber: 'SG4400019283746501',
        bankName: 'Overseas Mercantile Bank Singapore',
        swiftBic: 'OMBSGSG2XXX',
        jurisdiction: 'Singapore',
        currency: 'USD',
        balance: 6720000,
        riskLevel: 'HIGH',
        riskScore: 76
      }
    },
    {
      id: 'acct-silverline-bvi',
      label: 'BankAccount',
      properties: {
        id: 'acct-silverline-bvi',
        accountNumber: 'VG8900192837465019',
        bankName: 'Caribbean Trust Commercial Bank',
        swiftBic: 'CTCBVGTXXXX',
        jurisdiction: 'British Virgin Islands',
        currency: 'USD',
        balance: 5120000,
        riskLevel: 'HIGH',
        riskScore: 83
      }
    },

    // ==========================================
    // SCENARIO 3: Nominee Director & Mailbox Farm
    // ==========================================
    {
      id: 'person-elena-rostova',
      label: 'Person',
      properties: {
        id: 'person-elena-rostova',
        name: 'Elena Rostova',
        nationality: 'Cypriot',
        dateOfBirth: '1975-09-28',
        role: 'Professional Nominee Director',
        riskLevel: 'HIGH',
        riskScore: 89,
        isPEP: false,
        isNominee: true,
        tags: ['Nominee Director', 'Strawman', 'Shell Farm Hub']
      }
    },
    {
      id: 'ident-mailbox-tortola',
      label: 'SharedIdentifier',
      properties: {
        id: 'ident-mailbox-tortola',
        identifierType: 'PHYSICAL_ADDRESS',
        value: 'Suite 402, Quijano Chambers, PO Box 3152, Road Town, Tortola, BVI',
        jurisdiction: 'British Virgin Islands',
        isKnownShellMailbox: true,
        riskLevel: 'CRITICAL',
        riskScore: 95,
        tags: ['Shared Mailbox', 'Mass Registration Hub']
      }
    },
    {
      id: 'ident-phone-cyprus',
      label: 'SharedIdentifier',
      properties: {
        id: 'ident-phone-cyprus',
        identifierType: 'PHONE_NUMBER',
        value: '+357 25 891044',
        jurisdiction: 'Cyprus',
        isVirtualVoIP: true,
        riskLevel: 'HIGH',
        riskScore: 80,
        tags: ['Virtual VoIP', 'Shared Telecom']
      }
    },
    {
      id: 'comp-boreas-trading',
      label: 'Company',
      properties: {
        id: 'comp-boreas-trading',
        name: 'Boreas Global Trading Inc',
        jurisdiction: 'British Virgin Islands',
        incorporationDate: '2020-01-10',
        entityType: 'Shell Corporation',
        taxId: 'BVI-771829',
        riskLevel: 'HIGH',
        riskScore: 87,
        tags: ['Nominee Shell Farm']
      }
    },
    {
      id: 'comp-zephyr-capital',
      label: 'Company',
      properties: {
        id: 'comp-zephyr-capital',
        name: 'Zephyr Capital Ltd',
        jurisdiction: 'British Virgin Islands',
        incorporationDate: '2020-01-10',
        entityType: 'Shell Corporation',
        taxId: 'BVI-771830',
        riskLevel: 'HIGH',
        riskScore: 87,
        tags: ['Nominee Shell Farm']
      }
    },
    {
      id: 'comp-nordic-silk',
      label: 'Company',
      properties: {
        id: 'comp-nordic-silk',
        name: 'Nordic Silk Road Ltd',
        jurisdiction: 'British Virgin Islands',
        incorporationDate: '2020-02-14',
        entityType: 'Shell Corporation',
        taxId: 'BVI-771944',
        riskLevel: 'HIGH',
        riskScore: 85,
        tags: ['Nominee Shell Farm']
      }
    },
    {
      id: 'comp-vanguard-horizon',
      label: 'Company',
      properties: {
        id: 'comp-vanguard-horizon',
        name: 'Vanguard Horizon LLC',
        jurisdiction: 'Nevada, USA',
        incorporationDate: '2020-05-18',
        entityType: 'Anonymous LLC',
        taxId: 'NV-2020-8472',
        riskLevel: 'HIGH',
        riskScore: 83,
        tags: ['Nominee Shell Farm']
      }
    },
    {
      id: 'comp-pinnacle-crest',
      label: 'Company',
      properties: {
        id: 'comp-pinnacle-crest',
        name: 'Pinnacle Crest Partners SA',
        jurisdiction: 'Panama',
        incorporationDate: '2020-08-01',
        entityType: 'Sociedad Anónima',
        taxId: 'PAN-994820-1',
        riskLevel: 'HIGH',
        riskScore: 86,
        tags: ['Nominee Shell Farm']
      }
    },
    {
      id: 'comp-aura-tech',
      label: 'Company',
      properties: {
        id: 'comp-aura-tech',
        name: 'Aura Tech Ventures Ltd',
        jurisdiction: 'Belize',
        incorporationDate: '2021-01-19',
        entityType: 'International Business Company (IBC)',
        taxId: 'BZ-44821',
        riskLevel: 'HIGH',
        riskScore: 84,
        tags: ['Nominee Shell Farm']
      }
    },

    // ==========================================
    // SCENARIO 4: Legitimate Corporate Enterprise (Clean Baseline)
    // ==========================================
    {
      id: 'person-sarah-jenkins',
      label: 'Person',
      properties: {
        id: 'person-sarah-jenkins',
        name: 'Dr. Sarah Jenkins',
        nationality: 'American',
        dateOfBirth: '1982-11-14',
        role: 'Founder & CEO',
        riskLevel: 'LOW',
        riskScore: 5,
        isPEP: false,
        isNominee: false,
        tags: ['Verified KYC', 'Clean UBO']
      }
    },
    {
      id: 'person-david-miller',
      label: 'Person',
      properties: {
        id: 'person-david-miller',
        name: 'David Miller',
        nationality: 'British',
        dateOfBirth: '1979-03-25',
        role: 'Co-Founder & CTO',
        riskLevel: 'LOW',
        riskScore: 8,
        isPEP: false,
        isNominee: false,
        tags: ['Verified KYC']
      }
    },
    {
      id: 'comp-beacon-health-us',
      label: 'Company',
      properties: {
        id: 'comp-beacon-health-us',
        name: 'Beacon Health Technologies Inc',
        jurisdiction: 'Delaware, USA',
        incorporationDate: '2017-03-22',
        entityType: 'C-Corporation',
        taxId: 'US-EIN-82-9482710',
        riskLevel: 'LOW',
        riskScore: 12,
        tags: ['Clean Benchmark', 'Healthcare SaaS']
      }
    },
    {
      id: 'comp-beacon-uk',
      label: 'Company',
      properties: {
        id: 'comp-beacon-uk',
        name: 'Beacon UK Diagnostics Ltd',
        jurisdiction: 'United Kingdom',
        incorporationDate: '2019-06-11',
        entityType: 'Operating Subsidiary',
        taxId: 'UK-08492019',
        riskLevel: 'LOW',
        riskScore: 10,
        tags: ['Clean Subsidiary']
      }
    },
    {
      id: 'acct-beacon-chase',
      label: 'BankAccount',
      properties: {
        id: 'acct-beacon-chase',
        accountNumber: 'US4400018273645019',
        bankName: 'JPMorgan Chase New York',
        swiftBic: 'CHASUS33XXX',
        jurisdiction: 'United States',
        currency: 'USD',
        balance: 18500000,
        riskLevel: 'LOW',
        riskScore: 8
      }
    }
  ],

  relationships: [
    // ==========================================
    // SCENARIO 1 RELATIONSHIPS (Pyramid & Sanction)
    // ==========================================
    {
      id: 'rel-volkov-sanction-ofac',
      type: 'LISTED_ON',
      startNode: 'person-volkov',
      endNode: 'sanction-ofac-sdn',
      properties: {
        listType: 'OFAC Specially Designated Nationals',
        reason: 'Significant Russian Oligarch providing material support to defense sector',
        dateListed: '2022-03-15',
        legalBasis: 'Executive Order 14024'
      }
    },
    {
      id: 'rel-volkov-sanction-eu',
      type: 'LISTED_ON',
      startNode: 'person-volkov',
      endNode: 'sanction-eu-freeze',
      properties: {
        listType: 'EU Asset Freeze List',
        reason: 'Leading businessperson involved in economic sectors providing substantial revenue',
        dateListed: '2022-04-08',
        legalBasis: 'EU Regulation 269/2014'
      }
    },
    // Direct Ownership Hop 1: Volkov -> Seychelles LLC (100%)
    {
      id: 'rel-own-volkov-alpha',
      type: 'OWNS',
      startNode: 'person-volkov',
      endNode: 'comp-volkov-alpha',
      properties: {
        percentage: 100.0,
        shareClass: 'Ordinary A Shares',
        since: '2015-06-18',
        votingRights: 100.0
      }
    },
    {
      id: 'rel-dir-volkov-alpha',
      type: 'SERVES_AS',
      startNode: 'person-volkov',
      endNode: 'comp-volkov-alpha',
      properties: {
        role: 'Sole Managing Director',
        appointed: '2015-06-18'
      }
    },
    // Ownership Hop 2: Seychelles LLC -> Cyprus Maritime (75%)
    {
      id: 'rel-own-alpha-cyprus',
      type: 'OWNS',
      startNode: 'comp-volkov-alpha',
      endNode: 'comp-cyprus-maritime',
      properties: {
        percentage: 75.0,
        shareClass: 'Class A Capital Shares',
        since: '2016-11-04',
        votingRights: 75.0
      }
    },
    // Ownership Hop 3: Cyprus Maritime -> Cayman Intermediary (80%)
    {
      id: 'rel-own-cyprus-cayman',
      type: 'OWNS',
      startNode: 'comp-cyprus-maritime',
      endNode: 'comp-cayman-intermed',
      properties: {
        percentage: 80.0,
        shareClass: 'Ordinary Equity',
        since: '2018-02-22',
        votingRights: 80.0
      }
    },
    // Ownership Hop 4: Cayman Intermediary -> Aethelgard Jersey (65%)
    {
      id: 'rel-own-cayman-aethelgard',
      type: 'OWNS',
      startNode: 'comp-cayman-intermed',
      endNode: 'comp-aethelgard-cap',
      properties: {
        percentage: 65.0,
        shareClass: 'Controlling Common Units',
        since: '2019-08-14',
        votingRights: 65.0
      }
    },
    // Ownership Hop 5: Aethelgard Jersey -> Albion Prime UK (90%)
    {
      id: 'rel-own-aethelgard-albion',
      type: 'OWNS',
      startNode: 'comp-aethelgard-cap',
      endNode: 'comp-albion-prime',
      properties: {
        percentage: 90.0,
        shareClass: 'Voting Shares',
        since: '2020-03-10',
        votingRights: 90.0
      }
    },
    // Ownership Hop 6: Albion Prime UK -> Kensington Sovereign (100%)
    {
      id: 'rel-own-albion-kensington',
      type: 'OWNS',
      startNode: 'comp-albion-prime',
      endNode: 'comp-kensington-sovereign',
      properties: {
        percentage: 100.0,
        shareClass: 'Ordinary 100%',
        since: '2021-09-01',
        votingRights: 100.0
      }
    },

    // ==========================================
    // SCENARIO 2 RELATIONSHIPS (Circular Wash-Trading Ring)
    // ==========================================
    {
      id: 'rel-hold-apex-acct',
      type: 'HOLDS_ACCOUNT',
      startNode: 'comp-apex-trading',
      endNode: 'acct-apex-zurich',
      properties: { openedDate: '2017-06-01', authorizedSignatory: 'Hans Gruber' }
    },
    {
      id: 'rel-hold-meridian-acct',
      type: 'HOLDS_ACCOUNT',
      startNode: 'comp-meridian-logistics',
      endNode: 'acct-meridian-dubai',
      properties: { openedDate: '2019-02-10', authorizedSignatory: 'Tariq Al-Mansoor' }
    },
    {
      id: 'rel-hold-bluewave-acct',
      type: 'HOLDS_ACCOUNT',
      startNode: 'comp-bluewave-marine',
      endNode: 'acct-bluewave-sg',
      properties: { openedDate: '2020-08-01', authorizedSignatory: 'Kenji Sato' }
    },
    {
      id: 'rel-hold-silverline-acct',
      type: 'HOLDS_ACCOUNT',
      startNode: 'comp-silverline-raw',
      endNode: 'acct-silverline-bvi',
      properties: { openedDate: '2021-04-15', authorizedSignatory: 'Elena Rostova' }
    },
    // The Circular Money Laundering / Wash-Trading Transfers
    // Transfer 1: Apex Zurich -> Meridian Dubai ($2,450,000)
    {
      id: 'rel-tx-apex-meridian',
      type: 'TRANSFERRED',
      startNode: 'acct-apex-zurich',
      endNode: 'acct-meridian-dubai',
      properties: {
        amount: 2450000,
        currency: 'USD',
        date: '2024-03-12T09:14:22Z',
        txHash: 'SWIFT-MT103-8849102482-A',
        invoiceRef: 'INV-CRUDE-8891',
        flagged: true,
        riskDescription: 'High-value round dollar amount to Free Zone entity'
      }
    },
    // Transfer 2: Meridian Dubai -> BlueWave Singapore ($2,380,000)
    {
      id: 'rel-tx-meridian-bluewave',
      type: 'TRANSFERRED',
      startNode: 'acct-meridian-dubai',
      endNode: 'acct-bluewave-sg',
      properties: {
        amount: 2380000,
        currency: 'USD',
        date: '2024-03-13T11:42:05Z',
        txHash: 'SWIFT-MT103-9938102471-B',
        invoiceRef: 'INV-CHARTER-9921',
        flagged: true,
        riskDescription: 'Rapid pass-through of funds within 26 hours (Smurfing fee deducted)'
      }
    },
    // Transfer 3: BlueWave Singapore -> SilverLine BVI ($2,310,000)
    {
      id: 'rel-tx-bluewave-silverline',
      type: 'TRANSFERRED',
      startNode: 'acct-bluewave-sg',
      endNode: 'acct-silverline-bvi',
      properties: {
        amount: 2310000,
        currency: 'USD',
        date: '2024-03-14T14:08:50Z',
        txHash: 'SWIFT-MT103-7729103841-C',
        invoiceRef: 'INV-FREIGHT-3341',
        flagged: true,
        riskDescription: 'Offshore pass-through transfer to high-risk secrecy jurisdiction'
      }
    },
    // Transfer 4: SilverLine BVI -> Apex Zurich ($2,250,000) [CLOSING THE LOOP]
    {
      id: 'rel-tx-silverline-apex',
      type: 'TRANSFERRED',
      startNode: 'acct-silverline-bvi',
      endNode: 'acct-apex-zurich',
      properties: {
        amount: 2250000,
        currency: 'USD',
        date: '2024-03-15T16:30:11Z',
        txHash: 'SWIFT-MT103-4419203819-D',
        invoiceRef: 'INV-CONSULTING-001',
        flagged: true,
        riskDescription: 'Circular loop closure: funds returned to origin entity within 72 hours'
      }
    },

    // ==========================================
    // SCENARIO 3 RELATIONSHIPS (Nominee Farm & Mailbox Hub)
    // ==========================================
    // Elena Rostova serves as Nominee Director for multiple shell companies
    {
      id: 'rel-dir-elena-boreas',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-boreas-trading',
      properties: { role: 'Nominee Director', appointed: '2020-01-10', feePerAnnum: 4500 }
    },
    {
      id: 'rel-dir-elena-zephyr',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-zephyr-capital',
      properties: { role: 'Nominee Director', appointed: '2020-01-10', feePerAnnum: 4500 }
    },
    {
      id: 'rel-dir-elena-nordic',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-nordic-silk',
      properties: { role: 'Nominee Director', appointed: '2020-02-14', feePerAnnum: 5000 }
    },
    {
      id: 'rel-dir-elena-vanguard',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-vanguard-horizon',
      properties: { role: 'Nominee Director', appointed: '2020-05-18', feePerAnnum: 6000 }
    },
    {
      id: 'rel-dir-elena-pinnacle',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-pinnacle-crest',
      properties: { role: 'Nominee Director', appointed: '2020-08-01', feePerAnnum: 5500 }
    },
    {
      id: 'rel-dir-elena-aura',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-aura-tech',
      properties: { role: 'Nominee Director', appointed: '2021-01-19', feePerAnnum: 4800 }
    },
    {
      id: 'rel-dir-elena-silverline',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-silverline-raw',
      properties: { role: 'Nominee Director', appointed: '2021-04-03', feePerAnnum: 7500 }
    },

    // Mass Shared Address Hub (Tortola Mailbox)
    {
      id: 'rel-addr-boreas',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-boreas-trading',
      endNode: 'ident-mailbox-tortola',
      properties: { associationType: 'REGISTERED_OFFICE' }
    },
    {
      id: 'rel-addr-zephyr',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-zephyr-capital',
      endNode: 'ident-mailbox-tortola',
      properties: { associationType: 'REGISTERED_OFFICE' }
    },
    {
      id: 'rel-addr-nordic',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-nordic-silk',
      endNode: 'ident-mailbox-tortola',
      properties: { associationType: 'REGISTERED_OFFICE' }
    },
    {
      id: 'rel-addr-pinnacle',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-pinnacle-crest',
      endNode: 'ident-mailbox-tortola',
      properties: { associationType: 'REGISTERED_AGENT_ADDRESS' }
    },
    {
      id: 'rel-addr-silverline',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-silverline-raw',
      endNode: 'ident-mailbox-tortola',
      properties: { associationType: 'REGISTERED_OFFICE' }
    },
    {
      id: 'rel-phone-elena',
      type: 'ASSOCIATED_WITH',
      startNode: 'person-elena-rostova',
      endNode: 'ident-phone-cyprus',
      properties: { associationType: 'PRIMARY_CONTACT_NUMBER' }
    },
    {
      id: 'rel-phone-boreas',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-boreas-trading',
      endNode: 'ident-phone-cyprus',
      properties: { associationType: 'CORPORATE_TELEPHONE' }
    },
    {
      id: 'rel-phone-nordic',
      type: 'ASSOCIATED_WITH',
      startNode: 'comp-nordic-silk',
      endNode: 'ident-phone-cyprus',
      properties: { associationType: 'CORPORATE_TELEPHONE' }
    },

    // Cross-link: Elena is also related to the Cyprus Maritime entity (serving as secretarial nominee)
    {
      id: 'rel-dir-elena-cyprus',
      type: 'SERVES_AS',
      startNode: 'person-elena-rostova',
      endNode: 'comp-cyprus-maritime',
      properties: { role: 'Corporate Secretary', appointed: '2016-11-04' }
    },

    // ==========================================
    // SCENARIO 4 RELATIONSHIPS (Clean Baseline)
    // ==========================================
    {
      id: 'rel-own-sarah-beacon',
      type: 'OWNS',
      startNode: 'person-sarah-jenkins',
      endNode: 'comp-beacon-health-us',
      properties: {
        percentage: 85.0,
        shareClass: 'Common Stock',
        since: '2017-03-22',
        votingRights: 85.0
      }
    },
    {
      id: 'rel-dir-sarah-beacon',
      type: 'SERVES_AS',
      startNode: 'person-sarah-jenkins',
      endNode: 'comp-beacon-health-us',
      properties: { role: 'Chief Executive Officer', appointed: '2017-03-22' }
    },
    {
      id: 'rel-own-david-beacon',
      type: 'OWNS',
      startNode: 'person-david-miller',
      endNode: 'comp-beacon-health-us',
      properties: {
        percentage: 15.0,
        shareClass: 'Common Stock',
        since: '2017-03-22',
        votingRights: 15.0
      }
    },
    {
      id: 'rel-own-beacon-us-uk',
      type: 'OWNS',
      startNode: 'comp-beacon-health-us',
      endNode: 'comp-beacon-uk',
      properties: {
        percentage: 100.0,
        shareClass: 'Ordinary Shares',
        since: '2019-06-11',
        votingRights: 100.0
      }
    },
    {
      id: 'rel-hold-beacon-acct',
      type: 'HOLDS_ACCOUNT',
      startNode: 'comp-beacon-health-us',
      endNode: 'acct-beacon-chase',
      properties: { openedDate: '2017-04-01', authorizedSignatory: 'Dr. Sarah Jenkins' }
    }
  ]
};
