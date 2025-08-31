import { 
  users, accounts, strategies, orders, positions, riskEvents, backtests, alerts, systemStatus,
  type User, type InsertUser, type Account, type InsertAccount, type Strategy, type InsertStrategy,
  type Order, type InsertOrder, type Position, type InsertPosition, type RiskEvent, type InsertRiskEvent,
  type Backtest, type InsertBacktest, type Alert, type InsertAlert, type SystemStatus, type InsertSystemStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Accounts
  getAccount(id: string): Promise<Account | undefined>;
  getAccounts(): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account>;

  // Strategies
  getStrategy(id: string): Promise<Strategy | undefined>;
  getStrategies(): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByAccount(accountId: string, limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;

  // Positions
  getPosition(id: string): Promise<Position | undefined>;
  getOpenPositions(accountId?: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<InsertPosition>): Promise<Position>;

  // Risk Events
  getRiskEvents(accountId?: string, limit?: number): Promise<RiskEvent[]>;
  createRiskEvent(riskEvent: InsertRiskEvent): Promise<RiskEvent>;

  // Backtests
  getBacktest(id: string): Promise<Backtest | undefined>;
  getBacktests(strategyId?: string): Promise<Backtest[]>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
  updateBacktest(id: string, updates: Partial<InsertBacktest>): Promise<Backtest>;

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertRead(id: string): Promise<Alert>;

  // System Status
  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(service: string, status: InsertSystemStatus): Promise<SystemStatus>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Accounts
  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set(updates)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  // Strategies
  async getStrategy(id: string): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async getStrategies(): Promise<Strategy[]> {
    return await db.select().from(strategies).orderBy(desc(strategies.createdAt));
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy> {
    const [updatedStrategy] = await db
      .update(strategies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return updatedStrategy;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByAccount(accountId: string, limit: number = 50): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.accountId, accountId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Positions
  async getPosition(id: string): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async getOpenPositions(accountId?: string): Promise<Position[]> {
    if (accountId) {
      return await db
        .select()
        .from(positions)
        .where(and(eq(positions.isOpen, true), eq(positions.accountId, accountId)))
        .orderBy(desc(positions.createdAt));
    }
    
    return await db
      .select()
      .from(positions)
      .where(eq(positions.isOpen, true))
      .orderBy(desc(positions.createdAt));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

  async updatePosition(id: string, updates: Partial<InsertPosition>): Promise<Position> {
    const [updatedPosition] = await db
      .update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition;
  }

  // Risk Events
  async getRiskEvents(accountId?: string, limit: number = 50): Promise<RiskEvent[]> {
    const query = db.select().from(riskEvents);
    
    if (accountId) {
      return await query
        .where(eq(riskEvents.accountId, accountId))
        .orderBy(desc(riskEvents.createdAt))
        .limit(limit);
    }
    
    return await query.orderBy(desc(riskEvents.createdAt)).limit(limit);
  }

  async createRiskEvent(riskEvent: InsertRiskEvent): Promise<RiskEvent> {
    const [newRiskEvent] = await db.insert(riskEvents).values(riskEvent).returning();
    return newRiskEvent;
  }

  // Backtests
  async getBacktest(id: string): Promise<Backtest | undefined> {
    const [backtest] = await db.select().from(backtests).where(eq(backtests.id, id));
    return backtest || undefined;
  }

  async getBacktests(strategyId?: string): Promise<Backtest[]> {
    const query = db.select().from(backtests);
    
    if (strategyId) {
      return await query
        .where(eq(backtests.strategyId, strategyId))
        .orderBy(desc(backtests.createdAt));
    }
    
    return await query.orderBy(desc(backtests.createdAt));
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const [newBacktest] = await db.insert(backtests).values(backtest).returning();
    return newBacktest;
  }

  async updateBacktest(id: string, updates: Partial<InsertBacktest>): Promise<Backtest> {
    const [updatedBacktest] = await db
      .update(backtests)
      .set(updates)
      .where(eq(backtests.id, id))
      .returning();
    return updatedBacktest;
  }

  // Alerts
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertRead(id: string): Promise<Alert> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  // System Status
  async getSystemStatus(): Promise<SystemStatus[]> {
    return await db.select().from(systemStatus).orderBy(desc(systemStatus.lastUpdate));
  }

  async updateSystemStatus(service: string, status: InsertSystemStatus): Promise<SystemStatus> {
    // Upsert system status
    const existing = await db.select().from(systemStatus).where(eq(systemStatus.service, service));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(systemStatus)
        .set({ ...status, lastUpdate: new Date() })
        .where(eq(systemStatus.service, service))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemStatus)
        .values({ ...status, service, lastUpdate: new Date() })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
