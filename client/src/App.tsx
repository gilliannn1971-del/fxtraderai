import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Strategies from "@/pages/strategies";
import Risk from "@/pages/risk";
import Brokers from "@/pages/brokers";
import Backtests from "@/pages/backtests";
import Logs from "@/pages/logs";
import AuditPage from "./pages/audit";
import TelegramPage from "./pages/telegram";
import NotFoundPage from "./pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/strategies" component={Strategies} />
          <Route path="/risk" component={Risk} />
          <Route path="/brokers" component={Brokers} />
          <Route path="/backtests" component={Backtests} />
          <Route path="/logs" component={Logs} />
          <Route path="/audit" component={AuditPage} />
          <Route path="/telegram" component={TelegramPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;