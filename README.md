# 🎮 Stock Market Game

A turn-based multiplayer stock trading game with **server-side game logic** and **database persistence**. Built with **TypeScript, tRPC, Prisma, React, and SQLite**. Compete against friends to build the best portfolio while navigating market events, crashes, and bull runs!

## 🌟 Features

### 💼 Core Gameplay
- **Multiplayer Support**: 2-24 players competing head-to-head
- **Turn-Based Trading**: Each player gets 3 turns per round
- **6 Stock Sectors**: Technology, Finance, Energy, Healthcare, Consumer, Automotive
- **Buy/Sell/Skip Actions**: Simple yet strategic gameplay
- **Card System**: 10 cards per player per round (90% events, 10% corporate actions)

### 📊 Market Dynamics
- **Dynamic Events**: Low, medium, high, and extreme severity news
- **Market Crashes**: Rare catastrophic events (-35 impact)
- **Bull Runs**: Massive rallies (+35 impact)
- **Event Impact Tracking**: See exactly how each event affected stock prices
- **Cumulative Round Effects**: All events apply at round end
- **54 Unique Events**: Varied across all sectors with different volatility levels

### 🏢 Corporate Actions
- **Dividends**: Automatic cash payouts to all shareholders
- **Right Issues**: Discounted share offers to existing holders (1:2 ratio)
- **Bonus Issues**: Free shares to shareholders (1:5 ratio)
- **Player Choice**: Accept or decline right issues

### 📈 Advanced Features
- **Server-Side Logic**: All game rules validated on server - no cheating possible
- **Database Persistence**: Games saved to SQLite and can be resumed
- **Real-time Leaderboard**: Track rankings by net worth
- **Leadership Tracking**: Director (≥25%) and Chairman (≥50%) ownership status
- **Type-Safe API**: End-to-end TypeScript with tRPC for compile-time safety
- **Complete Audit Trail**: Full action history logged in database
- **Price History**: Track price changes over rounds

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start both server and client
npm run dev:all
```

The game will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/trpc

### Alternative: Run Separately

**Terminal 1 - Start Backend Server:**
```bash
npm run dev:server
```

**Terminal 2 - Start Frontend Client:**
```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 How to Play

### Game Setup
1. Open http://localhost:5173 in your browser
2. Enter player names (2-24 players supported)
3. Choose number of rounds (1-50, recommended 5-10)
4. Click "Start Game"

### During Your Turn
Each turn you receive a **card** (event or corporate action):
- **Event Cards** (90%): Market events that will affect prices at round end
- **Corporate Action Cards** (10%): Special actions you can play immediately

Your turn options:
- **Buy**: Purchase stocks with available cash
- **Sell**: Sell stocks from your portfolio
- **Play Corporate Action**: Use a corporate action card on a selected stock
- **Skip**: Pass your turn

Turn automatically ends after you take an action.

### Round End
- All accumulated events apply to stock prices
- Unplayed corporate actions auto-apply (dividends & bonus issues only)
- New cards generated for next round
- Game continues until max rounds reached

### Winning
- Player with highest **net worth** (cash + portfolio value) wins!
- Net worth = Cash in hand + (Stock Holdings × Current Price)

### Strategy Tips
- 💡 Diversify across sectors to reduce risk
- 📰 Watch event cards - they show what's coming
- 🎴 Time corporate actions strategically
- 🏆 Leadership positions (director/chairman) track your influence
- 💎 Don't panic sell - prices update at round end

## 📊 Stock Information

Each stock has:
- **Symbol**: Short identifier (e.g., TECH, BANK)
- **Name**: Company name
- **Sector**: Industry category (affects event impacts)
- **Price**: Current trading price
- **Available Quantity**: Max 200,000 units per stock
- **Color**: Unique pastel color for easy identification
- **Price History**: Historical prices by round

### Stock Volatility by Sector
- **Automotive**: Lowest volatility (±5 to ±10)
- **Energy**: Low-medium volatility (±5 to ±15)
- **Consumer**: Medium volatility (±5 to ±20)
- **Healthcare**: Medium-high volatility (±5 to ±20)
- **Technology**: High volatility (±5 to ±25)
- **Finance**: Highest volatility (±5 to ±30)

## 🎲 Card System

### Event Cards (90% of cards)
- Show upcoming market events
- Events accumulate during the round
- All apply at round end
- Track exact price impact per stock

### Corporate Action Cards (10% of cards)
- **Dividend Card**: Declare dividend for a stock (all shareholders get paid)
- **Right Issue Card**: Offer discounted shares (1 new share per 2 held)
- **Bonus Issue Card**: Issue free shares (1 bonus per 5 held)

### Card Distribution
- **10 cards per player per round**
- Cards shown one at a time (one per turn)
- Unplayed corporate actions may auto-apply at round end

## 🎲 Events & Market Mechanics

### Event Severity Levels
- **Low** (Most Common): ±5 impact
- **Medium** (Moderate): ±10 to ±15 impact
- **High** (Rare): ±20 to ±25 impact
- **Extreme** (Very Rare): ±30 to ±35 impact

### Special Events
- **💥 Market Crash**: 5% chance after round 2, -35 impact to sector
- **🚀 Bull Run**: 5% chance after round 2, +35 impact to sector

### Event Application
- Events shown one per turn via cards
- All accumulated events apply at round end
- Each event affects specific sectors
- Exact dollar impact tracked (not percentage)

## 📱 User Interface

### Setup Screen
- Enter player names (2-24 supported)
- Select number of rounds
- Start game button

### Main Game Screen
- **Game Header**: Round/turn info, leaderboard button
- **Stock Market Table**: All stocks with prices, colors, availability
- **Trade Panel**: Buy/sell controls, corporate action cards
- **Portfolio Table**: Your holdings with P/L calculation
- **All Players Table**: Everyone's cash and net worth
- **Event Card Display**: Current card shown prominently

### Leaderboard
- Rankings by net worth
- 🥇🥈🥉 Medals for top 3
- View at any time during game
- Auto-shown at game end

### Player Cards & Logs
- View all cards for any player
- See complete action history
- Track dividends and bonuses received

## 🛠️ Technology Stack

### Backend
- **TypeScript**: Type-safe server logic
- **Express**: Web server framework
- **tRPC**: End-to-end typesafe APIs
- **Prisma**: Modern ORM for database access
- **SQLite**: Embedded SQL database
- **Zod**: Runtime type validation

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe client code
- **TanStack Query**: Data fetching and caching
- **Zustand**: Lightweight state management
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Re-usable UI components
- **Sonner**: Toast notifications

## 🏛️ Architecture Highlights

### Modern Service Architecture

- **Interface-based design**: Services depend on abstractions, not implementations
- **Singleton pattern**: Centralized service management via ServiceContainer
- **Clean separation**: Clear boundaries between layers (UI → API → Services → Utils → Data)
- **Type-safe**: End-to-end TypeScript with tRPC for client-server communication

### Key Patterns

- ✅ **Facade Pattern**: GameService provides unified interface
- ✅ **Dependency Injection**: Services receive dependencies via constructor
- ✅ **Service Layer**: Business logic isolated from API and data layers
- ✅ **Pure Functions**: Utils contain only deterministic calculations
- ✅ **Singleton**: Single service instances managed by container

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## 📁 Project Structure

```
stock-market/
├── server/                    # Backend (Node.js + Express + tRPC)
│   ├── db.ts                 # Prisma client setup
│   ├── trpc.ts               # tRPC configuration
│   ├── index.ts              # Express server entry
│   ├── services/
│   │   └── gameService.ts    # Game logic (1200+ lines)
│   └── routers/
│       ├── _app.ts           # Main tRPC router
│       └── gameRouter.ts     # Game API procedures
│
├── prisma/
│   ├── schema.prisma         # Database schema (12 models)
│   └── dev.db               # SQLite database (auto-created)
│
├── src/                      # Frontend (React + Vite)
│   ├── components/          # UI components
│   │   ├── SetupScreen.tsx
│   │   ├── FullGameScreen.tsx
│   │   ├── TradePanel.tsx
│   │   ├── Leaderboard.tsx
│   │   └── ...
│   ├── store/
│   │   └── gameStore.ts     # Zustand state
│   ├── utils/
│   │   └── trpc.ts          # tRPC React client
│   ├── types.ts             # Shared TypeScript types
│   └── main.tsx             # React entry point
│
├── package.json
├── tsconfig.json
├── README.md                # This file
├── QUICKSTART.md            # Quick start guide
├── MIGRATION_COMPLETE.md    # Migration details
└── CLAUDE.md                # Original technical docs
```

## 🎨 Game Design

### Color Scheme
- **TECH** (Technology): Light Blue `#B4D7FF`
- **BANK** (Finance): Peach `#FFD4B4`
- **ENRG** (Energy): Light Yellow `#FFFAB4`
- **HLTH** (Healthcare): Light Green `#C4FFB4`
- **FOOD** (Consumer): Light Pink `#FFB4E8`
- **AUTO** (Automotive): Light Purple `#D4B4FF`

## 🎮 Game Mechanics Details

### Starting Capital
- Each player starts with **$10,000** cash

### Stock Quantities
- Maximum **200,000 units** per stock
- Quantities decrease when bought, increase when sold
- Tracked server-side per stock

### Round Structure
- **3 turns per round** per player
- Players rotate turns (P1→P2→...→P1→P2→...)
- 10 cards dealt to each player per round
- Events accumulate and apply at round end
- Corporate actions can be played anytime during round

### Turn Flow
1. Player's card is revealed
2. Event card → adds to accumulated events
3. Corporate action card → player can choose to play it
4. Player takes action (buy/sell/skip/play corporate action)
5. Turn automatically ends
6. Next player's turn begins

### Round End Flow
1. All accumulated events apply to stock prices
2. Unplayed dividends/bonus issues auto-apply
3. Price history recorded
4. Check if game over
5. If not, generate new cards and start next round

### Price Calculation
- Events apply exact dollar amounts (not percentages)
- Multiple events cumulative at round end
- Minimum price: $0 (stocks become untradeable)
- No maximum price

### Leadership Tracking
- **Director**: Own ≥25% of total stock units
- **Chairman**: Own ≥50% of total stock units
- Only one player can hold each title per stock
- Tracked in database, shown in UI

## 🗄️ Database

### View Database
```bash
npx prisma studio
```

Opens Prisma Studio at http://localhost:5555 to browse all game data.

### Reset Database
```bash
rm prisma/dev.db
npx prisma db push
```

### Database Schema
12 models storing complete game state:
- Game, Player, Stock, StockHolding
- TurnAction, MarketEvent, CorporateAction
- GameCard, StockLeadership, PriceHistory
- AccumulatedEvent, AccumulatedCorporateAction

## 🔧 Development

### Run Tests
```bash
npm run test
```

### Format Code
```bash
npm run format
```

### Type Check
```bash
npm run build
```

## 🐛 Known Issues

None currently! The game is fully functional with server-side logic and database persistence.

## 🔮 Future Enhancements

### Easy to Add
- ✅ ~~Save/Load game state~~ (Already implemented via DB)
- Charts and price history graphs (data already stored)
- Game history browser
- More corporate action types
- Stock splits

### Medium Complexity
- Authentication (NextAuth.js)
- User profiles and stats
- Multiple concurrent games
- Migrate to PostgreSQL

### Advanced Features
- Real-time multiplayer (different devices)
- WebSocket live updates
- AI opponents
- Tournament system
- Short selling
- Options trading

## 📞 Support

- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
- **Migration Details**: See [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)
- **Technical Docs**: See [CLAUDE.md](CLAUDE.md)

## 📄 License

MIT License - Feel free to use and modify

---

## 🚀 Quick Start

```bash
# Install and start
npm install
npm run dev:all

# Open http://localhost:5173
```

**Enjoy the game and happy trading!** 📈💰
