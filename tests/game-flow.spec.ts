import { test, expect } from '@playwright/test'

test.describe('Stock Market Game - 3 Players, 5 Rounds', () => {
  test('should complete a full game with 3 players for 5 rounds', async ({ page }) => {
    // Navigate to the game
    await page.goto('/')

    // Setup game: 3 players, 5 rounds
    await test.step('Setup game', async () => {
      await expect(page.locator('text=Stock Market Game')).toBeVisible()

      // Set number of players to 3
      const playerCountInput = page.locator('input[type="number"]').first()
      await playerCountInput.fill('3')

      // Enter player names
      const player1Input = page.locator('input[placeholder*="Player 1"]')
      await player1Input.fill('Alice')

      const player2Input = page.locator('input[placeholder*="Player 2"]')
      await player2Input.fill('Bob')

      const player3Input = page.locator('input[placeholder*="Player 3"]')
      await player3Input.fill('Charlie')

      // Set rounds to 5
      const roundsInput = page.locator('label:has-text("Number of Rounds") + input')
      await roundsInput.fill('5')

      // Start the game
      await page.locator('button:has-text("Start Game")').click()

      // Wait for game to start
      await expect(page.locator('text=Round 1')).toBeVisible({ timeout: 5000 })
    })

    // Play all 5 rounds
    for (let round = 1; round <= 5; round++) {
      await test.step(`Play Round ${round}`, async () => {
        console.log(`\n=== Starting Round ${round} ===`)

        // Verify we're in the correct round
        await expect(page.locator(`text=Round ${round}`)).toBeVisible()

        // Each player has 10 turns per round
        for (let turn = 1; turn <= 10; turn++) {
          // Rotate through 3 players
          for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
            const playerNames = ['Alice', 'Bob', 'Charlie']
            const currentPlayer = playerNames[playerIndex]

            await test.step(`Round ${round}, Turn ${turn}, Player: ${currentPlayer}`, async () => {
              // Wait for current card to be visible
              await page.waitForTimeout(500)

              // Check if there's a current card displayed
              const hasEventCard = await page
                .locator('text=MARKET EVENT')
                .isVisible()
                .catch(() => false)
              const hasCorporateActionCard = await page
                .locator('text=CORPORATE ACTION CARD')
                .isVisible()
                .catch(() => false)

              if (hasEventCard) {
                console.log(`  ${currentPlayer} - Turn ${turn}: Event card displayed`)
              } else if (hasCorporateActionCard) {
                console.log(`  ${currentPlayer} - Turn ${turn}: Corporate action card displayed`)
              }

              // Make a random action
              const actionChoice = Math.random()

              if (actionChoice < 0.3) {
                // 30% - Skip turn
                const skipButton = page.locator('button:has-text("Skip")')
                if (await skipButton.isVisible()) {
                  await skipButton.click()
                  console.log(`  ${currentPlayer} - Action: Skipped`)
                }
              } else if (actionChoice < 0.65 && hasCorporateActionCard) {
                // 35% - Try to play corporate action if available
                // Check if there are unplayed corporate actions
                const playActionButton = page.locator('button:has-text("Play Action")').first()
                if (await playActionButton.isVisible().catch(() => false)) {
                  await playActionButton.click()
                  console.log(`  ${currentPlayer} - Action: Played corporate action`)
                  await page.waitForTimeout(500)
                } else {
                  // Fallback to skip
                  const skipButton = page.locator('button:has-text("Skip")')
                  if (await skipButton.isVisible()) {
                    await skipButton.click()
                    console.log(`  ${currentPlayer} - Action: Skipped (no action to play)`)
                  }
                }
              } else {
                // 35% - Buy or sell stock
                const buyOrSell = Math.random() < 0.5

                if (buyOrSell) {
                  // Try to buy stock
                  const buyButtons = page.locator('button:has-text("Buy")')
                  const buyButtonCount = await buyButtons.count()

                  if (buyButtonCount > 0) {
                    const randomStockIndex = Math.floor(Math.random() * buyButtonCount)
                    const stockButton = buyButtons.nth(randomStockIndex)

                    // Get stock symbol
                    const stockRow = stockButton.locator('xpath=ancestor::tr')
                    const stockSymbol = await stockRow
                      .locator('td')
                      .first()
                      .textContent()
                      .catch(() => 'UNKNOWN')

                    await stockButton.click()

                    // Enter random quantity (1-100)
                    const quantity = Math.floor(Math.random() * 100) + 1
                    const quantityInput = page.locator('input[type="number"]').last()
                    await quantityInput.fill(quantity.toString())

                    // Confirm buy
                    const confirmButton = page.locator('button:has-text("Confirm")').last()
                    if (await confirmButton.isVisible().catch(() => false)) {
                      await confirmButton.click()
                      console.log(
                        `  ${currentPlayer} - Action: Bought ${quantity} shares of ${stockSymbol}`
                      )
                    }
                  } else {
                    // No buy buttons, skip
                    const skipButton = page.locator('button:has-text("Skip")')
                    if (await skipButton.isVisible()) {
                      await skipButton.click()
                      console.log(`  ${currentPlayer} - Action: Skipped (no stocks to buy)`)
                    }
                  }
                } else {
                  // Try to sell stock
                  const sellButtons = page.locator('button:has-text("Sell")')
                  const sellButtonCount = await sellButtons.count()

                  if (sellButtonCount > 0) {
                    const randomStockIndex = Math.floor(Math.random() * sellButtonCount)
                    const stockButton = sellButtons.nth(randomStockIndex)

                    // Get stock symbol
                    const stockRow = stockButton.locator('xpath=ancestor::tr')
                    const stockSymbol = await stockRow
                      .locator('td')
                      .first()
                      .textContent()
                      .catch(() => 'UNKNOWN')

                    await stockButton.click()

                    // Enter random quantity (1-50)
                    const quantity = Math.floor(Math.random() * 50) + 1
                    const quantityInput = page.locator('input[type="number"]').last()
                    await quantityInput.fill(quantity.toString())

                    // Confirm sell
                    const confirmButton = page.locator('button:has-text("Confirm")').last()
                    if (await confirmButton.isVisible().catch(() => false)) {
                      await confirmButton.click()
                      console.log(
                        `  ${currentPlayer} - Action: Sold ${quantity} shares of ${stockSymbol}`
                      )
                    }
                  } else {
                    // No sell buttons, skip
                    const skipButton = page.locator('button:has-text("Skip")')
                    if (await skipButton.isVisible()) {
                      await skipButton.click()
                      console.log(`  ${currentPlayer} - Action: Skipped (no stocks to sell)`)
                    }
                  }
                }
              }

              // Wait for action to process
              await page.waitForTimeout(500)

              // End turn
              const endTurnButton = page.locator('button:has-text("End Turn")')
              await expect(endTurnButton).toBeVisible()
              await endTurnButton.click()

              // Wait a bit for the next player's turn
              await page.waitForTimeout(300)
            })
          }
        }

        console.log(`\n=== Completed Round ${round} ===`)

        // Wait for round processing if it's not the last round
        if (round < 5) {
          // Check if processing spinner appears
          const processingSpinner = page.locator('text=Processing Round')
          const isProcessing = await processingSpinner
            .isVisible({ timeout: 2000 })
            .catch(() => false)

          if (isProcessing) {
            console.log(`  Processing round ${round}...`)
            await processingSpinner.waitFor({ state: 'hidden', timeout: 5000 })
          }

          // Wait for next round to start
          await expect(page.locator(`text=Round ${round + 1}`)).toBeVisible({ timeout: 5000 })
        }
      })
    }

    // Game should be over
    await test.step('Verify game completion', async () => {
      // Wait for game over screen or leaderboard
      const gameOverIndicator =
        (await page
          .locator('text=Game Over')
          .isVisible({ timeout: 3000 })
          .catch(() => false)) ||
        (await page
          .locator('text=Final Rankings')
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator('text=Winner')
          .isVisible()
          .catch(() => false))

      console.log('\n=== Game Completed ===')
      console.log('Final game state reached')

      // Take a screenshot of the final state
      await page.screenshot({ path: 'tests/screenshots/game-complete.png', fullPage: true })

      // Verify all 5 rounds were played
      expect(gameOverIndicator).toBeTruthy()
    })
  })
})
