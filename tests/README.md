# Playwright Tests

## Setup

First, install Playwright browsers:

```bash
npx playwright install chromium
```

## Running Tests

### Run all tests (headless)

```bash
npm test
```

### Run tests with UI (interactive mode)

```bash
npm run test:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

## Test Coverage

### `game-flow.spec.ts`

Tests a complete 3-player, 5-round game simulation:

- Sets up game with 3 players (Alice, Bob, Charlie)
- Configures 5 rounds
- Each player takes 10 turns per round (30 turns per round total)
- Random actions per turn:
  - 30% chance to skip
  - 35% chance to play corporate action (if available)
  - 35% chance to buy/sell stock
- Verifies round transitions
- Confirms game completion after 5 rounds
- Takes screenshot of final game state

## Test Output

- HTML report: `playwright-report/index.html`
- Screenshots: `tests/screenshots/`
- Trace files: Available on test failures

## Notes

- The test uses randomized actions to simulate realistic gameplay
- Each turn includes proper waiting for UI updates
- The test logs detailed console output showing each player's actions
- Total test duration: ~5-10 minutes (150 turns with animations)
