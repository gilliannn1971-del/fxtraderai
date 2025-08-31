interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
}

type PriceUpdateCallback = (update: MarketData) => void;

class MarketDataService {
  private prices = new Map<string, MarketData>();
  private callbacks: PriceUpdateCallback[] = [];
  private isRunning = false;

  constructor() {
    this.initializePrices();
    this.start();
  }

  private initializePrices(): void {
    // Initialize with common forex pairs
    const symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "GBPJPY"];
    const basePrices = {
      "EURUSD": 1.0845,
      "GBPUSD": 1.2650,
      "USDJPY": 148.50,
      "AUDUSD": 0.6745,
      "USDCAD": 1.3420,
      "NZDUSD": 0.6123,
      "GBPJPY": 187.85,
    };

    for (const symbol of symbols) {
      const basePrice = basePrices[symbol as keyof typeof basePrices] || 1.0;
      const spread = basePrice * 0.00015; // 1.5 pips spread
      
      this.prices.set(symbol, {
        symbol,
        price: basePrice,
        bid: basePrice - spread / 2,
        ask: basePrice + spread / 2,
        spread,
        timestamp: new Date(),
      });
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Market Data Service started");
    
    // Simulate real-time price updates
    this.priceUpdateLoop();
  }

  private async priceUpdateLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Update all prices
        for (const [symbol, currentData] of Array.from(this.prices.entries())) {
          const newPrice = this.simulatePriceMovement(currentData);
          this.prices.set(symbol, newPrice);
          
          // Notify callbacks
          this.callbacks.forEach(callback => {
            try {
              callback(newPrice);
            } catch (error) {
              console.error("Price update callback error:", error);
            }
          });
        }
        
        // Update every 500ms
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Price update loop error:", error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private simulatePriceMovement(currentData: MarketData): MarketData {
    // Simple random walk with mean reversion
    const volatility = currentData.price * 0.0001; // 0.01% volatility per tick
    const randomChange = (Math.random() - 0.5) * volatility * 2;
    
    // Add slight mean reversion
    const meanReversionFactor = 0.001;
    const reversion = -randomChange * meanReversionFactor;
    
    const newPrice = currentData.price + randomChange + reversion;
    const spread = newPrice * 0.00015;
    
    return {
      symbol: currentData.symbol,
      price: newPrice,
      bid: newPrice - spread / 2,
      ask: newPrice + spread / 2,
      spread,
      timestamp: new Date(),
    };
  }

  async getLatestPrice(symbol: string): Promise<MarketData | null> {
    return this.prices.get(symbol) || null;
  }

  onPriceUpdate(callback: PriceUpdateCallback): void {
    this.callbacks.push(callback);
  }

  getAllPrices(): MarketData[] {
    return Array.from(this.prices.values());
  }

  stop(): void {
    this.isRunning = false;
    console.log("Market Data Service stopped");
  }
}

export const marketDataService = new MarketDataService();
