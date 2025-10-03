import { test, expect } from '@playwright/test'

test.describe('Stock Market Game - Setup Test', () => {
  test('should setup game and reach round 1', async ({ page }) => {
    // Navigate to the game
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Setup game: 3 players, 5 rounds
    await test.step('Setup game', async () => {
      await expect(page.locator('text=Stock Market Game')).toBeVisible({ timeout: 10000 })

      // Set number of players to 3
      const playerCountInput = page.locator('input[type="number"]').first()
      await playerCountInput.fill('3')

      // Enter player names
      const playerInputs = page.locator('input[placeholder*="Player"]')
      await playerInputs.nth(0).fill('Alice')
      await playerInputs.nth(1).fill('Bob')
      await playerInputs.nth(2).fill('Charlie')

      // Set rounds to 5
      const roundsInput = page.locator('input[type="number"]').nth(1)
      await roundsInput.fill('5')

      // Take screenshot before starting
      await page.screenshot({ path: 'tests/screenshots/before-start.png' })

      // Start the game
      await page.locator('button:has-text("Start Game")').click()

      // Wait for game to start
      await page.waitForTimeout(2000)

      // Take screenshot after clicking start
      await page.screenshot({ path: 'tests/screenshots/after-start-click.png', fullPage: true })

      // Verify game started - we should NOT see the setup button anymore
      const setupButtonVisible = await page
        .locator('button:has-text("Start Game")')
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      expect(setupButtonVisible).toBe(false)

      // Verify we can see game UI elements
      await expect(page.locator('text=Current Player').first()).toBeVisible()
      await expect(page.locator('text=📈 Stock Market').first()).toBeVisible()

      console.log('✅ Game started successfully - setup screen cleared!')
    })
  })
})
