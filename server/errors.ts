/**
 * Standardized Error Handling for Stock Market Game
 *
 * Custom error classes provide:
 * - Consistent error structure across the application
 * - Type-safe error handling
 * - HTTP status code mapping
 * - Error code categorization for client-side handling
 */

/**
 * Base error class for all game-related errors
 */
export class GameError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'GameError'
    Object.setPrototypeOf(this, GameError.prototype)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    }
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends GameError {
  constructor(resource: string, id?: string, details?: Record<string, unknown>) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(`NOT_FOUND_${resource.toUpperCase().replace(/\s/g, '_')}`, message, 404, details)
    this.name = 'NotFoundError'
  }
}

/**
 * Invalid input or validation errors (400)
 */
export class ValidationError extends GameError {
  constructor(field: string, reason: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', `Invalid ${field}: ${reason}`, 400, {
      field,
      reason,
      ...details,
    })
    this.name = 'ValidationError'
  }
}

/**
 * Business logic constraint violations (400)
 */
export class BusinessRuleError extends GameError {
  constructor(rule: string, message: string, details?: Record<string, unknown>) {
    super(`BUSINESS_RULE_${rule.toUpperCase().replace(/\s/g, '_')}`, message, 400, details)
    this.name = 'BusinessRuleError'
  }
}

/**
 * Insufficient resources errors (400)
 */
export class InsufficientResourceError extends GameError {
  constructor(resource: string, required: number, available: number) {
    super(
      `INSUFFICIENT_${resource.toUpperCase()}`,
      `Insufficient ${resource}: required ${required}, available ${available}`,
      400,
      { resource, required, available }
    )
    this.name = 'InsufficientResourceError'
  }
}

/**
 * Game state errors (409)
 */
export class GameStateError extends GameError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('GAME_STATE_ERROR', message, 409, details)
    this.name = 'GameStateError'
  }
}

/**
 * Authorization errors (403)
 */
export class UnauthorizedError extends GameError {
  constructor(action: string, reason?: string) {
    const message = reason ? `Unauthorized to ${action}: ${reason}` : `Unauthorized to ${action}`
    super('UNAUTHORIZED', message, 403, { action, reason })
    this.name = 'UnauthorizedError'
  }
}

/**
 * Internal server errors (500)
 */
export class InternalError extends GameError {
  constructor(message: string, originalError?: Error) {
    super('INTERNAL_ERROR', message, 500, {
      originalError: originalError?.message,
      stack: originalError?.stack,
    })
    this.name = 'InternalError'
  }
}

/**
 * Type guard to check if error is a GameError
 */
export function isGameError(error: unknown): error is GameError {
  return error instanceof GameError
}

/**
 * Map HTTP status code to tRPC error code
 */
export function mapStatusToTRPCCode(statusCode: number): string {
  const mapping: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_SERVER_ERROR',
  }
  return mapping[statusCode] || 'INTERNAL_SERVER_ERROR'
}

/**
 * Common error factory functions for convenience
 */
export const Errors = {
  gameNotFound: (gameId: string) => new NotFoundError('Game', gameId),
  playerNotFound: (playerId: string) => new NotFoundError('Player', playerId),
  stockNotFound: (symbol: string) => new NotFoundError('Stock', symbol),
  corporateActionNotFound: (actionId: string) => new NotFoundError('Corporate Action', actionId),

  insufficientCash: (required: number, available: number) =>
    new InsufficientResourceError('cash', required, available),
  insufficientShares: (symbol: string, required: number, available: number) =>
    new BusinessRuleError(
      'insufficient_shares',
      `Insufficient shares of ${symbol}: required ${required}, available ${available}`,
      { symbol, required, available }
    ),
  insufficientStock: (symbol: string, required: number, available: number) =>
    new BusinessRuleError(
      'insufficient_stock',
      `Insufficient stock available for ${symbol}: required ${required}, available ${available}`,
      { symbol, required, available }
    ),

  invalidQuantity: (quantity: number) =>
    new ValidationError('quantity', `must be positive, got ${quantity}`, { quantity }),
  invalidTradeType: (type: string) =>
    new ValidationError('trade type', `invalid type '${type}'`, { type }),
  invalidSymbol: (symbol: string) =>
    new ValidationError('stock symbol', `invalid symbol '${symbol}'`, { symbol }),

  gameAlreadyComplete: (gameId: string) =>
    new GameStateError('Game is already complete', { gameId }),
  notPlayerTurn: (currentPlayer: string, attemptedPlayer: string) =>
    new GameStateError('Not your turn', { currentPlayer, attemptedPlayer }),

  unauthorized: (action: string, reason?: string) => new UnauthorizedError(action, reason),

  internal: (message: string, error?: Error) => new InternalError(message, error),
}
