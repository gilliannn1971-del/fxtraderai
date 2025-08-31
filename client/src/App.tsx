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
import Analytics from "./pages/analytics";
import Signals from "@/pages/signals";
import NotFoundPage from "./pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Settings from "./pages/settings";
import AccountManagement from "./pages/account-management";
import Support from "./pages/support";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/strategies" component={Strategies} />
          <Route path="/risk" component={Risk} />
          <Route path="/brokers" component={Brokers} />
          <Route path="/backtests" component={Backtests} />
          <Route path="/logs" component={Logs} />
          <Route path="/audit" component={AuditPage} />
          <Route path="/telegram" component={TelegramPage} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/signals" component={Signals} />
          <Route path="/settings" component={Settings} />
          <Route path="/account" component={AccountManagement} />
          <Route path="/support" component={Support} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Router />;
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <div className="dark min-h-screen bg-background text-foreground">
              <Toaster />
              <AuthenticatedApp />
            </div>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;