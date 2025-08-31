
import { telegramBot } from './telegram-bot';
import { storage } from '../storage';

interface NotificationRule {
  id: string;
  type: 'trade' | 'alert' | 'risk' | 'system';
  conditions: {
    level?: string[];
    symbols?: string[];
    pnlThreshold?: number;
    enabled: boolean;
  };
  channels: {
    telegram: boolean;
    email: boolean;
    webhook: boolean;
  };
}

class NotificationManager {
  private rules: NotificationRule[] = [
    {
      id: 'critical-alerts',
      type: 'alert',
      conditions: { level: ['CRITICAL', 'ERROR'], enabled: true },
      channels: { telegram: true, email: false, webhook: false }
    },
    {
      id: 'large-trades',
      type: 'trade',
      conditions: { pnlThreshold: 1000, enabled: true },
      channels: { telegram: true, email: false, webhook: false }
    },
    {
      id: 'risk-warnings',
      type: 'risk',
      conditions: { enabled: true },
      channels: { telegram: true, email: false, webhook: false }
    }
  ];

  async sendTradeNotification(trade: any) {
    const rule = this.rules.find(r => r.type === 'trade' && r.conditions.enabled);
    if (!rule) return;

    const pnl = Math.abs(parseFloat(trade.pnl || 0));
    if (rule.conditions.pnlThreshold && pnl < rule.conditions.pnlThreshold) return;

    if (rule.channels.telegram) {
      await telegramBot.sendTradeNotification(trade);
    }
  }

  async sendAlertNotification(alert: any) {
    const rule = this.rules.find(r => r.type === 'alert' && r.conditions.enabled);
    if (!rule) return;

    if (rule.conditions.level && !rule.conditions.level.includes(alert.level)) return;

    if (rule.channels.telegram) {
      await telegramBot.sendAlert(alert);
    }
  }

  async sendRiskWarning(riskData: any) {
    const rule = this.rules.find(r => r.type === 'risk' && r.conditions.enabled);
    if (!rule) return;

    if (rule.channels.telegram) {
      const message = `⚠️ *Risk Warning*\n\nDaily Loss: ${riskData.dailyLoss}%\nDrawdown: ${riskData.drawdown}%\nRisk Level: ${riskData.level}`;
      // Implementation would call telegram bot with custom message
    }
  }

  updateRule(ruleId: string, updates: Partial<NotificationRule>) {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  getRules() {
    return this.rules;
  }
}

export const notificationManager = new NotificationManager();
