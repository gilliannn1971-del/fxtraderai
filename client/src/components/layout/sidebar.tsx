import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  Home, 
  TrendingUp, 
  Shield, 
  Building2, 
  History, 
  FileText, 
  MessageSquare,
  BarChart3,
  Search,
  Zap,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const NavigationItems = () => (
    <>
      <Link href="/">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <Home className="h-5 w-5" />
          <span>Dashboard</span>
        </div>
      </Link>

      <Link href="/strategies">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/strategies" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <TrendingUp className="h-5 w-5" />
          <span>Strategies</span>
        </div>
      </Link>

      <Link href="/risk">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/risk" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <Shield className="h-5 w-5" />
          <span>Risk Management</span>
        </div>
      </Link>

      <Link href="/brokers">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/brokers" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <Building2 className="h-5 w-5" />
          <span>Brokers</span>
        </div>
      </Link>

      <Link href="/backtests">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/backtests" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <History className="h-5 w-5" />
          <span>Backtests</span>
        </div>
      </Link>

      <Link href="/analytics">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/analytics" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <BarChart3 className="h-5 w-5" />
          <span>Analytics</span>
        </div>
      </Link>

      <Link href="/logs">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/logs" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <FileText className="h-5 w-5" />
          <span>Logs & Alerts</span>
        </div>
      </Link>

      <Link href="/audit">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/audit" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <Search className="h-5 w-5" />
          <span>Audit</span>
        </div>
      </Link>

      <Link href="/signals">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/signals" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <Zap className="h-5 w-5" />
          <span>Trading Signals</span>
        </div>
      </Link>

      <Link href="/telegram">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
          location === "/telegram" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}>
          <MessageSquare className="h-5 w-5" />
          <span>Telegram Bot</span>
        </div>
      </Link>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Trading Bot</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <div className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-semibold">Trading Bot</h1>
            <p className="text-sm text-muted-foreground">Automated Trading Platform</p>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavigationItems />
          </nav>
        </div>
      </>
    );
  }

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
        <NavigationItems />
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
};

export default Sidebar;