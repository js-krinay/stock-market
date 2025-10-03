-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "maxRounds" INTEGER NOT NULL,
    "currentTurnInRound" INTEGER NOT NULL DEFAULT 1,
    "turnsPerRound" INTEGER NOT NULL DEFAULT 3,
    "currentPlayerIndex" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cash" REAL NOT NULL DEFAULT 10000,
    "currentTurnIndex" INTEGER NOT NULL DEFAULT 0,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "directorId" TEXT,
    "chairmanId" TEXT,
    "directorSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chairmanSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stock_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Stock_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stock_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockHolding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averageCost" REAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    CONSTRAINT "StockHolding_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockHolding_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "round" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "stockId" TEXT NOT NULL,
    CONSTRAINT "PriceHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TurnAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "round" INTEGER NOT NULL,
    "turn" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "symbol" TEXT,
    "quantity" INTEGER,
    "price" REAL,
    "totalValue" REAL,
    "result" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corporateActionId" TEXT,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "TurnAction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedStocks" TEXT NOT NULL,
    "impact" REAL NOT NULL,
    "round" INTEGER NOT NULL,
    "turn" INTEGER,
    "playerId" TEXT,
    "priceDiff" TEXT,
    "actualImpact" TEXT,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "MarketEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorporateAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "symbol" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "createdAtTurn" INTEGER NOT NULL,
    "playersProcessed" TEXT NOT NULL,
    "playerId" TEXT,
    "played" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'pending',
    "expiresAtPlayerId" TEXT,
    "eligiblePlayerIds" TEXT,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "CorporateAction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "eventId" TEXT,
    "corporateActionId" TEXT,
    CONSTRAINT "GameCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameCard_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameCard_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MarketEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameCard_corporateActionId_fkey" FOREIGN KEY ("corporateActionId") REFERENCES "CorporateAction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Player_gameId_idx" ON "Player"("gameId");

-- CreateIndex
CREATE INDEX "Stock_gameId_idx" ON "Stock"("gameId");

-- CreateIndex
CREATE INDEX "Stock_directorId_idx" ON "Stock"("directorId");

-- CreateIndex
CREATE INDEX "Stock_chairmanId_idx" ON "Stock"("chairmanId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_gameId_symbol_key" ON "Stock"("gameId", "symbol");

-- CreateIndex
CREATE INDEX "StockHolding_playerId_idx" ON "StockHolding"("playerId");

-- CreateIndex
CREATE INDEX "StockHolding_stockId_idx" ON "StockHolding"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "StockHolding_playerId_symbol_key" ON "StockHolding"("playerId", "symbol");

-- CreateIndex
CREATE INDEX "PriceHistory_stockId_idx" ON "PriceHistory"("stockId");

-- CreateIndex
CREATE INDEX "TurnAction_playerId_idx" ON "TurnAction"("playerId");

-- CreateIndex
CREATE INDEX "MarketEvent_gameId_idx" ON "MarketEvent"("gameId");

-- CreateIndex
CREATE INDEX "CorporateAction_gameId_idx" ON "CorporateAction"("gameId");

-- CreateIndex
CREATE INDEX "GameCard_playerId_idx" ON "GameCard"("playerId");

-- CreateIndex
CREATE INDEX "GameCard_gameId_idx" ON "GameCard"("gameId");

-- CreateIndex
CREATE INDEX "GameCard_eventId_idx" ON "GameCard"("eventId");

-- CreateIndex
CREATE INDEX "GameCard_corporateActionId_idx" ON "GameCard"("corporateActionId");
