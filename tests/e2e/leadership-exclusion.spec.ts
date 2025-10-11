import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Tests for Leadership Exclusion Feature
 * Tests chairman and director powers to exclude market events
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Setup game with specified players and initial holdings
 */
async function setupGame(
  page: Page,
  config: {
    players: string[]
    rounds?: number
    initialTrades?: Record<string, Record<string, number>> // player -> stock -> quantity
  }
) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Set number of players
  const playerCountInput = page.locator('input[type="number"]').first()
  await playerCountInput.fill(config.players.length.toString())

  // Wait for player input fields to appear
  await page.waitForTimeout(300)

  // Enter player names
  for (let i = 0; i < config.players.length; i++) {
    const playerInput = page.locator(`input[placeholder*="Player ${i + 1}"]`)
    await playerInput.fill(config.players[i])
  }

  // Set rounds (default 5)
  const roundsInput = page.locator('input[type="number"]').nth(1)
  await roundsInput.fill((config.rounds || 5).toString())

  // Start the game
  await page.locator('button:has-text("Start Game")').click()
  await page.waitForTimeout(2000)

  // Verify game started
  await expect(page.locator('text=Current Player').first()).toBeVisible()

  // Execute initial trades to establish holdings
  if (config.initialTrades) {
    for (const [playerName, stocks] of Object.entries(config.initialTrades)) {
      // Wait for correct player's turn
      await waitForPlayerTurn(page, playerName)

      // Execute trades for this player
      for (const [symbol, quantity] of Object.entries(stocks)) {
        await executeBuyTrade(page, symbol, quantity)

        // End turn after each trade
        await page.locator('button:has-text("End Turn")').click()
        await page.waitForTimeout(500)

        // Wait for next turn (same player or next player)
        await page.waitForTimeout(300)
      }
    }
  }
}

/**
 * Wait for specific player's turn
 */
async function waitForPlayerTurn(page: Page, playerName: string, timeout = 30000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const currentPlayerText = await page
      .locator('text=Current Player')
      .locator('..')
      .textContent()
      .catch(() => '')

    if (currentPlayerText.includes(playerName)) {
      return
    }

    // End turn to rotate to next player
    const endTurnButton = page.locator('button:has-text("End Turn")')
    if (await endTurnButton.isVisible().catch(() => false)) {
      await endTurnButton.click()
      await page.waitForTimeout(500)
    }
  }

  throw new Error(`Timeout waiting for player ${playerName}'s turn`)
}

/**
 * Execute a buy trade for a specific stock
 */
async function executeBuyTrade(page: Page, stockSymbol: string, quantity: number) {
  // Find the stock row containing the symbol
  const stockRow = page.locator(`tr:has-text("${stockSymbol}")`)
  await expect(stockRow).toBeVisible()

  // Click buy button in that row
  const buyButton = stockRow.locator('button:has-text("Buy")')
  await buyButton.click()
  await page.waitForTimeout(300)

  // Enter quantity
  const quantityInput = page.locator('input[type="number"]').last()
  await quantityInput.fill(quantity.toString())

  // Confirm
  const confirmButton = page.locator('button:has-text("Confirm")').last()
  await confirmButton.click()
  await page.waitForTimeout(500)
}

/**
 * Complete all turns in a round to trigger leadership phase
 */
async function completeAllTurnsInRound(page: Page, playerCount: number, turnsPerRound = 3) {
  const totalTurns = playerCount * turnsPerRound

  for (let i = 0; i < totalTurns; i++) {
    const endTurnButton = page.locator('button:has-text("End Turn")')

    // Wait for button to be visible and enabled
    await expect(endTurnButton).toBeVisible()
    await endTurnButton.click()

    // Wait for turn to process
    await page.waitForTimeout(500)
  }
}

/**
 * Check if leadership dialog is visible
 */
async function isLeadershipDialogVisible(page: Page): Promise<boolean> {
  return await page
    .locator('text=⚡ Leadership Event Exclusion')
    .isVisible({ timeout: 3000 })
    .catch(() => false)
}

/**
 * Exclude an event for the current leader in paginated dialog
 */
async function excludeEventForCurrentLeader(
  page: Page,
  stockSymbol: string,
  eventIndex: number = 0
) {
  // Wait for dialog to be visible
  await expect(page.locator('text=⚡ Leadership Event Exclusion')).toBeVisible()

  // Find the stock section
  const stockSection = page
    .locator(`div:has-text("${stockSymbol}")`)
    .filter({ hasText: 'Chairman' })
    .or(page.locator(`div:has-text("${stockSymbol}")`).filter({ hasText: 'Director' }))

  // Open the select dropdown (within the stock section's parent card)
  const selectTrigger = stockSection.locator('..').locator('button[role="combobox"]').first()
  await selectTrigger.click()
  await page.waitForTimeout(300)

  // Select the event (skip the first "Skip exclusion" option)
  const eventOptions = page.locator('[role="option"]')
  const eventOption = eventOptions.nth(eventIndex + 1) // +1 to skip "Skip exclusion" option
  await eventOption.click()
  await page.waitForTimeout(300)
}

/**
 * Click "Next Leader" button in paginated flow
 */
async function clickNextLeader(page: Page) {
  const nextButton = page.locator('button:has-text("Next Leader")')
  await nextButton.click()
  await page.waitForTimeout(1000)
}

/**
 * Click "Complete & Process Round" button (last leader)
 */
async function clickCompleteRound(page: Page) {
  const completeButton = page.locator('button:has-text("Complete & Process Round")')
  await completeButton.click()
  await page.waitForTimeout(2000)
}

/**
 * Get current leader name from dialog banner
 */
async function getCurrentLeaderName(page: Page): Promise<string> {
  const bannerText = await page.locator("text=/.*'s Turn/").textContent()
  const match = bannerText?.match(/(.+)'s Turn/)
  return match ? match[1] : ''
}

/**
 * Get leadership progress indicator
 */
async function getLeadershipProgress(page: Page): Promise<{ current: number; total: number }> {
  const progressText = await page.locator('text=/Leader \\d+ of \\d+/').textContent()
  const match = progressText?.match(/Leader (\d+) of (\d+)/)
  return {
    current: match ? parseInt(match[1]) : 0,
    total: match ? parseInt(match[2]) : 0,
  }
}

/**
 * Complete all leaders in pagination flow (skip all exclusions)
 */
async function completeAllLeaders(page: Page, maxLeaders = 10) {
  for (let i = 0; i < maxLeaders; i++) {
    const buttonText = await page
      .locator('button[size="lg"]')
      .last()
      .textContent()
      .catch(() => '')

    if (buttonText?.includes('Complete')) {
      await clickCompleteRound(page)
      break
    } else if (buttonText?.includes('Next Leader')) {
      await clickNextLeader(page)
      await page.waitForTimeout(500)
    } else {
      // Dialog closed
      break
    }
  }
}

/**
 * Get current round number
 */
async function getCurrentRound(page: Page): Promise<number> {
  const roundText = await page.locator('text=/Round \\d+/').first().textContent()
  const match = roundText?.match(/Round (\d+)/)
  return match ? parseInt(match[1]) : 0
}

/**
 * Get stock price
 */
async function getStockPrice(page: Page, stockSymbol: string): Promise<number> {
  const priceText = await page
    .locator(`tr:has-text("${stockSymbol}")`)
    .locator('td')
    .nth(1)
    .textContent()
  return parseFloat(priceText?.replace(/[^0-9.-]/g, '') || '0')
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Leadership Exclusion - E2E Tests', () => {
  // ========================================================================
  // Scenario 1: Chairman Exclusion Workflow
  // ========================================================================

  test('chairman can exclude any event affecting their stock', async ({ page }) => {
    // Setup: Alice holds 60% of TECH (Chairman)
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 }, // 60% of 20,000 total
        Bob: { TECH: 2000 },
      },
    })

    // Complete Round 1 turns
    await test.step('Complete Round 1 turns', async () => {
      await completeAllTurnsInRound(page, 2)
    })

    // Verify leadership dialog appears
    await test.step('Verify leadership dialog appears', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)

      // Verify Chairman badge is visible
      await expect(page.locator('text=Chairman')).toBeVisible()
    })

    // Exclude first TECH event and complete
    await test.step('Exclude TECH event', async () => {
      await excludeEventForCurrentLeader(page, 'TECH', 0)
      await clickCompleteRound(page) // Alice is the only leader
    })

    // Verify round progressed
    await test.step('Verify round 2 started', async () => {
      await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
    })
  })

  // ========================================================================
  // Scenario 2: Director Limited Exclusion
  // ========================================================================

  test('director can only exclude events from their own hand', async ({ page }) => {
    // Setup: Bob holds 40% of BANK (Director, no chairman exists)
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Bob: { BANK: 8000 }, // 40% of 20,000
        Alice: { BANK: 2000 },
      },
    })

    // Complete Round 1
    await test.step('Complete Round 1 turns', async () => {
      await completeAllTurnsInRound(page, 2)
    })

    // Verify leadership dialog shows Director badge
    await test.step('Verify Director badge and limited events', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)

      // Should see Director badge
      await expect(page.locator('text=Director')).toBeVisible()

      // Should see limitation message
      await expect(
        page.locator('text=As director, you can only exclude events from your own hand')
      ).toBeVisible()
    })

    // Complete leadership phase
    await test.step('Complete leadership phase', async () => {
      await completeAllLeaders(page) // Bob is the only leader
      await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
    })
  })

  // ========================================================================
  // Scenario 3: Multiple Leaders
  // ========================================================================

  test('multiple leaders can exclude independently', async ({ page }) => {
    // Setup: Alice is TECH chairman, Bob is BANK director
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000, BANK: 1000 },
        Bob: { BANK: 8000, TECH: 2000 },
      },
    })

    // Complete Round 1
    await test.step('Complete Round 1 turns', async () => {
      await completeAllTurnsInRound(page, 2)
    })

    // Verify multiple stocks shown in dialog
    await test.step('Verify multiple leadership opportunities', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)

      // Should see both TECH and BANK sections
      await expect(page.locator('text=TECH').first()).toBeVisible()
      await expect(page.locator('text=BANK').first()).toBeVisible()
    })

    // Exclude events and complete (Alice leads both TECH and BANK, so she's the only leader)
    await test.step('Exclude events from multiple stocks', async () => {
      await excludeEventForCurrentLeader(page, 'TECH', 0)
      await clickCompleteRound(page) // Alice is the only leader (leads multiple stocks)
    })

    // Verify round progressed
    await test.step('Verify round 2 started', async () => {
      await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
    })
  })

  // ========================================================================
  // Scenario 4: No Leaders (Normal Flow)
  // ========================================================================

  test('normal round processing when no leaders exist', async ({ page }) => {
    // Setup: No players reach 50% or 25% threshold
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 2000, BANK: 2000 },
        Bob: { TECH: 2000, BANK: 2000 },
      },
    })

    // Complete Round 1
    await test.step('Complete Round 1 turns', async () => {
      await completeAllTurnsInRound(page, 2)
    })

    // Verify leadership dialog does NOT appear
    await test.step('Verify no leadership dialog', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(false)
    })

    // Verify round progressed immediately
    await test.step('Verify round 2 started immediately', async () => {
      await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
    })
  })

  // ========================================================================
  // Scenario 5: Skip Exclusion
  // ========================================================================

  test('leader can skip exclusion opportunity', async ({ page }) => {
    // Setup: Alice is TECH chairman
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 },
      },
    })

    // Complete Round 1
    await test.step('Complete Round 1 turns', async () => {
      await completeAllTurnsInRound(page, 2)
    })

    // Verify dialog appears
    await test.step('Verify leadership dialog', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)
    })

    // Skip exclusion (don't select any event)
    await test.step('Skip exclusion', async () => {
      await completeAllLeaders(page) // Just skip through all leaders
    })

    // Verify round progressed
    await test.step('Verify round 2 started', async () => {
      await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
    })
  })

  // ========================================================================
  // Scenario 6: Leadership Dialog UI Elements
  // ========================================================================

  test('leadership dialog shows correct UI elements', async ({ page }) => {
    // Setup: Alice is TECH chairman
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 },
      },
    })

    // Complete Round 1
    await completeAllTurnsInRound(page, 2)

    // Verify dialog UI elements
    await test.step('Verify dialog structure', async () => {
      await expect(page.locator('text=⚡ Leadership Event Exclusion')).toBeVisible()
      await expect(page.locator('text=As a stock leader, you may exclude')).toBeVisible()
      await expect(page.locator('text=Chairman')).toBeVisible()
      await expect(page.locator('text=/Leader \\d+ of \\d+/')).toBeVisible() // Progress indicator
      await expect(page.locator("text=/.*'s Turn/")).toBeVisible() // Player banner
      await expect(page.locator('button:has-text("Complete & Process Round")')).toBeVisible()
    })

    // Clean up
    await completeAllLeaders(page)
  })

  // ========================================================================
  // Scenario 7: Chairman with Multiple Stocks
  // ========================================================================

  test('chairman of multiple stocks sees all opportunities', async ({ page }) => {
    // Setup: Alice is chairman of both TECH and BANK
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000, BANK: 12000 },
      },
    })

    // Complete Round 1
    await completeAllTurnsInRound(page, 2)

    // Verify both stocks shown with Chairman badge
    await test.step('Verify multiple chairman opportunities', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)

      // Should see both TECH and BANK
      await expect(page.locator('text=TECH').first()).toBeVisible()
      await expect(page.locator('text=BANK').first()).toBeVisible()

      // Both should show Chairman badge
      const chairmanBadges = page.locator('text=Chairman')
      expect(await chairmanBadges.count()).toBeGreaterThanOrEqual(2)
    })

    await completeAllLeaders(page)
  })

  // ========================================================================
  // Scenario 8: Round Processing After Leadership Phase
  // ========================================================================

  test('round processing continues after leadership phase', async ({ page }) => {
    // Setup: Alice is TECH chairman
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 },
      },
    })

    // Get initial round
    const initialRound = await getCurrentRound(page)

    // Complete Round 1
    await completeAllTurnsInRound(page, 2)

    // Complete leadership phase
    await test.step('Complete leadership phase', async () => {
      const dialogVisible = await isLeadershipDialogVisible(page)
      expect(dialogVisible).toBe(true)

      await completeAllLeaders(page)
    })

    // Verify round incremented
    await test.step('Verify round incremented', async () => {
      await page.waitForTimeout(2000)
      const newRound = await getCurrentRound(page)
      expect(newRound).toBe(initialRound + 1)
    })

    // Verify game continues normally
    await test.step('Verify game continues', async () => {
      await expect(page.locator('text=Current Player').first()).toBeVisible()
      await expect(page.locator('button:has-text("End Turn")')).toBeVisible()
    })
  })

  // ========================================================================
  // Edge Case: Performance Test
  // ========================================================================

  test('leadership phase completes within reasonable time', async ({ page }) => {
    // Setup
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 },
      },
    })

    // Complete Round 1
    await completeAllTurnsInRound(page, 2)

    // Measure leadership phase time
    await test.step('Measure leadership phase performance', async () => {
      const startTime = Date.now()

      await excludeEventForCurrentLeader(page, 'TECH', 0)
      await clickCompleteRound(page) // Alice is only leader

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000)

      console.log(`Leadership phase completed in ${duration}ms`)
    })
  })

  // ========================================================================
  // Edge Case: Dialog Accessibility
  // ========================================================================

  test('leadership dialog is keyboard accessible', async ({ page }) => {
    // Setup
    await setupGame(page, {
      players: ['Alice', 'Bob'],
      rounds: 3,
      initialTrades: {
        Alice: { TECH: 12000 },
      },
    })

    // Complete Round 1
    await completeAllTurnsInRound(page, 2)

    // Test keyboard navigation
    await test.step('Test keyboard navigation', async () => {
      await expect(page.locator('text=⚡ Leadership Event Exclusion')).toBeVisible()

      // Tab to focus first interactive element
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      // Should be able to navigate with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'SELECT', 'INPUT']).toContain(focusedElement || '')
    })

    await completeAllLeaders(page)
  })

  // ========================================================================
  // PAGINATION FLOW TESTS
  // ========================================================================

  test.describe('Leadership Pagination Flow', () => {
    test('should paginate through multiple leaders sequentially', async ({ page }) => {
      // Setup: Alice is TECH chairman, Bob is BANK director
      await setupGame(page, {
        players: ['Alice', 'Bob', 'Charlie'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 }, // Chairman of TECH
          Bob: { BANK: 8000 }, // Director of BANK (no chairman)
        },
      })

      // Complete Round 1
      await completeAllTurnsInRound(page, 3)

      // Verify leadership dialog appears
      await test.step('Verify leadership dialog appears', async () => {
        const dialogVisible = await isLeadershipDialogVisible(page)
        expect(dialogVisible).toBe(true)
      })

      // Leader 1: Alice
      await test.step('Leader 1: Alice (TECH Chairman)', async () => {
        const leaderName = await getCurrentLeaderName(page)
        expect(leaderName).toBe('Alice')

        const progress = await getLeadershipProgress(page)
        expect(progress.current).toBe(1)
        expect(progress.total).toBe(2)

        // Verify TECH is shown
        await expect(page.locator('text=TECH').first()).toBeVisible()

        // Exclude event and advance
        await excludeEventForCurrentLeader(page, 'TECH', 0)
        await clickNextLeader(page)
      })

      // Leader 2: Bob
      await test.step('Leader 2: Bob (BANK Director)', async () => {
        const leaderName = await getCurrentLeaderName(page)
        expect(leaderName).toBe('Bob')

        const progress = await getLeadershipProgress(page)
        expect(progress.current).toBe(2)
        expect(progress.total).toBe(2)

        // Verify BANK is shown
        await expect(page.locator('text=BANK').first()).toBeVisible()

        // Verify "Complete & Process Round" button (last leader)
        await expect(page.locator('button:has-text("Complete & Process Round")')).toBeVisible()

        // Complete
        await clickCompleteRound(page)
      })

      // Verify round progressed
      await test.step('Verify round 2 started', async () => {
        await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
      })
    })

    test('should show correct progress indicator for each leader', async ({ page }) => {
      // Setup: 3 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 }, // Leader 1
          Bob: { BANK: 12000 }, // Leader 2
          Charlie: { CONS: 12000 }, // Leader 3
        },
      })

      await completeAllTurnsInRound(page, 4)

      // Leader 1
      await test.step('Leader 1 of 3', async () => {
        const progress = await getLeadershipProgress(page)
        expect(progress).toEqual({ current: 1, total: 3 })
        await clickNextLeader(page)
      })

      // Leader 2
      await test.step('Leader 2 of 3', async () => {
        const progress = await getLeadershipProgress(page)
        expect(progress).toEqual({ current: 2, total: 3 })
        await clickNextLeader(page)
      })

      // Leader 3
      await test.step('Leader 3 of 3', async () => {
        const progress = await getLeadershipProgress(page)
        expect(progress).toEqual({ current: 3, total: 3 })
        await clickCompleteRound(page)
      })
    })

    test('should display player banner with correct leader name', async ({ page }) => {
      // Setup: 2 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 },
          Bob: { BANK: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 2)

      // Verify Alice's banner
      await test.step("Verify Alice's banner", async () => {
        await expect(page.locator("text=Alice's Turn")).toBeVisible()
        await expect(page.locator('text=/You lead:.*TECH/')).toBeVisible()
        await clickNextLeader(page)
      })

      // Verify Bob's banner
      await test.step("Verify Bob's banner", async () => {
        await expect(page.locator("text=Bob's Turn")).toBeVisible()
        await expect(page.locator('text=/You lead:.*BANK/')).toBeVisible()
        await clickCompleteRound(page)
      })
    })

    test('should handle leader with multiple stocks correctly', async ({ page }) => {
      // Setup: Alice leads both TECH and BANK
      await setupGame(page, {
        players: ['Alice', 'Bob'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000, BANK: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 2)

      await test.step('Verify Alice sees both stocks', async () => {
        const leaderName = await getCurrentLeaderName(page)
        expect(leaderName).toBe('Alice')

        // Should show both TECH and BANK
        await expect(page.locator('text=TECH').first()).toBeVisible()
        await expect(page.locator('text=BANK').first()).toBeVisible()

        // Should show both in banner
        const banner = page.locator('text=/You lead:.*TECH.*BANK/')
        await expect(banner).toBeVisible()

        // Alice is only leader, so should see "Complete" button
        await expect(page.locator('button:has-text("Complete & Process Round")')).toBeVisible()

        await clickCompleteRound(page)
      })
    })

    test('should persist state through page refresh', async ({ page }) => {
      // Setup: 2 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 },
          Bob: { BANK: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 2)

      // Verify we're on Alice's turn
      await test.step('Start on Alice', async () => {
        await expect(page.locator("text=Alice's Turn")).toBeVisible()
        const progress = await getLeadershipProgress(page)
        expect(progress.current).toBe(1)
      })

      // Refresh page
      await test.step('Refresh page', async () => {
        await page.reload()
        await page.waitForTimeout(2000)
      })

      // Verify still on Alice's turn after refresh
      await test.step('Verify state persisted', async () => {
        const dialogVisible = await isLeadershipDialogVisible(page)
        expect(dialogVisible).toBe(true)

        await expect(page.locator("text=Alice's Turn")).toBeVisible()
        const progress = await getLeadershipProgress(page)
        expect(progress.current).toBe(1)

        // Complete flow
        await completeAllLeaders(page)
      })
    })

    test('should clear selections when advancing to next leader', async ({ page }) => {
      // Setup: 2 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 },
          Bob: { BANK: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 2)

      // Make selection for Alice
      await test.step('Alice makes selection', async () => {
        await excludeEventForCurrentLeader(page, 'TECH', 0)

        // Verify confirmation message appears
        await expect(page.locator('text=/✓.*will not affect TECH/i')).toBeVisible()

        await clickNextLeader(page)
      })

      // Verify Bob starts with clean slate
      await test.step('Bob starts fresh', async () => {
        await expect(page.locator("text=Bob's Turn")).toBeVisible()

        // No selection should be visible yet
        const confirmMsg = page.locator('text=/✓.*will not affect/i')
        expect(await confirmMsg.isVisible().catch(() => false)).toBe(false)

        await clickCompleteRound(page)
      })
    })

    test('should show correct button text for last leader', async ({ page }) => {
      // Setup: 2 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 },
          Bob: { BANK: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 2)

      // Leader 1: Should show "Next Leader"
      await test.step('First leader sees "Next Leader"', async () => {
        await expect(page.locator('button:has-text("Next Leader")')).toBeVisible()
        const completeBtn = page.locator('button:has-text("Complete & Process Round")')
        expect(await completeBtn.isVisible().catch(() => false)).toBe(false)

        await clickNextLeader(page)
      })

      // Leader 2: Should show "Complete & Process Round"
      await test.step('Last leader sees "Complete & Process Round"', async () => {
        await expect(page.locator('button:has-text("Complete & Process Round")')).toBeVisible()
        const nextBtn = page.locator('button:has-text("Next Leader")')
        expect(await nextBtn.isVisible().catch(() => false)).toBe(false)

        await clickCompleteRound(page)
      })
    })

    test('should handle skip through all leaders correctly', async ({ page }) => {
      // Setup: 3 leaders
      await setupGame(page, {
        players: ['Alice', 'Bob', 'Charlie'],
        rounds: 3,
        initialTrades: {
          Alice: { TECH: 12000 },
          Bob: { BANK: 12000 },
          Charlie: { CONS: 12000 },
        },
      })

      await completeAllTurnsInRound(page, 3)

      // Use helper to skip all
      await test.step('Skip all leaders', async () => {
        await completeAllLeaders(page)
      })

      // Verify round progressed
      await test.step('Verify round advanced', async () => {
        await expect(page.locator('text=Round 2')).toBeVisible({ timeout: 5000 })
      })
    })
  })
})
