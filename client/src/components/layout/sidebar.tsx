import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Shield, FileText, Settings, TrendingUp, AlertCircle, Database, Target, MessageSquare } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line" },
  { name: "Strategies", href: "/strategies", icon: "fas fa-brain" },
  { name: "Risk & Rules", href: "/risk", icon: "fas fa-shield-alt" },
  { name: "Brokers", href: "/brokers", icon: "fas fa-building" },
  { name: "Backtests", href: "/backtests", icon: "fas fa-history" },
  { name: "Logs & Alerts", href: "/logs", icon: "fas fa-file-alt" },
  { name: "Audit Trail", href: "/audit", icon: "fas fa-clipboard-list" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold">FX TradingBot</h1>
            <p className="text-xs text-muted-foreground">Control Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
        <Link href="/telegram">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <MessageSquare className="h-5 w-5" />
              <span>Telegram Bot</span>
            </div>
          </Link>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">System Status</span>
            <div className="w-2 h-2 rounded-full status-online animate-pulse-slow" data-testid="system-status-indicator"></div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Latency</span>
              <span className="profit font-mono" data-testid="system-latency">34ms</span>
            </div>
            <div className="flex justify-between">
              <span>Memory</span>
              <span className="text-foreground font-mono" data-testid="system-memory">2.1GB</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}