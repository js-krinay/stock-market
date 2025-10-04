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
    events:
      player.events
        ?.filter((event: any) => !currentRound || event.round === currentRound)
        .map((event: any) => mapDbEventToAppEvent(event)) || [],
    corporateActions:
      player.corporateActions
        ?.filter((action: any) => !currentRound || action.round === currentRound)
        .map((action: any) => mapDbActionToAppAction(action)) || [],
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
    excludedBy: event.excludedBy,
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
    playersProcessed: JSON.parse(action.playersProcessed),
    playerId: action.playerId,
    excludedBy: action.excludedBy,
    played: action.played,
    status: action.status,
    expiresAtPlayerId: action.expiresAtPlayerId,
    eligiblePlayerIds: action.eligiblePlayerIds ? JSON.parse(action.eligiblePlayerIds) : undefined,
  }
}
