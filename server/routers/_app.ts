import { router } from '../trpc'
import { gameRouter } from './gameRouter'

export const appRouter = router({
  game: gameRouter,
})

export type AppRouter = typeof appRouter
