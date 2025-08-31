import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertStrategySchema, insertAccountSchema, insertBacktestSchema, insertAlertSchema } from "@shared/schema";
import { strategyEngine } from "./services/strategy-engine";
import { riskManager } from "./services/risk-manager";
import { orderManager } from "./services/order-manager";
import { marketDataService } from "./services/market-data";
import { Request, Response } from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Import services
  const { telegramBot } = await import("./services/telegram-bot");

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Dashboard API
  app.get("/api/dashboard", async (req, res) => {
    try {
      console.log('Dashboard API called');
      // Return mock dashboard data for now
      const dashboardData = {
        account: {
          balance: "50000.00",
          equity: "52350.75",
          dailyPnL: "+2350.75",
          openPnL: "+1250.50"
        },
        risk: {
          dailyDrawdown: 0.05,
          dailyDrawdownPercent: 5,
          maxDrawdown: 0.15,
          totalExposure: 0.35
        },
        strategies: [
          {
            id: "1",
            name: "Breakout Volatility",
            status: "RUNNING",
            pnl: "+1250.50",
            positions: 3
          }
        ],
        openPositions: [
          {
            id: "1",
            symbol: "EURUSD",
            side: "BUY",
            size: 10000,
            entryPrice: 1.0850,
            currentPrice: 1.0875,
            pnl: "+25.00",
            timestamp: new Date().toISOString()
          }
        ],
        recentTrades: [
          {
            id: "1",
            symbol: "GBPUSD",
            side: "SELL",
            size: 5000,
            entryPrice: 1.2650,
            exitPrice: 1.2625,
            pnl: "+125.00",
            timestamp: new Date(Date.now() - 300000).toISOString()
          }
        ],
        systemHealth: [
          {
            component: "Market Data",
            status: "HEALTHY",
            latency: "12ms"
          },
          {
            component: "Order Management",
            status: "HEALTHY",
            latency: "8ms"
          }
        ],
        alerts: [
          {
            id: "1",
            type: "INFO",
            message: "Strategy Breakout Volatility started",
            timestamp: new Date(Date.now() - 600000).toISOString()
          }
        ]
      };

      console.log('Dashboard data prepared:', dashboardData);
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard API error:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard data",
        details: error.message 
      });
    }
  });

  // Strategies API
  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const validatedData = insertStrategySchema.parse(req.body);
      const strategy = await storage.createStrategy(validatedData);

      // Notify strategy engine of new strategy
      await strategyEngine.loadStrategy(strategy);

      broadcast({ type: "STRATEGY_CREATED", data: strategy });
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ error: "Failed to create strategy" });
    }
  });

  app.patch("/api/strategies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const strategy = await storage.updateStrategy(id, updates);

      // Hot-reload strategy if it's running
      if (strategy.status === "RUNNING") {
        await strategyEngine.reloadStrategy(strategy);
      }

      broadcast({ type: "STRATEGY_UPDATED", data: strategy });
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ error: "Failed to update strategy" });
    }
  });

  app.post("/api/strategies/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.updateStrategy(id, { status: "RUNNING", isEnabled: true });

      await strategyEngine.startStrategy(strategy);
      broadcast({ type: "STRATEGY_STARTED", data: strategy });

      res.json({ message: "Strategy started", strategy });
    } catch (error) {
      res.status(400).json({ error: "Failed to start strategy" });
    }
  });

  app.post("/api/strategies/:id/stop", async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.updateStrategy(id, { status: "STOPPED", isEnabled: false });

      await strategyEngine.stopStrategy(strategy);
      broadcast({ type: "STRATEGY_STOPPED", data: strategy });

      res.json({ message: "Strategy stopped", strategy });
    } catch (error) {
      res.status(400).json({ error: "Failed to stop strategy" });
    }
  });

  // Accounts API
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      
      // Ensure accounts have all required fields for the brokers page
      const formattedAccounts = accounts.map(account => ({
        ...account,
        brokerId: account.brokerId || 'oanda',
        accountNumber: account.accountNumber || account.id,
        mode: account.mode || 'paper',
        balance: account.balance || '50000.00',
        equity: account.equity || '52350.75',
        baseCurrency: account.baseCurrency || 'USD',
        isActive: account.isActive !== undefined ? account.isActive : true
      }));
      
      res.json(formattedAccounts);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validatedData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ error: "Failed to create account" });
    }
  });

  // Broker connections API
  app.get("/api/brokers/connections", async (req, res) => {
    try {
      const brokerConnections = [
        {
          name: "OANDA (Demo)",
          type: "REST API",
          status: "ONLINE",
          latency: "23ms",
          lastTick: new Date().toLocaleTimeString('en-US', { hour12: false }),
          account: "101-004-12345-001",
          balance: "$50,000.00"
        },
        {
          name: "MT5 Bridge",
          type: "Bridge Connection", 
          status: "WARNING",
          latency: "45ms",
          lastTick: new Date(Date.now() - 120000).toLocaleTimeString('en-US', { hour12: false }),
          account: "12345678",
          balance: "$100,000.00"
        },
        {
          name: "Interactive Brokers",
          type: "TWS Gateway",
          status: "OFFLINE",
          latency: "--",
          lastTick: "--",
          account: "Not Connected",
          balance: "--"
        }
      ];
      
      res.json(brokerConnections);
    } catch (error) {
      console.error("Failed to fetch broker connections:", error);
      res.status(500).json({ error: "Failed to fetch broker connections" });
    }
  });

  app.post("/api/brokers/test-connection/:index", async (req, res) => {
    try {
      const { index } = req.params;
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({ 
        success: true, 
        message: "Connection test successful",
        latency: Math.floor(Math.random() * 50) + 10 + "ms"
      });
    } catch (error) {
      res.status(500).json({ error: "Connection test failed" });
    }
  });

  app.post("/api/brokers/reconnect/:index", async (req, res) => {
    try {
      const { index } = req.params;
      
      // Simulate reconnection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({ 
        success: true, 
        message: "Reconnection successful"
      });
    } catch (error) {
      res.status(500).json({ error: "Reconnection failed" });
    }
  });

  // Positions API
  app.get("/api/positions", async (req, res) => {
    try {
      const { accountId } = req.query;
      const positions = await storage.getOpenPositions(accountId as string);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions/:id/close", async (req, res) => {
    try {
      const { id } = req.params;
      const position = await storage.getPosition(id);

      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }

      // Create market order to close position
      // const closeOrder = await orderManager.createCloseOrder(position);
      const closeOrder = { id: 'mock-close-order' }; // Simplified for now
      const updatedPosition = await storage.updatePosition(id, { isOpen: false });

      broadcast({ type: "POSITION_CLOSED", data: updatedPosition });
      res.json({ message: "Position closed", order: closeOrder });
    } catch (error) {
      res.status(400).json({ error: "Failed to close position" });
    }
  });

  // Risk API
  app.get("/api/risk/status", async (req, res) => {
    try {
      const riskStatus = await riskManager.getCurrentRiskStatus();
      res.json(riskStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk status" });
    }
  });

  app.post("/api/risk/emergency-stop", async (req, res) => {
    try {
      await riskManager.emergencyStop();

      // Create alert
      await storage.createAlert({
        level: "CRITICAL",
        title: "Emergency Stop Triggered",
        message: "All trading has been halted by emergency stop",
        source: "MANUAL",
      });

      broadcast({ type: "EMERGENCY_STOP", timestamp: new Date().toISOString() });
      res.json({ message: "Emergency stop executed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute emergency stop" });
    }
  });

  // Backtests API
  app.get("/api/backtests", async (req, res) => {
    try {
      const { strategyId } = req.query;
      const backtests = await storage.getBacktests(strategyId as string);
      res.json(backtests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtests" });
    }
  });

  // Telegram Bot API
  app.get("/api/telegram/status", async (req, res) => {
    try {
      res.json({
        connected: telegramBot.isConnected(),
        authorizedUsers: telegramBot.getAuthorizedUsers(),
        token: process.env.TELEGRAM_BOT_TOKEN ? "SET" : "NOT_SET"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Telegram status" });
    }
  });

  app.post("/api/telegram/authorize", async (req, res) => {
    try {
      const { userId, role } = req.body;
      await telegramBot.authorizeUser(parseInt(userId), role || 'viewer');
      res.json({ message: "User authorized successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to authorize user" });
    }
  });

  app.post("/api/telegram/revoke", async (req, res) => {
    try {
      const { userId } = req.body;
      telegramBot.revokeUser(parseInt(userId));
      res.json({ message: "User access revoked" });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke user access" });
    }
  });

  app.post("/api/backtests", async (req, res) => {
    try {
      const validatedData = insertBacktestSchema.parse(req.body);
      const backtest = await storage.createBacktest(validatedData);

      // Start backtest execution (async)
      strategyEngine.runBacktest(backtest).catch(console.error);

      res.json(backtest);
    } catch (error) {
      res.status(400).json({ error: "Failed to create backtest" });
    }
  });

  // Alerts API
  app.get("/api/alerts", (req: Request, res: Response) => {
    try {
      // Return mock alerts with proper structure
      const mockAlerts = [
        {
          id: "alert-1",
          title: "Strategy Performance Alert",
          message: "Trend Follow Pullback strategy hit 5 consecutive losses. Consider reviewing parameters.",
          level: "warning",
          source: "STRATEGY",
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
          id: "alert-2",
          title: "Broker Connection Warning",
          message: "MT5 Bridge experiencing intermittent disconnections. Attempting to reconnect.",
          level: "warning",
          source: "BROKER",
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: "alert-3",
          title: "Daily Profit Target",
          message: "Daily profit target of $2,000 achieved. Risk management scaled back position sizes.",
          level: "info",
          source: "SYSTEM",
          isRead: true,
          createdAt: new Date(Date.now() - 60 * 60000).toISOString()
        }
      ];
      
      res.json(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.markAlertRead(id);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to mark alert as read" });
    }
  });

  // Analytics API
  app.get("/api/analytics/performance", async (req, res) => {
    try {
      const { timeframe = "30d", account = "all" } = req.query;
      
      // Mock performance data
      const performanceData = {
        equity: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 3600000).toISOString().split('T')[0],
          value: 50000 + Math.random() * 5000 + i * 100
        })),
        drawdown: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 3600000).toISOString().split('T')[0],
          value: -(Math.random() * 10)
        })),
        monthlyReturns: [
          { month: "Jan", return: 5.2 },
          { month: "Feb", return: -2.1 },
          { month: "Mar", return: 8.7 },
          { month: "Apr", return: 3.4 },
          { month: "May", return: -1.8 },
          { month: "Jun", return: 6.9 }
        ],
        tradingActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          trades: Math.floor(Math.random() * 20),
          pnl: (Math.random() - 0.5) * 1000
        })),
        symbolPerformance: [
          { symbol: "EURUSD", trades: 45, pnl: 2340, winRate: 68.5 },
          { symbol: "GBPUSD", trades: 32, pnl: 1890, winRate: 71.2 },
          { symbol: "USDJPY", trades: 28, pnl: -560, winRate: 45.8 },
          { symbol: "AUDUSD", trades: 19, pnl: 1120, winRate: 62.3 }
        ],
        riskMetrics: {
          sharpeRatio: 1.85,
          sortinoRatio: 2.12,
          calmarRatio: 1.94,
          maxDrawdown: 8.3,
          volatility: 12.5,
          valueAtRisk: 2340
        }
      };
      
      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  // Broker Management API
  app.get("/api/brokers/all", async (req, res) => {
    try {
      const { brokerManager } = await import("./services/broker-manager");
      const brokers = brokerManager.getAllBrokers();
      res.json(brokers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.post("/api/brokers/:brokerId/connect", async (req, res) => {
    try {
      const { brokerId } = req.params;
      const { brokerManager } = await import("./services/broker-manager");
      const success = await brokerManager.connectBroker(brokerId, req.body);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: "Failed to connect broker" });
    }
  });

  app.post("/api/brokers/:brokerId/disconnect", async (req, res) => {
    try {
      const { brokerId } = req.params;
      const { brokerManager } = await import("./services/broker-manager");
      await brokerManager.disconnectBroker(brokerId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to disconnect broker" });
    }
  });

  app.get("/api/brokers/:brokerId/account", async (req, res) => {
    try {
      const { brokerId } = req.params;
      const { brokerManager } = await import("./services/broker-manager");
      const accountInfo = await brokerManager.getAccountInfo(brokerId);
      res.json(accountInfo);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch account info" });
    }
  });

  // Trading Signals API
  app.get("/api/signals", async (req, res) => {
    try {
      const { signalEngine } = await import("./services/signal-engine");
      const signals = signalEngine.getAllActiveSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  app.get("/api/signals/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { signalEngine } = await import("./services/signal-engine");
      const signals = signalEngine.getSignalsForSymbol(symbol);
      const consensus = signalEngine.getConsensusSignal(symbol);
      res.json({ signals, consensus });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symbol signals" });
    }
  });

  app.get("/api/signals/providers", async (req, res) => {
    try {
      const { signalEngine } = await import("./services/signal-engine");
      const providers = signalEngine.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Failed to fetch signal providers:", error);
      // Return mock providers if service fails
      res.json([
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          description: "RSI, MACD, Bollinger Bands, and trend analysis",
          enabled: true
        },
        {
          id: "sentiment-analysis",
          name: "Market Sentiment",
          description: "News sentiment and market positioning analysis",
          enabled: true
        },
        {
          id: "ml-prediction",
          name: "ML Price Prediction",
          description: "Machine learning based price prediction",
          enabled: true
        }
      ]);
    }
  });

  app.post("/api/signals/providers/:providerId/toggle", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { enabled } = req.body;
      const { signalEngine } = await import("./services/signal-engine");
      
      if (enabled) {
        signalEngine.enableProvider(providerId);
      } else {
        signalEngine.disableProvider(providerId);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to toggle provider" });
    }
  });

  // Enhanced Backtesting API
  app.post("/api/backtests/:id/run", async (req, res) => {
    try {
      const { id } = req.params;
      const backtest = await storage.getBacktest(id);
      const strategy = await storage.getStrategy(backtest.strategyId);
      
      const { backtestingEngine } = await import("./services/backtesting-engine");
      backtestingEngine.runBacktest(backtest, strategy).catch(console.error);
      
      res.json({ message: "Backtest started" });
    } catch (error) {
      res.status(400).json({ error: "Failed to run backtest" });
    }
  });

  // Enhanced Logging API
  app.get("/api/logs", async (req, res) => {
    try {
      const { logger } = await import("./services/logger");
      const { type, level, symbol, limit } = req.query;

      const logs = logger.getLogs({
        type: type as string,
        level: level as string,
        symbol: symbol as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.get("/api/logs/stats", async (req, res) => {
    try {
      const { logger } = await import("./services/logger");
      const stats = logger.getLogStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch log stats" });
    }
  });

  // Enhanced Positions API with real-time updates
  app.post("/api/positions/update-prices", async (req, res) => {
    try {
      const openPositions = await storage.getOpenPositions();
      const { marketDataService } = await import("./services/market-data");

      for (const position of openPositions) {
        const currentPrice = await marketDataService.getLatestPrice(position.symbol);
        if (currentPrice) {
          const quantity = parseFloat(position.quantity);
          const avgPrice = parseFloat(position.avgPrice);
          const side = position.side;

          // Calculate unrealized P&L
          const pnlPerUnit = side === "BUY" ? 
            currentPrice.price - avgPrice : 
            avgPrice - currentPrice.price;
          const unrealizedPnL = pnlPerUnit * quantity * 100000;

          await storage.updatePosition(position.id, {
            currentPrice: currentPrice.price.toString(),
            unrealizedPnL: unrealizedPnL.toString(),
          });
        }
      }

      broadcast({ type: "POSITIONS_UPDATED", timestamp: new Date().toISOString() });
      res.json({ message: "Positions updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update position prices" });
    }
  });

  // System Status API
  app.get("/api/system/status", async (req, res) => {
    try {
      const systemHealth = await storage.getSystemStatus();
      res.json(systemHealth);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Audit API
  app.get("/api/audit/:period", async (req, res) => {
    try {
      const { period } = req.params;
      
      // Mock audit data
      const auditData = [
        {
          id: "audit-1",
          timestamp: new Date().toISOString(),
          user: "system",
          action: "STRATEGY_STARTED",
          resource: "strategy:strat-1",
          details: { strategyName: "Breakout Volatility" },
          ip: "127.0.0.1"
        },
        {
          id: "audit-2",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          user: "admin",
          action: "POSITION_CLOSED",
          resource: "position:pos-1",
          details: { symbol: "EURUSD", pnl: 125.50 },
          ip: "192.168.1.100"
        },
        {
          id: "audit-3",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          user: "system",
          action: "RISK_WARNING",
          resource: "account:acc-1",
          details: { drawdown: 5.2, threshold: 5.0 },
          ip: "127.0.0.1"
        }
      ];
      
      res.json(auditData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit data" });
    }
  });

  // Start real-time market data updates
  marketDataService.onPriceUpdate((update) => {
    broadcast({ type: "PRICE_UPDATE", data: update });
  });

  // Start periodic position price updates
  setInterval(async () => {
    try {
      const openPositions = await storage.getOpenPositions();
      const updatedPositions = [];

      for (const position of openPositions) {
        const currentPrice = await marketDataService.getLatestPrice(position.symbol);
        if (currentPrice) {
          const quantity = parseFloat(position.quantity);
          const avgPrice = parseFloat(position.avgPrice);
          const side = position.side;

          // Calculate unrealized P&L
          const pnlPerUnit = side === "BUY" ? 
            currentPrice.price - avgPrice : 
            avgPrice - currentPrice.price;
          const unrealizedPnL = pnlPerUnit * quantity * 100000;

          const updatedPosition = await storage.updatePosition(position.id, {
            currentPrice: currentPrice.price.toString(),
            unrealizedPnL: unrealizedPnL.toString(),
          });

          updatedPositions.push(updatedPosition);
        }
      }

      if (updatedPositions.length > 0) {
        broadcast({ type: "POSITIONS_UPDATED", data: updatedPositions });
      }
    } catch (error) {
      console.error("Position price update error:", error);
    }
  }, 2000); // Update every 2 seconds

  // Start system monitoring
  setInterval(async () => {
    try {
      // Update system health metrics
      await storage.updateSystemStatus("strategy-engine", {
        service: "strategy-engine",
        status: strategyEngine.isHealthy() ? "ONLINE" : "ERROR",
        latency: await strategyEngine.getLatency(),
        metadata: { 
          activeStrategies: await strategyEngine.getActiveStrategyCount(),
          memoryUsage: process.memoryUsage().heapUsed 
        }
      });

      await storage.updateSystemStatus("risk-manager", {
        service: "risk-manager",
        status: riskManager.isHealthy() ? "ONLINE" : "ERROR",
        latency: await riskManager.getLatency(),
        metadata: { 
          checksPerMinute: riskManager.getChecksPerMinute(),
          blocks: riskManager.getBlockCount()
        }
      });

      await storage.updateSystemStatus("order-manager", {
        service: "order-manager",
        status: orderManager.isHealthy() ? "ONLINE" : "ERROR",
        latency: await orderManager.getLatency(),
        metadata: { 
          pendingOrders: await orderManager.getPendingOrderCount()
        }
      });
    } catch (error) {
      console.error("System health update error:", error);
    }
  }, 5000);

  return httpServer;
}