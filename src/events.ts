import { MarketEvent } from './types'

export class EventSystem {
  private eventPool: MarketEvent[]
  private usedEventIds: Set<string>

  constructor() {
    this.eventPool = this.createEventPool()
    this.usedEventIds = new Set()
  }

  getMultipleEvents(currentRound: number, count: number = 3): MarketEvent[] {
    const events: MarketEvent[] = []
    for (let i = 0; i < count; i++) {
      const event = this.getRandomEvent(currentRound)
      if (event) {
        events.push(event)
      }
    }
    return events
  }

  private createEventPool(): MarketEvent[] {
    const events: Omit<MarketEvent, 'severity'>[] = [
      // ===== AUTOMOTIVE (Lowest Volatility) - 4 events, impacts: ±5, ±10 =====
      {
        id: 'auto-sales-uptick',
        type: 'positive',
        title: 'Auto Sales Increase',
        description: 'Vehicle sales show modest improvement',
        affectedSectors: ['Automotive'],
        impact: 5,
        round: 0,
      },
      {
        id: 'auto-inventory-buildup',
        type: 'negative',
        title: 'Auto Inventory Buildup',
        description: 'Excess inventory concerns weigh on automotive stocks',
        affectedSectors: ['Automotive'],
        impact: -5,
        round: 0,
      },
      {
        id: 'auto-recall',
        type: 'negative',
        title: 'Automotive Recall',
        description: 'Major safety recall impacts automotive industry',
        affectedSectors: ['Automotive'],
        impact: -10,
        round: 0,
      },
      {
        id: 'ev-sales-boost',
        type: 'positive',
        title: 'EV Sales Surge',
        description: 'Electric vehicle demand exceeds expectations',
        affectedSectors: ['Automotive'],
        impact: 10,
        round: 0,
      },
      // ===== ENERGY (Low-Medium Volatility) - 6 events, impacts: ±5, ±10, ±15 =====
      {
        id: 'energy-prices-stable',
        type: 'positive',
        title: 'Energy Prices Stabilize',
        description: 'Oil and gas prices find steady footing',
        affectedSectors: ['Energy'],
        impact: 5,
        round: 0,
      },
      {
        id: 'energy-demand-drop',
        type: 'negative',
        title: 'Energy Demand Softens',
        description: 'Lower than expected energy consumption reported',
        affectedSectors: ['Energy'],
        impact: -5,
        round: 0,
      },
      {
        id: 'renewable-competition',
        type: 'negative',
        title: 'Renewable Energy Competition',
        description: 'Fossil fuel demand concerns impact traditional energy',
        affectedSectors: ['Energy'],
        impact: -10,
        round: 0,
      },
      {
        id: 'opec-production-cut',
        type: 'positive',
        title: 'OPEC Cuts Production',
        description: 'Oil prices surge on supply reduction announcement',
        affectedSectors: ['Energy'],
        impact: 10,
        round: 0,
      },
      {
        id: 'oil-discovery',
        type: 'positive',
        title: 'New Oil Reserves Found',
        description: 'Major discovery increases energy sector optimism',
        affectedSectors: ['Energy'],
        impact: 15,
        round: 0,
      },
      {
        id: 'energy-crisis',
        type: 'negative',
        title: 'Energy Supply Crisis',
        description: 'Supply disruptions cause energy price volatility',
        affectedSectors: ['Energy'],
        impact: -15,
        round: 0,
      },
      // ===== CONSUMER (Medium Volatility) - 8 events, impacts: ±5, ±10, ±15, ±20 =====
      {
        id: 'consumer-confidence',
        type: 'positive',
        title: 'Consumer Confidence Up',
        description: 'Consumer sentiment improves slightly',
        affectedSectors: ['Consumer'],
        impact: 5,
        round: 0,
      },
      {
        id: 'retail-sales-weak',
        type: 'negative',
        title: 'Weak Retail Sales',
        description: 'Monthly retail figures disappoint investors',
        affectedSectors: ['Consumer'],
        impact: -5,
        round: 0,
      },
      {
        id: 'consumer-boom',
        type: 'positive',
        title: 'Consumer Spending Surge',
        description: 'Holiday season drives record consumer activity',
        affectedSectors: ['Consumer'],
        impact: 10,
        round: 0,
      },
      {
        id: 'consumer-debt-warning',
        type: 'negative',
        title: 'Consumer Debt Concerns',
        description: 'Rising household debt levels worry retail sector',
        affectedSectors: ['Consumer'],
        impact: -10,
        round: 0,
      },
      {
        id: 'e-commerce-growth',
        type: 'positive',
        title: 'E-commerce Explosion',
        description: 'Online retail sales hit all-time highs',
        affectedSectors: ['Consumer'],
        impact: 15,
        round: 0,
      },
      {
        id: 'supply-chain-crisis',
        type: 'negative',
        title: 'Supply Chain Disruption',
        description: 'Global shipping crisis impacts consumer goods',
        affectedSectors: ['Consumer'],
        impact: -15,
        round: 0,
      },
      {
        id: 'global-stimulus',
        type: 'positive',
        title: 'Massive Consumer Stimulus',
        description: 'Government stimulus packages boost consumer spending',
        affectedSectors: ['Consumer'],
        impact: 20,
        round: 0,
      },
      {
        id: 'recession-fears',
        type: 'negative',
        title: 'Recession Concerns',
        description: 'Economic downturn fears hit consumer discretionary spending',
        affectedSectors: ['Consumer'],
        impact: -20,
        round: 0,
      },
      // ===== HEALTHCARE (Medium-High Volatility) - 10 events, impacts: ±5, ±10, ±15, ±20 =====
      {
        id: 'health-research-funding',
        type: 'positive',
        title: 'Healthcare Funding Boost',
        description: 'Government increases medical research grants',
        affectedSectors: ['Healthcare'],
        impact: 5,
        round: 0,
      },
      {
        id: 'drug-trial-delay',
        type: 'negative',
        title: 'Drug Trial Delayed',
        description: 'Key pharmaceutical trials face setbacks',
        affectedSectors: ['Healthcare'],
        impact: -5,
        round: 0,
      },
      {
        id: 'fda-approvals',
        type: 'positive',
        title: 'Multiple FDA Approvals',
        description: 'Wave of new drug approvals boosts healthcare sector',
        affectedSectors: ['Healthcare'],
        impact: 10,
        round: 0,
      },
      {
        id: 'health-scandal',
        type: 'negative',
        title: 'Healthcare Scandal',
        description: 'Major pharmaceutical company faces legal troubles',
        affectedSectors: ['Healthcare'],
        impact: -10,
        round: 0,
      },
      {
        id: 'pandemic-fears',
        type: 'negative',
        title: 'Health Crisis Concerns',
        description: 'New disease outbreak causes healthcare uncertainty',
        affectedSectors: ['Healthcare'],
        impact: -10,
        round: 0,
      },
      {
        id: 'biotech-breakthrough',
        type: 'positive',
        title: 'Biotech Innovation',
        description: 'Breakthrough in gene therapy shows promise',
        affectedSectors: ['Healthcare'],
        impact: 15,
        round: 0,
      },
      {
        id: 'drug-pricing-pressure',
        type: 'negative',
        title: 'Drug Pricing Regulations',
        description: 'New regulations threaten pharmaceutical pricing power',
        affectedSectors: ['Healthcare'],
        impact: -15,
        round: 0,
      },
      {
        id: 'medical-breakthrough',
        type: 'positive',
        title: 'Medical Breakthrough',
        description: 'Revolutionary treatment approved, healthcare stocks soar',
        affectedSectors: ['Healthcare'],
        impact: 20,
        round: 0,
      },
      {
        id: 'healthcare-reform',
        type: 'negative',
        title: 'Healthcare Reform Bill',
        description: 'Major legislative changes threaten healthcare profits',
        affectedSectors: ['Healthcare'],
        impact: -20,
        round: 0,
      },
      {
        id: 'pandemic-solution',
        type: 'positive',
        title: 'Pandemic Solution',
        description: 'Effective vaccine rollout boosts healthcare optimism',
        affectedSectors: ['Healthcare'],
        impact: 20,
        round: 0,
      },
      // ===== TECHNOLOGY (High Volatility) - 12 events, impacts: ±5, ±10, ±15, ±20, ±25 =====
      {
        id: 'tech-earnings-beat',
        type: 'positive',
        title: 'Tech Earnings Beat',
        description: 'Major tech companies report strong quarterly results',
        affectedSectors: ['Technology'],
        impact: 5,
        round: 0,
      },
      {
        id: 'tech-bug-discovery',
        type: 'negative',
        title: 'Tech Bug Discovery',
        description: 'Software vulnerabilities found in major platforms',
        affectedSectors: ['Technology'],
        impact: -5,
        round: 0,
      },
      {
        id: 'tech-innovation',
        type: 'positive',
        title: 'Tech Innovation Wave',
        description: 'New product launches drive tech sector enthusiasm',
        affectedSectors: ['Technology'],
        impact: 10,
        round: 0,
      },
      {
        id: 'tech-antitrust',
        type: 'negative',
        title: 'Tech Antitrust Investigation',
        description: 'Major tech companies face antitrust scrutiny',
        affectedSectors: ['Technology'],
        impact: -10,
        round: 0,
      },
      {
        id: 'cloud-computing-boom',
        type: 'positive',
        title: 'Cloud Computing Surge',
        description: 'Enterprise cloud adoption accelerates dramatically',
        affectedSectors: ['Technology'],
        impact: 15,
        round: 0,
      },
      {
        id: 'chip-shortage',
        type: 'negative',
        title: 'Semiconductor Shortage',
        description: 'Chip supply issues impact tech production',
        affectedSectors: ['Technology'],
        impact: -15,
        round: 0,
      },
      {
        id: 'ai-revolution',
        type: 'positive',
        title: 'AI Revolution Accelerates',
        description: 'Artificial intelligence drives massive productivity gains',
        affectedSectors: ['Technology'],
        impact: 20,
        round: 0,
      },
      {
        id: 'cyber-attack-wave',
        type: 'negative',
        title: 'Major Cyber Attacks',
        description: 'Coordinated cyber attacks cripple tech infrastructure',
        affectedSectors: ['Technology'],
        impact: -20,
        round: 0,
      },
      {
        id: 'merger-mania',
        type: 'positive',
        title: 'Tech M&A Wave',
        description: 'Record merger activity drives tech valuations',
        affectedSectors: ['Technology'],
        impact: 20,
        round: 0,
      },
      {
        id: 'quantum-computing',
        type: 'positive',
        title: 'Quantum Computing Breakthrough',
        description: 'Major advancement in quantum computing revolutionizes tech',
        affectedSectors: ['Technology'],
        impact: 25,
        round: 0,
      },
      {
        id: 'tech-bubble-fears',
        type: 'negative',
        title: 'Tech Bubble Concerns',
        description: 'Overvaluation fears trigger tech sector selloff',
        affectedSectors: ['Technology'],
        impact: -25,
        round: 0,
      },
      {
        id: 'metaverse-boom',
        type: 'positive',
        title: 'Metaverse Explosion',
        description: 'Virtual reality adoption drives unprecedented tech growth',
        affectedSectors: ['Technology'],
        impact: 25,
        round: 0,
      },
      // ===== FINANCE (Highest Volatility) - 14 events, impacts: ±5, ±10, ±15, ±20, ±25, ±30 =====
      {
        id: 'bank-earnings-beat',
        type: 'positive',
        title: 'Banks Beat Earnings',
        description: 'Major banks report better than expected quarterly results',
        affectedSectors: ['Finance'],
        impact: 5,
        round: 0,
      },
      {
        id: 'bank-fees-increase',
        type: 'negative',
        title: 'Banking Fee Changes',
        description: 'New fee structure announced by banks',
        affectedSectors: ['Finance'],
        impact: -5,
        round: 0,
      },
      {
        id: 'fintech-disruption',
        type: 'positive',
        title: 'Fintech Innovation Wave',
        description: 'Digital banking solutions drive financial sector growth',
        affectedSectors: ['Finance'],
        impact: 10,
        round: 0,
      },
      {
        id: 'loan-defaults-rise',
        type: 'negative',
        title: 'Rising Loan Defaults',
        description: 'Increased default rates concern financial institutions',
        affectedSectors: ['Finance'],
        impact: -10,
        round: 0,
      },
      {
        id: 'bank-merger',
        type: 'positive',
        title: 'Major Bank Merger',
        description: 'Consolidation creates financial sector mega-institution',
        affectedSectors: ['Finance'],
        impact: 15,
        round: 0,
      },
      {
        id: 'credit-crunch',
        type: 'negative',
        title: 'Credit Crunch',
        description: 'Tightening lending standards impact financial sector',
        affectedSectors: ['Finance'],
        impact: -15,
        round: 0,
      },
      {
        id: 'interest-rate-cut',
        type: 'positive',
        title: 'Major Interest Rate Cut',
        description: 'Central bank announces aggressive rate cuts',
        affectedSectors: ['Finance'],
        impact: 20,
        round: 0,
      },
      {
        id: 'interest-rate-hike',
        type: 'negative',
        title: 'Aggressive Rate Hikes',
        description: 'Central bank raises rates to combat inflation',
        affectedSectors: ['Finance'],
        impact: -20,
        round: 0,
      },
      {
        id: 'banking-collapse',
        type: 'negative',
        title: 'Banking System Stress',
        description: 'Major bank failures trigger financial sector concerns',
        affectedSectors: ['Finance'],
        impact: -20,
        round: 0,
      },
      {
        id: 'deregulation-boost',
        type: 'positive',
        title: 'Financial Deregulation',
        description: 'Regulatory rollback boosts banking profitability',
        affectedSectors: ['Finance'],
        impact: 25,
        round: 0,
      },
      {
        id: 'financial-crisis-fears',
        type: 'negative',
        title: 'Financial Crisis Warning',
        description: 'Systemic risk indicators trigger market concerns',
        affectedSectors: ['Finance'],
        impact: -25,
        round: 0,
      },
      {
        id: 'crypto-adoption',
        type: 'positive',
        title: 'Cryptocurrency Mainstreaming',
        description: 'Major banks embrace crypto, driving financial innovation',
        affectedSectors: ['Finance'],
        impact: 25,
        round: 0,
      },
      {
        id: 'central-bank-crisis',
        type: 'negative',
        title: 'Central Bank Emergency',
        description: 'Emergency monetary measures signal deep financial stress',
        affectedSectors: ['Finance'],
        impact: -30,
        round: 0,
      },
      {
        id: 'financial-renaissance',
        type: 'positive',
        title: 'Financial System Overhaul',
        description: 'Comprehensive reforms unlock massive financial sector growth',
        affectedSectors: ['Finance'],
        impact: 30,
        round: 0,
      },
    ]

    // Compute severity for each event based on impact
    return events.map((event) => ({
      ...event,
      severity: this.computeSeverity(event.impact),
    }))
  }

  /**
   * Compute severity based on impact value
   * ±5 = low
   * ±10, ±15 = medium
   * ±20, ±25 = high
   * ±30 = extreme
   */
  private computeSeverity(impact: number): 'low' | 'medium' | 'high' | 'extreme' {
    const absImpact = Math.abs(impact)
    if (absImpact === 5) return 'low'
    if (absImpact === 10 || absImpact === 15) return 'medium'
    if (absImpact === 20 || absImpact === 25) return 'high'
    return 'extreme' // 30 or higher
  }

  getRandomEvent(currentRound: number): MarketEvent | null {
    // Check for crash or bull run first (rare events)
    const crashEvent = this.tryGenerateCrash(currentRound)
    if (crashEvent) return crashEvent
    const bullRunEvent = this.tryGenerateBullRun(currentRound)
    if (bullRunEvent) return bullRunEvent
    // 70% chance of a regular event occurring
    if (Math.random() > 0.7) {
      return null
    }
    const availableEvents = this.eventPool.filter((event) => !this.usedEventIds.has(event.id))
    if (availableEvents.length === 0) {
      this.usedEventIds.clear()
      return this.getRandomEvent(currentRound)
    }
    // Weight events by severity (lower severity more common)
    const weightedEvents: MarketEvent[] = []
    availableEvents.forEach((event) => {
      const weight = event.severity === 'low' ? 5 : event.severity === 'medium' ? 3 : 1
      for (let i = 0; i < weight; i++) {
        weightedEvents.push(event)
      }
    })

    const event = weightedEvents[Math.floor(Math.random() * weightedEvents.length)]
    this.usedEventIds.add(event.id)

    return {
      ...event,
      round: currentRound,
    }
  }

  private tryGenerateCrash(currentRound: number): MarketEvent | null {
    // Can't have crash in first 2 rounds
    if (currentRound <= 2) {
      return null
    }
    // 5% chance of market crash
    if (Math.random() > 0.05) {
      return null
    }
    // Pick a random sector for the crash
    const sectors = ['Technology', 'Finance', 'Energy', 'Healthcare', 'Consumer', 'Automotive']
    const crashSector = sectors[Math.floor(Math.random() * sectors.length)]
    return {
      id: `market-crash-${currentRound}`,
      type: 'crash',
      severity: 'extreme',
      title: `💥 ${crashSector.toUpperCase()} SECTOR CRASH!`,
      description: `Panic selling triggers massive collapse in ${crashSector} sector`,
      affectedSectors: [crashSector],
      impact: -35,
      round: currentRound,
    }
  }

  private tryGenerateBullRun(currentRound: number): MarketEvent | null {
    // Can't have bull run in first 2 rounds
    if (currentRound <= 2) {
      return null
    }
    // 5% chance of bull run
    if (Math.random() > 0.05) {
      return null
    }
    // Pick a random sector for the bull run
    const sectors = ['Technology', 'Finance', 'Energy', 'Healthcare', 'Consumer', 'Automotive']
    const bullSector = sectors[Math.floor(Math.random() * sectors.length)]
    return {
      id: `bull-run-${currentRound}`,
      type: 'bull_run',
      severity: 'extreme',
      title: `🚀 ${bullSector.toUpperCase()} BULL RUN!`,
      description: `Massive investor optimism drives unprecedented rally in ${bullSector} sector`,
      affectedSectors: [bullSector],
      impact: 35,
      round: currentRound,
    }
  }

  reset(): void {
    this.usedEventIds.clear()
  }
}
