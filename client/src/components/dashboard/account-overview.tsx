import { Card, CardContent } from "@/components/ui/card";

interface AccountData {
  balance: string;
  equity: string;
  dailyPnL: string;
  openPnL: string;
}

interface AccountOverviewProps {
  data: AccountData;
}

export default function AccountOverview({ data }: AccountOverviewProps) {
  const dailyPnL = parseFloat(data.dailyPnL);
  const openPnL = parseFloat(data.openPnL);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Account Balance</h3>
            <i className="fas fa-wallet text-muted-foreground"></i>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono" data-testid="account-balance">
              ${parseFloat(data.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${dailyPnL >= 0 ? 'profit' : 'loss'}`}>
              <i className={`fas ${dailyPnL >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs`}></i>
              <span data-testid="daily-pnl">
                {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
              </span> today
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Open P&L</h3>
            <i className="fas fa-chart-line text-muted-foreground"></i>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold font-mono ${openPnL >= 0 ? 'profit' : 'loss'}`} data-testid="open-pnl">
              {openPnL >= 0 ? '+' : ''}${openPnL.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              <span data-testid="open-positions-count">3</span> open positions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Daily Drawdown</h3>
            <i className="fas fa-exclamation-triangle text-muted-foreground"></i>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold font-mono" data-testid="daily-drawdown">-2.1%</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: "21%" }}
                data-testid="drawdown-progress"
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">Limit: -10%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Strategies</h3>
            <i className="fas fa-brain text-muted-foreground"></i>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold" data-testid="active-strategies-count">4</p>
            <p className="text-sm text-muted-foreground">
              <span className="profit" data-testid="profitable-strategies-count">3</span> profitable today
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
