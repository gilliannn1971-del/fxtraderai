import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertStrategySchema, insertAccountSchema, insertBacktestSchema, insertAlertSchema } from "@shared/schema";
import { strategyEngine } from "./services/strategy-engine";
import { riskManager } from "./services/risk-manager";
import { orderManager } from "./services/order-manager";
import { marketDataService } from "./services/market-data";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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
      const accounts = await storage.getAccounts();
      const strategies = await storage.getStrategies();
      const openPositions = await storage.getOpenPositions();
      const recentOrders = await storage.getOrdersByAccount(accounts[0]?.id || "", 10);
      const alerts = await storage.getAlerts(5);
      const systemHealth = await storage.getSystemStatus();

      // Calculate account metrics
      const account = accounts[0];
      const totalUnrealizedPnL = openPositions.reduce((sum, pos) => 
        sum + parseFloat(pos.unrealizedPnL || "0"), 0
      );
      
      const todayOrders = recentOrders.filter(order => {
        const today = new Date();
        const orderDate = new Date(order.createdAt || "");
        return orderDate.toDateString() === today.toDateString();
      });

      const dailyPnL = todayOrders.reduce((sum, order) => {
        // This would be calculated from fills/position changes
        return sum + (Math.random() - 0.5) * 1000; // Placeholder calculation
      }, 0);

      res.json({
        account: {
          balance: account?.balance || "0",
          equity: account?.equity || "0",
          dailyPnL: dailyPnL.toFixed(2),
          openPnL: totalUnrealizedPnL.toFixed(2),
        },
        strategies: {
          active: strategies.filter(s => s.status === "RUNNING").length,
          total: strategies.length,
          profitable: strategies.filter(s => s.status === "RUNNING").length - 1, // Mock calculation
        },
        risk: {
          dailyDrawdown: -2.1,
          dailyDrawdownPercent: 21,
          maxDrawdown: -3.2,
          totalExposure: openPositions.reduce((sum, pos) => 
            sum + parseFloat(pos.quantity || "0") * parseFloat(pos.currentPrice || "0"), 0
          ),
        },
        openPositions,
        recentTrades: recentOrders.slice(0, 4),
        alerts: alerts.slice(0, 3),
        systemHealth,
      });
    } catch (error) {
      console.error("Dashboard API error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
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
      res.json(accounts);
    } catch (error) {
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
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
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

  // System Status API
  app.get("/api/system/status", async (req, res) => {
    try {
      const systemHealth = await storage.getSystemStatus();
      res.json(systemHealth);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Start real-time market data updates
  // marketDataService.onPriceUpdate((update) => {
  //   broadcast({ type: "PRICE_UPDATE", data: update });
  // });

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
