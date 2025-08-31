import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import AccountOverview from "@/components/dashboard/account-overview";
import RiskStatus from "@/components/dashboard/risk-status";
import ActiveStrategies from "@/components/dashboard/active-strategies";
import RecentTrades from "@/components/dashboard/recent-trades";
import OpenPositions from "@/components/dashboard/open-positions";
import SystemHealth from "@/components/dashboard/system-health";
import RecentAlerts from "@/components/dashboard/recent-alerts";

// Define the dashboard data interface
interface DashboardData {
  account: {
    balance: string;
    equity: string;
    dailyPnL: string;
    openPnL: string;
  };
  risk: any;
  strategies: any;
  openPositions: any[];
  recentTrades: any[];
  systemHealth: any[];
  alerts: any[];
}

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // WebSocket for real-time updates
  useWebSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Dashboard" 
        description="Live trading system overview" 
      />

      <div className="p-6 space-y-6">
        <AccountOverview data={dashboardData.account} />

        <RiskStatus data={dashboardData.risk} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveStrategies 
            strategies={dashboardData.strategies} 
            openPositions={dashboardData.openPositions}
          />
          <RecentTrades trades={dashboardData.recentTrades} />
        </div>

        <OpenPositions positions={dashboardData.openPositions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemHealth health={dashboardData.systemHealth} />
          <RecentAlerts alerts={dashboardData.alerts} />
        </div>
      </div>
    </>
  );
}