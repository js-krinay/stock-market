import { PrismaClient } from '@prisma/client'
import { GameService } from './services/gameService'
import { UIDataService } from './services/uiDataService'
import { LeadershipExclusionService } from './services/leadershipExclusionService'
import type { ILeadershipExclusionService } from './interfaces/'
import { Errors } from './errors'

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
  private leadershipServiceInstance: LeadershipExclusionService | null = null

  private constructor(private prisma: PrismaClient) {}

  /**
   * Initialize the service container (call once at startup)
   * @param prisma - PrismaClient instance
   */
  static initialize(prisma: PrismaClient): void {
    if (ServiceContainer.instance) {
      throw Errors.containerAlreadyInitialized()
    }
    ServiceContainer.instance = new ServiceContainer(prisma)
  }

  /**
   * Get the singleton container instance
   * @throws Error if container not initialized
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      throw Errors.containerNotInitialized()
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
   * Get LeadershipExclusionService instance (lazy initialization)
   */
  getLeadershipService(): ILeadershipExclusionService {
    if (!this.leadershipServiceInstance) {
      this.leadershipServiceInstance = new LeadershipExclusionService(this.prisma)
    }
    return this.leadershipServiceInstance
  }

  /**
   * Reset all service instances (for testing only)
   * @internal
   */
  reset(): void {
    this.gameServiceInstance = null
    this.uiDataServiceInstance = null
    this.leadershipServiceInstance = null
  }

  /**
   * Destroy the singleton instance (for testing only)
   * @internal
   */
  static destroy(): void {
    ServiceContainer.instance = null
  }
}
