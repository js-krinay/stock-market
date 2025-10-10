import { initTRPC, TRPCError } from '@trpc/server'
import { prisma } from './db'
import { isGameError, mapStatusToTRPCCode } from './errors'

/**
 * Create tRPC context
 * Note: Now that we use ServiceContainer, ctx.prisma is only needed
 * for procedures that haven't been migrated to services yet
 */
export const createContext = () => ({
  prisma, // Keep for backward compatibility
})

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    // If it's a GameError, preserve the custom error structure
    if (error.cause && isGameError(error.cause)) {
      const gameError = error.cause
      return {
        ...shape,
        data: {
          ...shape.data,
          code: gameError.code,
          statusCode: gameError.statusCode,
          details: gameError.details,
        },
      }
    }
    return shape
  },
})

/**
 * Error handling middleware that converts GameErrors to TRPCErrors
 */
const errorHandlingMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    // Convert GameError to TRPCError
    if (isGameError(error)) {
      throw new TRPCError({
        code: mapStatusToTRPCCode(error.statusCode) as any,
        message: error.message,
        cause: error,
      })
    }
    // Re-throw other errors
    throw error
  }
})

export const router = t.router
export const publicProcedure = t.procedure.use(errorHandlingMiddleware)
