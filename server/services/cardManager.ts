import { randomInt } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { EventGenerator } from './eventGenerator'
import { CorporateActionGenerator } from './corporateActionGenerator'
import { CARDS_PER_PLAYER, CORPORATE_ACTION_PERCENTAGE } from '../constants'
import { Errors } from '../errors'

export class CardManager {
  private eventGenerator: EventGenerator
  private corporateActionGenerator: CorporateActionGenerator

  constructor(private prisma: PrismaClient) {
    this.eventGenerator = new EventGenerator()
    this.corporateActionGenerator = new CorporateActionGenerator()
  }

  /**
   * Generate cards for all players for the current round
   */
  async generateCardsForRound(gameId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true, stocks: true },
    })

    if (!game) throw Errors.gameNotFound(gameId)

    for (const player of game.players) {
      // Calculate split: 1 corporate action, 9 events for 10 cards
      const numCorporateActions = Math.floor(CARDS_PER_PLAYER * CORPORATE_ACTION_PERCENTAGE)
      const numEvents = CARDS_PER_PLAYER - numCorporateActions

      // Create array of card types and shuffle
      const cardTypes: ('event' | 'corporate_action')[] = [
        ...Array(numEvents).fill('event'),
        ...Array(numCorporateActions).fill('corporate_action'),
      ]

      // Shuffle card types using Fisher-Yates algorithm
      for (let i = cardTypes.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[cardTypes[i], cardTypes[j]] = [cardTypes[j], cardTypes[i]]
      }

      // Generate cards based on shuffled types
      for (let i = 0; i < CARDS_PER_PLAYER; i++) {
        const cardType = cardTypes[i]

        if (cardType === 'event') {
          // Generate event card
          const event = this.eventGenerator.getRandomEvent(game.currentRound)
          await this.prisma.marketEvent.create({
            data: {
              eventId: event.id,
              type: event.type,
              severity: event.severity,
              title: event.title,
              description: event.description,
              affectedStocks: JSON.stringify(event.affectedStocks),
              impact: event.impact,
              round: game.currentRound,
              playerId: player.id,
              gameId,
            },
          })
        } else {
          // Generate corporate action card (always returns a valid action now)
          const corporateAction = this.corporateActionGenerator.generateCorporateAction(
            game.currentRound,
            i
          )

          await this.prisma.corporateAction.create({
            data: {
              actionId: corporateAction.id,
              type: corporateAction.type,
              title: corporateAction.title,
              description: corporateAction.description,
              details: JSON.stringify(corporateAction.details),
              round: game.currentRound,
              playersProcessed: JSON.stringify([]),
              playerId: player.id,
              played: false,
              gameId,
            },
          })
        }
      }
    }
  }
}
