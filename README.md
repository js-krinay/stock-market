# 🎮 Stock Market Game

A turn-based multiplayer stock trading game built with TypeScript and Vite. Compete against friends to build the best portfolio while navigating market events, crashes, and bull runs!

## 🌟 Features

### 💼 Core Gameplay
- **Multiplayer Support**: 1-4 players competing head-to-head
- **Turn-Based Trading**: Each player gets 3 turns per round
- **6 Stock Sectors**: Technology, Finance, Energy, Healthcare, Consumer, Automotive
- **Buy/Sell/Skip Actions**: Simple yet strategic gameplay

### 📊 Market Dynamics
- **Dynamic Events**: Low, medium, high, and extreme severity news
- **Market Crashes**: Rare catastrophic events (-20% to -35%)
- **Bull Runs**: Massive rallies (+20% to +35%)
- **Market Conditions**: Normal, Bull, Bear, Volatile states
- **Event Impact Tracking**: See exactly how each event affected stock prices

### 🏢 Corporate Actions
- **Dividends**: Automatic payouts to shareholders
- **Right Issues**: Discounted share offers to existing holders
- **Bonus Issues**: Free shares for shareholders

### 📈 Game Features
- **Real-time Leaderboard**: Track rankings by net worth
- **Player Details**: View portfolios and complete trade history
- **Color-Coded Stocks**: Easy visual identification with pastel colors
- **Action History**: Complete audit trail of all trades
- **Market News Feed**: Stay informed about market conditions
- **3 Events Per Turn**: Dynamic market changes before each player's turn

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 How to Play

### Game Setup
1. Launch the game and enter player names (1-4 players)
2. Choose number of rounds (5-20)
3. Click "Start Game"

### During Your Turn
- **Buy**: Purchase stocks with available cash
- **Sell**: Sell stocks from your portfolio
- **Skip**: Pass your turn
- **End Turn**: Move to next player after you've acted

### Winning
- Player with highest **net worth** (cash + portfolio value) wins!
- Net worth = Cash in hand + Total portfolio value

### Strategy Tips
- 💡 Diversify across sectors to reduce risk
- 📰 Pay attention to market news and severity
- 🐻 Hold cash during bear markets
- 🐂 Invest heavily during bull runs
- 💎 Don't panic sell during crashes

## 📊 Stock Information

Each stock has:
- **Symbol**: Short identifier (e.g., TECH, BANK)
- **Name**: Company name
- **Sector**: Industry category
- **Price**: Current trading price
- **Available Quantity**: Max 200,000 units per stock
- **Color**: Unique pastel color for easy identification

## 🎲 Events & Market Conditions

### Event Severity Levels
- **Low** (Common): 3-8% price impact
- **Medium** (Moderate): 7-18% price impact
- **High** (Rare): 15-28% price impact
- **Extreme** (Very Rare): 20-35% price impact

### Market Conditions
- 📊 **Normal**: Standard market volatility
- 🐂 **Bull**: Rising market, optimistic sentiment
- 🐻 **Bear**: Falling market, pessimistic sentiment
- ⚡ **Volatile**: Unpredictable large swings

### Special Events
- **💥 Market Crash**: 5% chance after round 2, affects all sectors
- **🚀 Bull Run**: 5% chance after round 2, boosts all sectors

## 📱 User Interface

### Main Game Screen
- **Game Info**: Current round/turn, player indicator
- **Players Table**: All players' cash and holdings
- **Market News**: Latest events with severity and impact
- **Stock Market**: All stocks with prices and availability
- **Portfolio**: Your current holdings and P/L
- **Trade Panel**: Buy/Sell/Skip controls

### Leaderboard
- Rankings by net worth
- Gold/Silver/Bronze highlighting for top 3
- Click player names for details

### Player Details
- Summary: Cash, portfolio value, net worth
- Portfolio: Current holdings with P/L
- Action History: Complete trade log with timestamps

## 🛠️ Technology Stack

- **TypeScript**: Type-safe game logic
- **Vite**: Fast development and building
- **Vanilla JS**: No framework dependencies
- **CSS**: Inline styles for simplicity

## 📁 Project Structure

```
stock-market/
├── src/
│   ├── corporateActions.ts  # Dividends, rights, bonus
│   ├── events.ts            # Market events & news (3 per turn)
│   ├── game.ts              # Core game engine
│   ├── market.ts            # Stock market logic
│   ├── player.ts            # Player management
│   ├── types.ts             # TypeScript interfaces
│   ├── ui.ts                # User interface
│   └── main.ts              # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md                # Technical documentation
```

## 🎨 Game Design

### Color Scheme
- **TECH** (Technology): Light Blue `#B4D7FF`
- **BANK** (Finance): Peach `#FFD4B4`
- **ENRG** (Energy): Light Yellow `#FFFAB4`
- **HLTH** (Healthcare): Light Green `#C4FFB4`
- **FOOD** (Consumer): Light Pink `#FFB4E8`
- **AUTO** (Automotive): Light Purple `#D4B4FF`

### Market Condition Colors
- 📊 Normal: Light Blue
- 🐂 Bull: Green
- 🐻 Bear: Red
- ⚡ Volatile: Yellow

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - Feel free to use and modify

## 🎮 Game Mechanics Details

### Starting Capital
- Each player starts with **$10,000**

### Stock Quantities
- Maximum **200,000 units** per stock
- Quantities decrease when bought, increase when sold

### Round Structure
- **3 turns per round** per player
- Players alternate turns (P1→P2→P3→P4→P1...)
- Prices update **only at round end**
- Corporate actions process between rounds

### Price Calculation
- Base prices set at game start
- 3 events apply changes before each turn
- Minimum price change: ±$1
- Each event tracks absolute price diff
- Prices can reach $0 (stocks become untradeable)

## 🐛 Known Issues

None currently! Report issues if you find any.

## 🔮 Future Enhancements

Potential features for future versions:
- Achievement/Badge system
- Charts and price history graphs
- Save/Load game state
- More stocks and sectors
- Options trading
- Short selling
- Online multiplayer
- AI opponents

## 📞 Support

For questions or issues, please check the CLAUDE.md file for development details.

---

**Enjoy the game and happy trading!** 📈💰