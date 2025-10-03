import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { EventSystem } from '../utils/events'
import { CorporateActionManager } from '../utils/corporateActions'
import { CARDS_PER_PLAYER, CORPORATE_ACTION_PERCENTAGE } from '../constants'

export class CardManager {
  private eventSystem: EventSystem
  private corporateActionManager: CorporateActionManager

  constructor(private prisma: PrismaClient) {
    this.eventSystem = new EventSystem()
    this.corporateActionManager = new CorporateActionManager()
  }

  /**
   * Generate cards for all players for the current round
   */
  async generateCardsForRound(gameId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true, stocks: true },
    })

    if (!game) throw new Error('Game not found')

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
        const j = Math.floor(Math.random() * (i + 1))
        ;[cardTypes[i], cardTypes[j]] = [cardTypes[j], cardTypes[i]]
      }

      // Generate cards based on shuffled types
      for (let turnIndex = 0; turnIndex < CARDS_PER_PLAYER; turnIndex++) {
        const cardType = cardTypes[turnIndex]

        if (cardType === 'event') {
          // Generate event card
          const event = this.eventSystem.getRandomEvent(game.currentRound)
          const createdEvent = await this.prisma.marketEvent.create({
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

          await this.prisma.gameCard.create({
            data: {
              cardId: nanoid(),
              type: 'event',
              dataType: 'MarketEvent',
              dataId: createdEvent.id,
              eventId: createdEvent.id,
              playerId: player.id,
              round: game.currentRound,
              turnIndex,
              gameId,
            },
          })
        } else {
          // Generate corporate action card (always returns a valid action now)
          const corporateAction = this.corporateActionManager.generateCorporateAction(
            game.currentRound,
            turnIndex
          )

          const createdAction = await this.prisma.corporateAction.create({
            data: {
              actionId: corporateAction.id,
              type: corporateAction.type,
              title: corporateAction.title,
              description: corporateAction.description,
              details: JSON.stringify(corporateAction.details),
              round: game.currentRound,
              createdAtTurn: turnIndex,
              playersProcessed: JSON.stringify([]),
              playerId: player.id,
              played: false,
              gameId,
            },
          })

          await this.prisma.gameCard.create({
            data: {
              cardId: nanoid(),
              type: 'corporate_action',
              dataType: 'CorporateAction',
              dataId: createdAction.id,
              corporateActionId: createdAction.id,
              playerId: player.id,
              round: game.currentRound,
              turnIndex,
              gameId,
            },
          })
        }
      }
    }
  }
}
