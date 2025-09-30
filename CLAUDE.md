# CLAUDE.md - Development Documentation

This document provides technical details about the Stock Market Game's architecture, implementation, and development process.

## 🏗️ Architecture Overview

### Core Design Pattern
The game follows a **modular object-oriented architecture** with clear separation of concerns:

```
UI Layer (ui.ts)
    ↓
Game Engine (game.ts)
    ↓
Systems Layer (market.ts, events.ts, player.ts, corporateActions.ts)
    ↓
Data Layer (types.ts)
```

## 📦 Module Breakdown

### 1. **types.ts** - Type Definitions
Defines all TypeScript interfaces and types used throughout the game.

**Key Interfaces:**
- `Stock`: Represents a tradable stock with price, quantity, sector, color
- `Player`: Player data including portfolio, cash, action history
- `GameState`: Complete game state including rounds, players, market condition, round events
- `MarketEvent`: News events with severity, impact range, price diffs, and actual changes
- `CorporateAction`: Dividends, right issues, bonus issues

**Design Decision:** Strict typing throughout ensures type safety and reduces runtime errors.

### 2. **game.ts** - Game Engine
The central orchestrator managing game flow and state.

**Key Responsibilities:**
- Game initialization with player setup
- Turn management and player rotation
- Round progression and end-of-round processing
- Trade execution with validation
- Corporate action processing
- Market event application with impact tracking (3 events per turn)
- Round-based event storage and price diff calculation

**Important Methods:**
```typescript
constructor(playerNames: string[], maxRounds: number)
executeTrade(action: TradeAction): Result
endTurn(): { newEvents, newCorporateAction, roundEnded, gameOver }
getPlayerRankings(): Rankings[]
getRoundPriceDiff(round: number): { [symbol: string]: number }
getRoundEvents(round: number): MarketEvent[]
```

**Design Decision:** Single source of truth for game state, immutable state updates where possible.

### 3. **market.ts** - Stock Market System
Manages stock data and price calculations.

**Key Responsibilities:**
- Stock initialization with colors and quantities
- Price fluctuation calculations
- Market event impact application
- Stock availability tracking (200k max per stock)
- Buy/sell quantity validation

**Price Update Logic:**
```typescript
// Event-based: Apply impact with minimum ±$1 change
const change = stock.price * (impact / 100)
const absoluteChange = Math.sign(change) * Math.max(1, Math.abs(change))
stock.price = stock.price + absoluteChange

// Random fluctuation: ±$1
const randomChange = (Math.random() - 0.5) * 2
stock.price = stock.price + randomChange

// Floor price: Never below $0
stock.price = Math.max(0, stock.price)
```

**Design Decision:** Prices stored in `Stock` objects, updated in-place for efficiency.

### 4. **events.ts** - Event System
Generates and manages market events including crashes and bull runs.

**Event Generation Strategy:**
1. Check for crash (5% chance, min 5 rounds apart)
2. Check for bull run (5% chance, min 5 rounds apart)
3. Generate regular event (70% chance)
4. Weight by severity (low events 5x more likely than high)

**Severity Distribution:**
- Low: 5x weight (most common)
- Medium: 3x weight
- High: 1x weight
- Extreme: Crashes & Bull Runs only

**Event Pool:**
- 15 unique events across all sectors
- Events track usage to avoid repetition
- Reset when pool exhausted

**Design Decision:** Weighted random selection ensures variety while maintaining realistic frequency distribution.

### 5. **player.ts** - Player Management
Handles player portfolio operations.

**Key Responsibilities:**
- Player creation with starting capital ($10,000)
- Buy/sell stock operations with validation
- Portfolio value calculation
- Average cost tracking (for P/L calculation)
- Portfolio detail generation with profit/loss

**Trade Validation:**
```typescript
Buy: Check sufficient cash, positive quantity
Sell: Check ownership, sufficient shares
Both: Atomic transactions with rollback on failure
```

**Design Decision:** Player operations are pure functions that mutate player state directly (managed by game engine).

### 6. **corporateActions.ts** - Corporate Actions
Manages dividend, right issue, and bonus issue events.

**Implementation Details:**

**Dividends:**
- Auto-applied to all shareholders
- 2-7% of stock price per share
- Paid in cash immediately

**Right Issues:**
- Requires player action (accept/decline)
- Discounted price (70-90% of market)
- Eligibility based on holding quantity
- Ratios: 1:5, 1:10, 2:5

**Bonus Issues:**
- Auto-applied free shares
- Adjusts average cost downward
- Ratios: 1:10, 1:5, 1:20

**Design Decision:** Split auto-apply (dividends, bonus) from player-choice (rights) for better UX.

### 7. **ui.ts** - User Interface
Manages all rendering and user interactions.

**View States:**
- `setup`: Initial player configuration
- `main`: Primary game interface
- `leaderboard`: Rankings by net worth
- `player-detail`: Individual player stats

**Rendering Strategy:**
- Full re-render on state changes (simple, no virtual DOM)
- Event listeners attached after each render
- Null checks for game instance (setup vs gameplay)

**Key UI Sections:**
```typescript
renderSetup()              // Player names, rounds config
renderMainView()           // Game board
renderGameInfo()           // Round/turn info
renderAllPlayersInfo()     // Player table
renderMarketNews()         // Events with severity badges
renderStockList()          // Available stocks
renderPortfolio()          // Current holdings
renderTradePanel()         // Buy/sell controls
renderLeaderboard()        // Rankings
renderPlayerDetail()       // Full player view
```

**Design Decision:** Functional rendering approach - each section is a pure function returning HTML strings.

## 🎯 Key Game Mechanics

### Turn System
```
Round = 3 turns per player
Turn = Single action (buy/sell/skip) per player

Example with 2 players:
Round 1:
  - P1 Turn 1 → P2 Turn 1 → P1 Turn 2 → P2 Turn 2 → P1 Turn 3 → P2 Turn 3
  - [Round ends, prices update, events occur]
Round 2:
  - P1 Turn 1 → P2 Turn 1 → ...
```

### Event Generation Per Turn
- 3 events generated before each player's turn
- Events applied sequentially
- Each event tracks price diff (absolute dollar change)
- All events for a round stored in `roundEvents`
- Total price diff can be calculated by summing all event price diffs

### Event Impact Calculation
```typescript
1. Store pre-event prices
2. Apply event to market
3. Calculate absolute price change (priceDiff)
4. Calculate percentage change (actualImpact)
5. Store event with turn number
6. Add to round events collection
```

This allows players to see exact impact of each event and calculate cumulative round impact.

### End of Round Flow
```typescript
End of Round:
1. Process corporate actions
2. Generate corporate action
3. Update stock prices
4. Determine if game over
```

### Market Condition States
```typescript
Normal → Event → Condition Change
  Crash → Bear
  Bull Run → Bull
  High/Extreme Severity → Volatile
  Every 3 rounds → Return to Normal
```

## 🎨 UI/UX Decisions

### Color System
- **Stock Colors**: Pastel palette for easy differentiation
- **Event Colors**: Severity-based (gray/yellow/orange/red)
- **Market Conditions**: Match sentiment (green bull, red bear)
- **Leaderboard**: Gold/silver/bronze for top 3

### Information Hierarchy
1. **Primary**: Current turn, market news, your portfolio
2. **Secondary**: All players, stock list, leaderboard access
3. **Tertiary**: Player details, action history

### Interaction Patterns
- **Click player names** → View details
- **Disabled buttons** → After action taken
- **Color feedback** → Success (green), failure (red)
- **Stock colors** → Pastel palette for easy identification

## 🔄 State Management

### Game State Updates
```typescript
Immutable updates for:
- Stock prices (new values calculated)
- Events (new objects added)
- Round events (stored in dictionary)

Mutable updates for:
- Player portfolios (direct modification)
- Current player index (simple increment)
- Turn/round counters (simple increment)
```

**Design Decision:** Hybrid approach - immutable for complex objects, mutable for simple state.

### State Flow
```
User Action → UI Handler → Game Engine → System Layer → State Update → UI Re-render
```

## 🧪 Testing Considerations

### Manual Testing Checklist
- [ ] Multiplayer setup (1-4 players)
- [ ] Turn rotation works correctly
- [ ] Prices update only at round end
- [ ] Events generate with correct frequency
- [ ] Crashes/bull runs are rare
- [ ] Events generate correctly (3 per turn)
- [ ] Corporate actions process correctly
- [ ] Leaderboard updates in real-time
- [ ] Player details show accurate data
- [ ] Game over shows final rankings

### Edge Cases Handled
- Empty player name → Filtered out
- Insufficient cash → Transaction rejected
- Insufficient shares → Sell rejected
- Stock sold out → Buy rejected (200k limit)
- Right issue declined → Removed from pending
- No event → Random fluctuations apply
- All events used → Pool resets

## 🚀 Performance Considerations

### Optimizations
- **Event pooling**: Reuse events when pool exhausted
- **Lazy rendering**: Only render current view
- **Minimal DOM updates**: Full re-render is fast enough for this game
- **No animations**: Instant feedback for snappy feel

### Scalability Limits
- **Players**: 1-4 (UI designed for this range)
- **Stocks**: 6 (manageable portfolio size)
- **Rounds**: 5-20 (reasonable game length)
- **Events**: 15+ in pool (enough variety)

## 📊 Data Structures

### Key Data Structures

**Player Portfolio**: Array of holdings
```typescript
portfolio: StockHolding[] = [
  { symbol: 'TECH', quantity: 100, averageCost: 95.50 },
  { symbol: 'BANK', quantity: 200, averageCost: 48.25 }
]
```

**Action History**: Chronological log
```typescript
actionHistory: TurnAction[] = [
  { round: 1, turn: 1, action: {type: 'buy'}, price: 100, ... },
  { round: 1, turn: 2, action: {type: 'sell'}, price: 105, ... }
]
```

**Event History**: All events that occurred
```typescript
eventHistory: MarketEvent[] = [
  { type: 'positive', severity: 'medium', actualImpact: {...} },
  { type: 'crash', severity: 'extreme', actualImpact: {...} }
]
```

## 🔧 Configuration

### Adjustable Parameters
```typescript
// In game.ts constructor
maxRounds: number = 10          // Game length
turnsPerRound: number = 3       // Turns per player

// In player.ts
startingCash: number = 10000    // Initial capital

// In market.ts
maxQuantity: number = 200000    // Stock availability

// In events.ts
crashChance: number = 0.05      // 5%
bullRunChance: number = 0.05    // 5%
eventChance: number = 0.7       // 70%
```

### Adding New Features

**New Stock:**
```typescript
// In market.ts initializeStocks()
{
  symbol: 'REAL',
  name: 'RealEstate',
  price: 80,
  sector: 'Real Estate',
  color: '#E8D4FF',
  // ...
}
```

**New Achievement (Future Implementation):**
```typescript
// Achievement system removed for now
// Can be re-added in future with Achievement interface
```

**New Event:**
```typescript
// In events.ts createEventPool()
{
  id: 'new-event',
  type: 'positive',
  severity: 'medium',
  title: 'Event Title',
  description: 'What happened',
  affectedSectors: ['Technology'],
  impactRange: [10, 20]
}
```

## 🐛 Debugging Tips

### Common Issues
1. **Prices not updating**: Check endTurn() round completion logic
2. **Events not generating**: Verify 3 events per turn in endTurn()
3. **Wrong player turn**: Check currentPlayerIndex increment logic
4. **Event not showing impact**: Ensure actualImpact and priceDiff calculated before render

### Debug Helpers
```typescript
// In browser console
console.log(game.getGameState())         // Full state
console.log(game.getPlayerRankings())    // Current rankings
console.log(game.getCurrentPlayer())     // Active player
```

## 📝 Development Process

### Built With Claude AI
This game was developed entirely through conversation with Claude (Anthropic's AI assistant).

**Development Approach:**
1. Requirements gathering through conversation
2. Incremental feature implementation
3. Iterative refinement based on feedback
4. Complete documentation generation

**Claude's Role:**
- Architecture design
- Code implementation
- Bug fixing
- Feature enhancement
- Documentation writing

## 🎓 Learning Outcomes

### Technical Skills Demonstrated
- TypeScript type system usage
- Object-oriented design patterns
- Event-driven architecture
- State management
- UI rendering strategies
- Game logic implementation

### Design Patterns Used
- **Module Pattern**: Separate concerns into classes
- **Strategy Pattern**: Weighted event selection
- **Observer Pattern**: UI updates on state change
- **Factory Pattern**: Player/stock creation
- **Command Pattern**: Trade actions

## 🔮 Architecture for Future Features

### Extensibility Points

**1. New Game Modes:**
```typescript
// In game.ts
enum GameMode { Standard, TimeAttack, Challenge }
constructor(playerNames, rounds, mode: GameMode)
```

**2. AI Opponents:**
```typescript
// New file: ai.ts
class AIPlayer {
  decideTrade(state: GameState): TradeAction
}
```

**3. Persistence:**
```typescript
// New file: storage.ts
saveGame(state: GameState): void
loadGame(): GameState
```

**4. Analytics:**
```typescript
// New file: analytics.ts
class GameAnalytics {
  trackEvent(event: string, data: any): void
  generateReport(): Report
}
```

## 📖 Code Style Guidelines

### Conventions Used
- **Naming**: camelCase for variables/methods, PascalCase for classes/interfaces
- **File Organization**: One class/system per file
- **Comments**: Minimal - code should be self-documenting
- **Type Annotations**: Always explicit, never use `any`
- **Arrow Functions**: Preferred for callbacks and inline functions

### Best Practices Applied
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Fail-fast validation
- Defensive programming (null checks)
- Pure functions where possible

## 🤝 Contributing Guidelines

### Adding Features
1. Update types.ts first (define data structures)
2. Implement logic in appropriate system file
3. Update game.ts if orchestration needed
4. Add UI rendering in ui.ts
5. Update README.md with feature documentation

### Code Quality
- Maintain TypeScript strict mode
- Follow existing patterns
- Add comments for complex logic
- Test edge cases manually

---

## 📚 Additional Resources

### TypeScript Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Guide](https://vitejs.dev/guide/)

### Game Design References
- Turn-based game mechanics
- Stock market simulation concepts
- Achievement system design patterns

---

**This codebase represents a clean, maintainable implementation of a multiplayer turn-based stock trading game with rich features and extensibility.**