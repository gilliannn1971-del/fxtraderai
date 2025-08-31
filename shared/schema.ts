import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accountModeEnum = pgEnum("account_mode", ["live", "paper", "backtest"]);
export const orderSideEnum = pgEnum("order_side", ["BUY", "SELL"]);
export const orderTypeEnum = pgEnum("order_type", ["MARKET", "LIMIT", "STOP", "STOP_LIMIT"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "FILLED", "CANCELLED", "REJECTED", "PARTIAL"]);
export const strategyStatusEnum = pgEnum("strategy_status", ["RUNNING", "PAUSED", "STOPPED", "ERROR"]);
export const riskEventLevelEnum = pgEnum("risk_event_level", ["INFO", "WARNING", "CRITICAL"]);

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("trader"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Accounts
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerId: text("broker_id").notNull(),
  accountNumber: text("account_number").notNull(),
  mode: accountModeEnum("mode").notNull().default("paper"),
  baseCurrency: text("base_currency").notNull().default("USD"),
  leverage: decimal("leverage", { precision: 10, scale: 2 }).notNull().default("100"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  equity: decimal("equity", { precision: 15, scale: 2 }).notNull().default("0"),
  propRules: jsonb("prop_rules"), // JSON object for prop firm rules
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Strategies
export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description"),
  parameters: jsonb("parameters").notNull(), // Strategy configuration
  status: strategyStatusEnum("status").notNull().default("STOPPED"),
  riskProfile: jsonb("risk_profile"), // Risk parameters for this strategy
  symbols: text("symbols").array().notNull(), // Trading symbols
  isEnabled: boolean("is_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  strategyId: varchar("strategy_id").references(() => strategies.id),
  symbol: text("symbol").notNull(),
  side: orderSideEnum("side").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 5 }).notNull(),
  type: orderTypeEnum("type").notNull(),
  price: decimal("price", { precision: 10, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  brokerOrderId: text("broker_order_id"),
  idempotencyKey: text("idempotency_key").notNull(),
  filledQuantity: decimal("filled_quantity", { precision: 10, scale: 5 }).default("0"),
  avgFillPrice: decimal("avg_fill_price", { precision: 10, scale: 5 }),
  commission: decimal("commission", { precision: 10, scale: 2 }),
  slippage: decimal("slippage", { precision: 10, scale: 5 }),
  createdAt: timestamp("created_at").defaultNow(),
  filledAt: timestamp("filled_at"),
});

// Positions
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  strategyId: varchar("strategy_id").references(() => strategies.id),
  symbol: text("symbol").notNull(),
  side: orderSideEnum("side").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 5 }).notNull(),
  avgPrice: decimal("avg_price", { precision: 10, scale: 5 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 5 }),
  unrealizedPnL: decimal("unrealized_pnl", { precision: 15, scale: 2 }).default("0"),
  realizedPnL: decimal("realized_pnl", { precision: 15, scale: 2 }).default("0"),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

// Risk Events
export const riskEvents = pgTable("risk_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  strategyId: varchar("strategy_id").references(() => strategies.id),
  level: riskEventLevelEnum("level").notNull(),
  rule: text("rule").notNull(), // Which risk rule was triggered
  action: text("action").notNull(), // Action taken
  details: jsonb("details"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Backtests
export const backtests = pgTable("backtests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strategyId: varchar("strategy_id").notNull().references(() => strategies.id),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  parameters: jsonb("parameters").notNull(),
  metrics: jsonb("metrics"), // Performance metrics
  status: text("status").notNull().default("PENDING"), // PENDING, RUNNING, COMPLETED, FAILED
  artifactUri: text("artifact_uri"), // Path to detailed results
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: riskEventLevelEnum("level").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source"), // Which service generated the alert
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Status
export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull(),
  status: text("status").notNull(), // ONLINE, OFFLINE, WARNING, ERROR
  latency: integer("latency"), // milliseconds
  metadata: jsonb("metadata"), // Additional service-specific data
  lastUpdate: timestamp("last_update").defaultNow(),
});

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  orders: many(orders),
  positions: many(positions),
  riskEvents: many(riskEvents),
}));

export const strategiesRelations = relations(strategies, ({ many }) => ({
  orders: many(orders),
  positions: many(positions),
  riskEvents: many(riskEvents),
  backtests: many(backtests),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  account: one(accounts, {
    fields: [orders.accountId],
    references: [accounts.id],
  }),
  strategy: one(strategies, {
    fields: [orders.strategyId],
    references: [strategies.id],
  }),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  account: one(accounts, {
    fields: [positions.accountId],
    references: [accounts.id],
  }),
  strategy: one(strategies, {
    fields: [positions.strategyId],
    references: [strategies.id],
  }),
}));

export const riskEventsRelations = relations(riskEvents, ({ one }) => ({
  account: one(accounts, {
    fields: [riskEvents.accountId],
    references: [accounts.id],
  }),
  strategy: one(strategies, {
    fields: [riskEvents.strategyId],
    references: [strategies.id],
  }),
}));

export const backtestsRelations = relations(backtests, ({ one }) => ({
  strategy: one(strategies, {
    fields: [backtests.strategyId],
    references: [strategies.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, filledAt: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, createdAt: true, closedAt: true });
export const insertRiskEventSchema = createInsertSchema(riskEvents).omit({ id: true, createdAt: true });
export const insertBacktestSchema = createInsertSchema(backtests).omit({ id: true, createdAt: true, completedAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({ id: true, lastUpdate: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type RiskEvent = typeof riskEvents.$inferSelect;
export type InsertRiskEvent = z.infer<typeof insertRiskEventSchema>;
export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
