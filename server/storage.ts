interface Account {
  id: string;
  name: string;
  balance: string;
  equity: string;
  broker: string;
  status: string;
  createdAt: string;
}

interface Strategy {
  id: string;
  name: string;
  status: string;
  isEnabled: boolean;
  symbols: string[];
  createdAt: string;
}

interface Position {
  id: string;
  accountId: string;
  symbol: string;
  side: string;
  quantity: string;
  avgPrice: string;
  currentPrice: string;
  unrealizedPnL: string;
  isOpen: boolean;
  createdAt: string;
}

interface Order {
  id: string;
  accountId: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  status: string;
  createdAt: string;
}

interface Alert {
  id: string;
  level: string;
  title: string;
  message: string;
  source: string;
  isRead: boolean;
  createdAt: string;
  timestamp?: string; // Added for consistency with the change
}

interface Backtest {
  id: string;
  strategyId: string;
  name: string;
  status: string;
  createdAt: string;
}

interface SystemStatus {
  service: string;
  status: string;
  latency: number;
  metadata: any;
  lastUpdate: string;
}

class MockStorage {
  private accounts: Account[] = [
    {
      id: "acc-1",
      name: "FTMO Challenge Account",
      balance: "100000.00",
      equity: "102450.75",
      broker: "OANDA",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    }
  ];

  private strategies: Strategy[] = [
    {
      id: "strat-1",
      name: "Breakout Strategy",
      status: "RUNNING",
      isEnabled: true,
      symbols: ["EURUSD", "GBPUSD"],
      createdAt: new Date().toISOString()
    },
    {
      id: "strat-2",
      name: "Mean Reversion",
      status: "STOPPED",
      isEnabled: false,
      symbols: ["USDJPY"],
      createdAt: new Date().toISOString()
    }
  ];

  private positions: Position[] = [
    {
      id: "pos-1",
      accountId: "acc-1",
      symbol: "EURUSD",
      side: "BUY",
      quantity: "10000",
      avgPrice: "1.0850",
      currentPrice: "1.0865",
      unrealizedPnL: "150.00",
      isOpen: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "pos-2",
      accountId: "acc-1",
      symbol: "GBPUSD",
      side: "SELL",
      quantity: "5000",
      avgPrice: "1.2650",
      currentPrice: "1.2635",
      unrealizedPnL: "75.00",
      isOpen: true,
      createdAt: new Date().toISOString()
    }
  ];

  private orders: Order[] = [
    {
      id: "order-1",
      accountId: "acc-1",
      symbol: "EURUSD",
      side: "BUY",
      quantity: "10000",
      price: "1.0850",
      status: "FILLED",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "order-2",
      accountId: "acc-1",
      symbol: "GBPUSD",
      side: "SELL",
      quantity: "5000",
      price: "1.2650",
      status: "FILLED",
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  private alerts: Alert[] = [
    {
      id: "alert-1",
      level: "WARNING",
      title: "High Drawdown Alert",
      message: "Account drawdown approaching 5% limit",
      source: "RISK_MANAGER",
      isRead: false,
      createdAt: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: "alert-2",
      level: "INFO",
      title: "Strategy Started",
      message: "Breakout Strategy has been activated",
      source: "STRATEGY_ENGINE",
      isRead: true,
      createdAt: new Date(Date.now() - 1200000).toISOString()
    }
  ];

  private backtests: Backtest[] = [
    {
      id: "backtest-1",
      strategyId: "strat-1",
      name: "Q4 2023 Backtest",
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  private systemStatuses: SystemStatus[] = [
    {
      service: "strategy-engine",
      status: "ONLINE",
      latency: 15,
      metadata: { activeStrategies: 1, memoryUsage: 45000000 },
      lastUpdate: new Date().toISOString()
    },
    {
      service: "risk-manager",
      status: "ONLINE",
      latency: 8,
      metadata: { checksPerMinute: 120, blocks: 0 },
      lastUpdate: new Date().toISOString()
    },
    {
      service: "order-manager",
      status: "ONLINE",
      latency: 12,
      metadata: { pendingOrders: 0 },
      lastUpdate: new Date().toISOString()
    },
    {
      service: "market-data",
      status: "ONLINE",
      latency: 25,
      metadata: { symbols: 10, lastUpdate: new Date().toISOString() },
      lastUpdate: new Date().toISOString()
    }
  ];

  // Account methods
  async getAccounts(): Promise<Account[]> {
    return this.accounts;
  }

  async createAccount(data: any): Promise<Account> {
    const account: Account = {
      id: `acc-${Date.now()}`,
      name: data.name,
      balance: data.balance || "0",
      equity: data.equity || "0",
      broker: data.broker,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };
    this.accounts.push(account);
    return account;
  }

  // Strategy methods
  async getStrategies(): Promise<Strategy[]> {
    return this.strategies;
  }

  async createStrategy(data: any): Promise<Strategy> {
    const strategy: Strategy = {
      id: `strat-${Date.now()}`,
      name: data.name,
      status: "STOPPED",
      isEnabled: false,
      symbols: data.symbols || [],
      createdAt: new Date().toISOString()
    };
    this.strategies.push(strategy);
    return strategy;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy> {
    const index = this.strategies.findIndex(s => s.id === id);
    if (index !== -1) {
      this.strategies[index] = { ...this.strategies[index], ...updates };
      return this.strategies[index];
    }
    throw new Error("Strategy not found");
  }

  // Position methods
  async getOpenPositions(accountId?: string): Promise<Position[]> {
    return this.positions.filter(p => p.isOpen && (!accountId || p.accountId === accountId));
  }

  async getPosition(id: string): Promise<Position | null> {
    return this.positions.find(p => p.id === id) || null;
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
    const index = this.positions.findIndex(p => p.id === id);
    if (index !== -1) {
      this.positions[index] = { ...this.positions[index], ...updates };
      return this.positions[index];
    }
    throw new Error("Position not found");
  }

  // Order methods
  async getOrdersByAccount(accountId: string, limit?: number): Promise<Order[]> {
    const orders = this.orders.filter(o => o.accountId === accountId);
    return limit ? orders.slice(0, limit) : orders;
  }

  // Alert methods
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'isRead'>): Promise<Alert> {
    const alert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000);
    }

    // Send Telegram notification
    try {
      const { telegramBot } = await import("./services/telegram-bot");
      await telegramBot.sendAlert(alert);
    } catch (error) {
      console.error("Failed to send Telegram alert:", error);
    }

    return alert;
  }

  async markAlertRead(id: string): Promise<Alert> {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.alerts[index].isRead = true;
      return this.alerts[index];
    }
    throw new Error("Alert not found");
  }

  getAllAlerts(): Alert[] {
    return this.alerts.map(alert => ({
      id: alert.id || Math.random().toString(36),
      message: alert.message || 'System alert',
      level: alert.level || 'info',
      timestamp: alert.timestamp || new Date().toISOString(),
      ...alert
    }));
  }

  // Backtest methods
  async getBacktests(strategyId?: string): Promise<Backtest[]> {
    return strategyId 
      ? this.backtests.filter(b => b.strategyId === strategyId)
      : this.backtests;
  }

  async createBacktest(data: any): Promise<Backtest> {
    const backtest: Backtest = {
      id: `backtest-${Date.now()}`,
      strategyId: data.strategyId,
      name: data.name,
      status: "RUNNING",
      createdAt: new Date().toISOString()
    };
    this.backtests.push(backtest);
    return backtest;
  }

  // System status methods
  async getSystemStatus(): Promise<SystemStatus[]> {
    return this.systemStatuses;
  }

  async updateSystemStatus(service: string, updates: Partial<SystemStatus>): Promise<void> {
    const index = this.systemStatuses.findIndex(s => s.service === service);
    if (index !== -1) {
      this.systemStatuses[index] = { 
        ...this.systemStatuses[index], 
        ...updates,
        lastUpdate: new Date().toISOString()
      };
    } else {
      this.systemStatuses.push({
        service,
        status: "UNKNOWN",
        latency: 0,
        metadata: {},
        lastUpdate: new Date().toISOString(),
        ...updates
      });
    }
  }
}

export const storage = new MockStorage();