import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { ServiceContainer } from '../server/container'
import prisma from '../server/db'

describe('ServiceContainer', () => {
  beforeAll(() => {
    ServiceContainer.initialize(prisma)
  })

  afterAll(() => {
    ServiceContainer.destroy()
  })

  afterEach(() => {
    // Reset services after each test to ensure clean state
    ServiceContainer.getInstance().reset()
  })

  it('should provide singleton GameService instance', () => {
    const instance1 = ServiceContainer.getInstance().getGameService()
    const instance2 = ServiceContainer.getInstance().getGameService()

    expect(instance1).toBe(instance2) // Same instance
  })

  it('should provide singleton UIDataService instance', () => {
    const instance1 = ServiceContainer.getInstance().getUIDataService()
    const instance2 = ServiceContainer.getInstance().getUIDataService()

    expect(instance1).toBe(instance2)
  })

  it('should throw if getInstance called before initialize', () => {
    ServiceContainer.destroy()

    expect(() => ServiceContainer.getInstance()).toThrow('ServiceContainer not initialized')

    // Re-initialize for other tests
    ServiceContainer.initialize(prisma)
  })

  it('should throw if initialized twice', () => {
    expect(() => ServiceContainer.initialize(prisma)).toThrow('ServiceContainer already initialized')
  })

  it('should reset all services', () => {
    const container = ServiceContainer.getInstance()
    const service1 = container.getGameService()

    container.reset()

    const service2 = container.getGameService()
    expect(service1).not.toBe(service2) // Different instances after reset
  })
})
