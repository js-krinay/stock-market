import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore } from '@/store/gameStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const TOTAL_STEPS = 10

export function Tutorial() {
  const [currentStep, setCurrentStep] = useState(1)
  const setView = useGameStore((state) => state.setView)

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setView('setup')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-3xl">How to Play</CardTitle>
            <Badge variant="outline">
              Step {currentStep} of {TOTAL_STEPS}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[400px]">{renderStep(currentStep)}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Back to Setup
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>
              <Button onClick={handleNext} disabled={currentStep === TOTAL_STEPS}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function renderStep(step: number) {
  switch (step) {
    case 1:
      return <Step1Welcome />
    case 2:
      return <Step2GameStructure />
    case 3:
      return <Step3StartingCapital />
    case 4:
      return <Step4TurnActions />
    case 5:
      return <Step5CardsSystem />
    case 6:
      return <Step6MarketEvents />
    case 7:
      return <Step7StockPrices />
    case 8:
      return <Step8CorporateActions />
    case 9:
      return <Step9Leadership />
    case 10:
      return <Step10PortfolioWinning />
    default:
      return null
  }
}

function Step1Welcome() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Stock Market Game!</h2>
        <p className="text-lg text-muted-foreground">A turn-based stock trading competition</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-6">
        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span>🏆</span>
          <span>Objective</span>
        </h3>
        <p className="text-lg">
          Win by accumulating the <strong>highest net worth</strong> by the end of the game.
        </p>
        <p className="text-muted-foreground mt-2">
          Net Worth = Cash on Hand + Total Portfolio Value
        </p>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          This tutorial will guide you through all the game mechanics. Use the navigation buttons
          below to proceed through each step.
        </p>
      </div>
    </div>
  )
}

function Step2GameStructure() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold">Game Structure</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <span>🔄</span>
            <span>Rounds</span>
          </h3>
          <p className="text-muted-foreground">
            The game consists of multiple rounds (configurable between 5-20 rounds).
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <span>🎯</span>
            <span>Turns per Round</span>
          </h3>
          <p className="text-muted-foreground mb-2">
            Each player gets <strong>3 turns</strong> per round.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Example: In a 2-player game, one round = Player 1 → Player 2 → Player 1 → Player 2 →
            Player 1 → Player 2
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <span>⏱️</span>
            <span>Round End</span>
          </h3>
          <p className="text-muted-foreground">
            At the end of each round, stock prices are updated based on all events that occurred
            during the round.
          </p>
        </div>
      </div>
    </div>
  )
}

function Step3StartingCapital() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-2xl font-bold">Starting Capital</h2>
      </div>

      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <p className="text-lg text-muted-foreground mb-2">Each player begins with</p>
        <p className="text-4xl font-bold text-green-600 dark:text-green-400">$900,000</p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📈</div>
          <div>
            <p className="font-medium">Use your capital wisely</p>
            <p className="text-sm text-muted-foreground">
              Buy stocks when prices are low, sell when they're high
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl">💵</div>
          <div>
            <p className="font-medium">Cash reserves matter</p>
            <p className="text-sm text-muted-foreground">
              Keep some cash available for opportunities and corporate actions
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <p className="font-medium">Strategic investing</p>
            <p className="text-sm text-muted-foreground">
              Diversify or concentrate - both strategies can work
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4TurnActions() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold">Turn Actions</h2>
      </div>

      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
        <p className="font-semibold text-center">
          ⚡ Each turn, you choose <strong>ONE</strong> action:
        </p>
      </div>

      <div className="space-y-3">
        <div className="bg-card border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">🛒</div>
            <h3 className="font-semibold text-lg">Buy Stock</h3>
          </div>
          <p className="text-muted-foreground">
            Purchase shares of any available stock. You need sufficient cash.
          </p>
        </div>

        <div className="bg-card border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">💸</div>
            <h3 className="font-semibold text-lg">Sell Stock</h3>
          </div>
          <p className="text-muted-foreground">
            Sell shares you own to generate cash. You must own the shares you're selling.
          </p>
        </div>

        <div className="bg-card border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">🎴</div>
            <h3 className="font-semibold text-lg">Play Corporate Action</h3>
          </div>
          <p className="text-muted-foreground">
            Use a corporate action card from your hand (e.g., Rights Issue).
          </p>
        </div>

        <div className="bg-card border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">⏭️</div>
            <h3 className="font-semibold text-lg">Skip Turn</h3>
          </div>
          <p className="text-muted-foreground">
            Pass your turn without taking any action. Sometimes patience is strategic!
          </p>
        </div>
      </div>
    </div>
  )
}

function Step5CardsSystem() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎴</div>
        <h2 className="text-2xl font-bold">Cards System</h2>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <p className="text-center">
          Each player receives <strong>10 cards</strong> at the start of the game
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">📰</div>
            <h3 className="font-semibold text-lg">Event Cards (90%)</h3>
          </div>
          <p className="text-muted-foreground mb-2">
            Played automatically throughout the round. These cards create market events that affect
            stock prices.
          </p>
          <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>One event card is played automatically at the start of each turn</strong>
              </li>
              <li>Events are played throughout the round (one per turn)</li>
              <li>Events affect specific sectors/stocks</li>
              <li>Effects accumulate during the round</li>
              <li>Prices update at round end</li>
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🏢</div>
            <h3 className="font-semibold text-lg">Corporate Action Cards (10%)</h3>
          </div>
          <p className="text-muted-foreground mb-2">
            Optional cards you can play during your turn instead of buying/selling stock.
          </p>
          <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Examples:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Rights Issues - Buy discounted shares</li>
              <li>Bonus Issues - Receive free shares</li>
              <li>Dividends - Cash payouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step6MarketEvents() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-2xl font-bold">Market Events</h2>
      </div>

      <p className="text-muted-foreground">
        Events drive price changes in the market. Each event has a type, severity, and impact on
        specific stocks.
      </p>

      <div className="space-y-3">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Event Types</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Positive
              </Badge>
              <span className="text-sm text-muted-foreground">Increases stock prices</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Negative</Badge>
              <span className="text-sm text-muted-foreground">Decreases stock prices</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Severity Levels</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Low</Badge>
              <span className="text-sm text-muted-foreground">Small impact</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Medium</Badge>
              <span className="text-sm text-muted-foreground">Moderate impact</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">High</Badge>
              <span className="text-sm text-muted-foreground">Large impact</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="destructive">Extreme</Badge>
              <span className="text-sm text-muted-foreground">Major impact (crash/bull run)</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>⚡</span>
            <span>Special Events</span>
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              📉 <strong>Market Crash</strong>: Severe negative impact on affected stocks
            </li>
            <li>
              📈 <strong>Bull Run</strong>: Major positive impact on affected stocks
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step7StockPrices() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold">Stock Prices</h2>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
        <p className="text-center font-semibold">
          Stock prices update <strong>at the end of each round</strong>
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>📈</span>
            <span>How Price Updates Work</span>
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Events are played throughout the round (one per turn)</li>
            <li>Each event has an impact percentage on affected stocks</li>
            <li>All event impacts accumulate during the round</li>
            <li>At round end, all accumulated effects are applied at once</li>
            <li>Stock prices are updated based on total accumulated impact</li>
          </ol>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Strategic Implications</span>
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                Watch events during the round to predict price changes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                Buy stocks before positive events, sell before negative ones
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                As a leader, you can exclude events to protect your investments
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step8CorporateActions() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🏢</div>
        <h2 className="text-2xl font-bold">Corporate Actions</h2>
      </div>

      <p className="text-muted-foreground">
        Corporate actions provide special opportunities to enhance your portfolio.
      </p>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>How Corporate Actions Work</span>
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              When you play a corporate action card, <strong>you choose which stock</strong> it applies to
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              The action benefits <strong>all stockholders</strong> of that chosen stock, not just you
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              Strategic tip: Choose stocks where you own the most shares to maximize your benefit!
            </span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <div className="bg-card border-2 border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">💵</div>
            <div>
              <h3 className="font-semibold text-lg">Dividends</h3>
              <Badge variant="secondary" className="text-xs">
                Automatic
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground mb-2">
            Cash payments to shareholders based on holdings
          </p>
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">
              Payment: <strong>5%</strong> of stock price per share
            </p>
            <p className="text-muted-foreground mt-1">
              Applied automatically when you receive a dividend card
            </p>
          </div>
        </div>

        <div className="bg-card border-2 border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🎟️</div>
            <div>
              <h3 className="font-semibold text-lg">Rights Issues</h3>
              <Badge variant="default" className="text-xs">
                Player Choice
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground mb-2">
            Opportunity to buy discounted shares of a stock you own
          </p>
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">
              Discount: <strong>50%</strong> of market price
            </p>
            <p className="text-muted-foreground mt-1">
              You choose whether to accept or decline. Playing this card uses your turn action.
            </p>
          </div>
        </div>

        <div className="bg-card border-2 border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🎁</div>
            <div>
              <h3 className="font-semibold text-lg">Bonus Issues</h3>
              <Badge variant="secondary" className="text-xs">
                Automatic
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground mb-2">Free shares distributed to existing holders</p>
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">Free shares based on your holdings</p>
            <p className="text-muted-foreground mt-1">
              Automatically applied - increases your share count
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step9Leadership() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">👑</div>
        <h2 className="text-2xl font-bold">Leadership System</h2>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <p className="text-center font-semibold">
          Own enough shares to become a stock leader and gain event exclusion powers!
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border-2 border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">👑</div>
            <div>
              <h3 className="font-semibold text-lg">Chairman</h3>
              <Badge variant="default" className="bg-yellow-600">
                ≥50% Ownership
              </Badge>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Most Powerful Position:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Can exclude ANY event affecting their stock</li>
              <li>Events from any player's hand can be blocked</li>
              <li>Only one chairman per stock</li>
            </ul>
          </div>
        </div>

        <div className="bg-card border-2 border-blue-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">📋</div>
            <div>
              <h3 className="font-semibold text-lg">Director</h3>
              <Badge variant="secondary">≥25% Ownership</Badge>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Limited Powers:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Can ONLY exclude events from their own hand</li>
              <li>Only active when NO chairman exists for that stock</li>
              <li>Still valuable for protecting investments</li>
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span>Exclusion Phase</span>
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Happens at the end of each round, before prices update</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Each leader can exclude ONE event per stock they lead</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Excluded events will not affect stock prices that round</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Leadership recalculates after every trade</span>
            </li>
          </ul>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>Strategic Importance</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Leadership positions give you control over the market. Build large positions in stocks
            to become a chairman and protect your investments from negative events!
          </p>
        </div>
      </div>
    </div>
  )
}

function Step10PortfolioWinning() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold">Portfolio & Winning</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Portfolio Tracking</span>
          </h3>
          <p className="text-muted-foreground mb-3">The game tracks multiple metrics for you:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Holdings:</strong> Quantity of shares owned for each stock
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Average Cost:</strong> Your average purchase price per share
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Current Value:</strong> Current market value of your holdings
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Profit/Loss:</strong> Unrealized gains or losses on each position
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>💰</span>
            <span>Net Worth Calculation</span>
          </h3>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cash on Hand</span>
              <span className="font-mono">$XXX,XXX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Portfolio Value</span>
              <span className="font-mono">$XXX,XXX</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Net Worth</span>
              <span className="font-mono font-bold text-primary">$XXX,XXX</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
            <span>🏆</span>
            <span>Winning the Game</span>
          </h3>
          <p className="text-muted-foreground mb-3">
            After all rounds are complete, players are ranked by total net worth.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">1st Place</Badge>
              <span>Highest Net Worth</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-400">2nd Place</Badge>
              <span>Second Highest Net Worth</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600">3rd Place</Badge>
              <span>Third Highest Net Worth</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="font-semibold text-lg">🎮 Ready to Play?</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click "Back to Setup" to configure your game and start trading!
          </p>
        </div>
      </div>
    </div>
  )
}
