import { PrismaClient } from '@prisma/client'
import { GameService } from './services/gameService'
import { UIDataService } from './services/uiDataService'

/**
 * ServiceContainer - Dependency injection container with singleton pattern
 *
 * Manages service lifecycle and provides single instances throughout
 * the application lifecycle. Services are lazily initialized on first access.
 *
 * @example
 * ```typescript
 * // Initialize once at application startup
 * ServiceContainer.initialize(prisma)
 *
 * // Use throughout application
 * const gameService = ServiceContainer.getInstance().getGameService()
 * ```
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null

  // Service instances (lazy initialization)
  private gameServiceInstance: GameService | null = null
  private uiDataServiceInstance: UIDataService | null = null

  private constructor(private prisma: PrismaClient) {}

  /**
   * Initialize the service container (call once at startup)
   * @param prisma - PrismaClient instance
   */
  static initialize(prisma: PrismaClient): void {
    if (ServiceContainer.instance) {
      throw new Error('ServiceContainer already initialized')
    }
    ServiceContainer.instance = new ServiceContainer(prisma)
  }

  /**
   * Get the singleton container instance
   * @throws Error if container not initialized
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      throw new Error('ServiceContainer not initialized. Call ServiceContainer.initialize() first.')
    }
    return ServiceContainer.instance
  }

  /**
   * Get GameService instance (lazy initialization)
   */
  getGameService(): GameService {
    if (!this.gameServiceInstance) {
      this.gameServiceInstance = new GameService(this.prisma)
    }
    return this.gameServiceInstance
  }

  /**
   * Get UIDataService instance (lazy initialization)
   */
  getUIDataService(): UIDataService {
    if (!this.uiDataServiceInstance) {
      this.uiDataServiceInstance = new UIDataService(this.prisma)
    }
    return this.uiDataServiceInstance
  }

  /**
   * Reset all service instances (for testing only)
   * @internal
   */
  reset(): void {
    this.gameServiceInstance = null
    this.uiDataServiceInstance = null
  }

  /**
   * Destroy the singleton instance (for testing only)
   * @internal
   */
  static destroy(): void {
    ServiceContainer.instance = null
  }
}

// Export singleton instance getter for convenience
export const container = ServiceContainer.getInstance
