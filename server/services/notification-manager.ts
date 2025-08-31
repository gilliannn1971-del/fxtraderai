import { telegramBot } from './telegram-bot';
import { storage } from '../storage';

interface NotificationRule {
  id: string;
  type: 'alert' | 'trade' | 'risk';
  conditions: {
    level?: string[];
    pnlThreshold?: number;
    enabled: boolean;
  };
  channels: {
    telegram: boolean;
    web: boolean;
    email?: boolean;
  };
}

class NotificationManager {
  private rules: Map<string, NotificationRule> = new Map();

  constructor() {
    this.loadRules();
  }

  private loadRules() {
    // Load notification rules from storage
    // Default rules can be added here
  }

  async sendNotification(type: string, message: string, data?: any) {
    // Send to Telegram if configured
    if (telegramBot.isConnected()) {
      await telegramBot.sendAlert({ 
        level: type.toUpperCase(),
        title: type,
        message,
        createdAt: new Date().toISOString()
      });
    }

    // Log notification
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async sendAlert(level: string, message: string, symbol?: string) {
    await this.sendNotification('alert', `🚨 ${level.toUpperCase()}: ${message}${symbol ? ` (${symbol})` : ''}`);
  }

  async sendTradeNotification(action: string, symbol: string, details: any) {
    const message = `📊 ${action.toUpperCase()}: ${symbol} - ${JSON.stringify(details)}`;
    await this.sendNotification('trade', message);
  }

  async sendRiskWarning(message: string, metrics?: any) {
    await this.sendNotification('risk', `⚠️ RISK WARNING: ${message}`);
  }
}

export const notificationManager = new NotificationManager();