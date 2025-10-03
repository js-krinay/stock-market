import express from 'express'
import cors from 'cors'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/_app'
import { createContext } from './trpc'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// tRPC endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
  console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`)
})
