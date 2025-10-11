import express from 'express'
import cors from 'cors'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/_app'
import { createContext } from './trpc'
import prisma from './db'
import { ServiceContainer } from './container'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Initialize service container once at startup
ServiceContainer.initialize(prisma)

// tRPC endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

app.listen(port, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`🚀 Server running on http://localhost:${port}`)
    console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`)
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})
