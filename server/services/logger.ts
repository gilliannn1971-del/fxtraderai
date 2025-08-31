
import { storage } from "../storage";

export interface TradingLog {
  id?: string;
  type: "ORDER" | "FILL" | "POSITION" | "STRATEGY" | "RISK" | "SYSTEM";
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  symbol?: string;
  strategyId?: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

class Logger {
  private logs: TradingLog[] = [];
  private maxLogs = 10000;

  async log(logData: Omit<TradingLog, 'id' | 'timestamp'>): Promise<void> {
    const log: TradingLog = {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // Add to memory cache
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console with formatting
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const prefix = `[${log.level}] [${log.type}] ${timestamp}`;
    
    if (log.level === "ERROR" || log.level === "CRITICAL") {
      console.error(`${prefix} ${log.message}`, log.details || '');
    } else if (log.level === "WARN") {
      console.warn(`${prefix} ${log.message}`, log.details || '');
    } else {
      console.log(`${prefix} ${log.message}`, log.details || '');
    }

    // Store critical logs in database as alerts
    if (log.level === "CRITICAL" || log.level === "ERROR") {
      await storage.createAlert({
        level: log.level === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: `${log.type} ${log.level}`,
        message: log.message,
        source: log.type,
      });
    }
  }

  async logOrder(orderId: string, action: string, details?: any): Promise<void> {
    await this.log({
      type: "ORDER",
      level: "INFO",
      message: `Order ${orderId}: ${action}`,
      details: { orderId, action, ...details }
    });
  }

  async logStrategy(strategyId: string, message: string, level: "INFO" | "WARN" | "ERROR" = "INFO", details?: any): Promise<void> {
    await this.log({
      type: "STRATEGY",
      level,
      strategyId,
      message,
      details
    });
  }

  async logRisk(message: string, level: "WARN" | "ERROR" | "CRITICAL" = "WARN", details?: any): Promise<void> {
    await this.log({
      type: "RISK",
      level,
      message,
      details
    });
  }

  async logPosition(symbol: string, action: string, details?: any): Promise<void> {
    await this.log({
      type: "POSITION",
      level: "INFO",
      symbol,
      message: `${symbol}: ${action}`,
      details
    });
  }

  getLogs(filter?: { type?: string; level?: string; symbol?: string; limit?: number }): TradingLog[] {
    let filteredLogs = this.logs;

    if (filter?.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filter.type);
    }
    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }
    if (filter?.symbol) {
      filteredLogs = filteredLogs.filter(log => log.symbol === filter.symbol);
    }

    return filteredLogs.slice(0, filter?.limit || 1000);
  }

  getLogStats(): { total: number; byLevel: Record<string, number>; byType: Record<string, number> } {
    const byLevel: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const log of this.logs) {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byType[log.type] = (byType[log.type] || 0) + 1;
    }

    return {
      total: this.logs.length,
      byLevel,
      byType
    };
  }
}

export const logger = new Logger();
