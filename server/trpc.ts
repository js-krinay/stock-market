import { initTRPC } from '@trpc/server'
import { prisma } from './db'

export const createContext = () => ({
  prisma,
})

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
