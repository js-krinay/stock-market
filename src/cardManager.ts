import { GameCard, MarketEvent, CorporateAction, Stock, Player } from './types'
import { EventSystem } from './events'
import { CorporateActionManager } from './corporateActions'
import { nanoid } from 'nanoid'

export class CardManager {
  private eventSystem: EventSystem
  private corporateActionManager: CorporateActionManager

  constructor() {
    this.eventSystem = new EventSystem()
    this.corporateActionManager = new CorporateActionManager()
  }

  /**
   * Generate 10 cards per player for a round
   * Mix of events and corporate actions (roughly 90% events, 10% corporate actions)
   */
  generateCardsForRound(
    players: Player[],
    stocks: Stock[],
    round: number
  ): { [playerId: string]: GameCard[] } {
    const playerCards: { [playerId: string]: GameCard[] } = {}

    players.forEach((player) => {
      const cards: GameCard[] = []

      for (let turnIndex = 0; turnIndex < 10; turnIndex++) {
        // 90% chance of event, 10% chance of corporate action
        if (Math.random() < 0.9) {
          // Generate event card
          const event = this.eventSystem.getRandomEvent(round)
          event.playerId = player.id
          cards.push({
            id: nanoid(),
            type: 'event',
            data: event,
            playerId: player.id,
            round,
            turnIndex,
            shown: false,
          })
        } else {
          // Generate corporate action card
          const corporateAction = this.corporateActionManager.generateCorporateAction(
            stocks,
            round,
            turnIndex
          )
          if (corporateAction) {
            corporateAction.playerId = player.id
            corporateAction.played = false
            cards.push({
              id: nanoid(),
              type: 'corporate_action',
              data: corporateAction,
              playerId: player.id,
              round,
              turnIndex,
              shown: false,
            })
          } else {
            // If corporate action generation fails, use an event instead
            const event = this.eventSystem.getRandomEvent(round)
            event.playerId = player.id
            cards.push({
              id: nanoid(),
              type: 'event',
              data: event,
              playerId: player.id,
              round,
              turnIndex,
              shown: false,
            })
          }
        }
      }

      playerCards[player.id] = cards
    })

    return playerCards
  }

  /**
   * Get the current card for a player based on their turn index
   */
  getCurrentCard(player: Player): GameCard | null {
    if (player.currentTurnIndex >= player.cards.length) {
      return null
    }
    return player.cards[player.currentTurnIndex]
  }

  /**
   * Mark a card as shown
   */
  markCardAsShown(card: GameCard): void {
    card.shown = true
  }

  /**
   * Extract all events from cards (for round-end processing)
   */
  extractEvents(cards: GameCard[]): MarketEvent[] {
    return cards
      .filter((card) => card.type === 'event' && card.shown)
      .map((card) => card.data as MarketEvent)
  }

  /**
   * Extract all corporate actions from cards (for round-end processing)
   */
  extractCorporateActions(cards: GameCard[]): CorporateAction[] {
    return cards
      .filter((card) => card.type === 'corporate_action' && card.shown)
      .map((card) => card.data as CorporateAction)
  }

  /**
   * Get unplayed corporate action cards for a player
   */
  getUnplayedCorporateActions(player: Player): CorporateAction[] {
    return player.cards
      .filter((card) => {
        if (card.type !== 'corporate_action') return false
        const action = card.data as CorporateAction
        return card.shown && !action.played
      })
      .map((card) => card.data as CorporateAction)
  }

  /**
   * Mark a corporate action as played
   */
  playCorporateAction(player: Player, actionId: string): CorporateAction | null {
    const card = player.cards.find(
      (c) => c.type === 'corporate_action' && c.data.id === actionId
    )

    if (!card) return null

    const action = card.data as CorporateAction
    if (action.played) return null

    action.played = true
    return action
  }
}
