import { beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const TEST_DB_PATH = './prisma/test.db'

// Create a test database before each test
beforeEach(async () => {
  // Remove test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
})

// Cleanup after each test
afterEach(async () => {
  // Remove test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
})
