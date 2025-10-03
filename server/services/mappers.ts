import type { Stock, Player, MarketEvent, CorporateAction } from '../types'

/**
 * Map database stock to app stock
 */
export function mapDbStockToAppStock(stock: any): Stock {
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    availableQuantity: stock.availableQuantity,
    totalQuantity: stock.totalQuantity,
    color: stock.color,
    directorId: stock.directorId,
    chairmanId: stock.chairmanId,
    directorSince: stock.directorSince?.getTime() || 0,
    chairmanSince: stock.chairmanSince?.getTime() || 0,
    priceHistory:
      stock.priceHistory?.map((ph: any) => ({
        round: ph.round,
        price: ph.price,
      })) || [],
  }
}

/**
 * Map database player to app player
 */
export function mapDbPlayerToAppPlayer(player: any, currentRound?: number): Player {
  return {
    id: player.id,
    name: player.name,
    cash: player.cash,
    portfolio: player.portfolio.map((h: any) => ({
      symbol: h.symbol,
      quantity: h.quantity,
      averageCost: h.averageCost,
    })),
    actionHistory: player.actionHistory.map((ah: any) => ({
      round: ah.round,
      turn: ah.turn,
      action: {
        type: ah.actionType,
        symbol: ah.symbol,
        quantity: ah.quantity,
        corporateActionId: ah.corporateActionId,
      },
      price: ah.price,
      totalValue: ah.totalValue,
      result: ah.result,
      timestamp: ah.timestamp.getTime(),
    })),
    cards:
      player.cards
        ?.filter((card: any) => !currentRound || card.round === currentRound)
        .map((card: any) => {
          // Determine the data based on card type
          let data: MarketEvent | CorporateAction | undefined

          if (card.type === 'event' && card.event) {
            data = mapDbEventToAppEvent(card.event)
          } else if (card.type === 'corporate_action' && card.corporateAction) {
            data = mapDbActionToAppAction(card.corporateAction)
          }

          return {
            id: card.cardId,
            type: card.type,
            data,
            playerId: card.playerId,
            round: card.round,
            turnIndex: card.turnIndex,
          }
        }) || [],
    currentTurnIndex: player.currentTurnIndex,
  }
}

/**
 * Map database event to app event
 */
export function mapDbEventToAppEvent(event: any): MarketEvent {
  return {
    id: event.eventId,
    type: event.type,
    severity: event.severity,
    title: event.title,
    description: event.description,
    affectedStocks: JSON.parse(event.affectedStocks),
    impact: event.impact,
    round: event.round,
    turn: event.turn,
    playerId: event.playerId,
    priceDiff: event.priceDiff ? JSON.parse(event.priceDiff) : undefined,
    actualImpact: event.actualImpact ? JSON.parse(event.actualImpact) : undefined,
  }
}

/**
 * Map database action to app action
 */
export function mapDbActionToAppAction(action: any): CorporateAction {
  return {
    id: action.actionId,
    type: action.type,
    symbol: action.symbol,
    title: action.title,
    description: action.description,
    details: JSON.parse(action.details),
    round: action.round,
    createdAtTurn: action.createdAtTurn,
    playersProcessed: JSON.parse(action.playersProcessed),
    playerId: action.playerId,
    played: action.played,
    status: action.status,
    expiresAtPlayerId: action.expiresAtPlayerId,
    eligiblePlayerIds: action.eligiblePlayerIds ? JSON.parse(action.eligiblePlayerIds) : undefined,
  }
}
