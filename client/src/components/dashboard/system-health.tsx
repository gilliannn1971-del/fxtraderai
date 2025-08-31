import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemStatus {
  service: string;
  status: string;
  latency?: number;
  metadata?: any;
}

interface SystemHealthProps {
  health: SystemStatus[];
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "online": return "status-online";
      case "warning": case "reconnecting": return "status-warning";
      case "error": case "offline": return "status-error";
      default: return "status-offline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "online": return "Connected";
      case "warning": return "Warning";
      case "error": return "Error";
      case "offline": return "Offline";
      default: return status;
    }
  };

  // Default system components with fallback data
  const systemComponents = [
    {
      name: "OANDA (Demo)",
      status: "ONLINE",
      latency: 23,
      lastTick: "14:35:42"
    },
    {
      name: "MT5 Bridge",
      status: "WARNING",
      latency: null,
      lastTick: "14:33:15"
    },
    {
      name: "Strategy Engine",
      status: health.find(h => h.service === "strategy-engine")?.status || "ONLINE",
      latency: health.find(h => h.service === "strategy-engine")?.latency || 0,
      cpu: "12%",
      memory: "1.2GB"
    },
    {
      name: "Risk Manager",
      status: health.find(h => h.service === "risk-manager")?.status || "ONLINE",
      latency: health.find(h => h.service === "risk-manager")?.latency || 0,
      checksPerMin: health.find(h => h.service === "risk-manager")?.metadata?.checksPerMinute || 847,
      blocks: health.find(h => h.service === "risk-manager")?.metadata?.blocks || 0
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>System Health & Broker Status</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemComponents.map((component, index) => (
            <div key={component.name} className="space-y-4" data-testid={`system-component-${index}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium" data-testid={`component-name-${index}`}>{component.name}</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusClass(component.status)}`}></div>
                  <span 
                    className={`text-xs ${
                      component.status === "ONLINE" ? "profit" : 
                      component.status === "WARNING" ? "warning" : "neutral"
                    }`}
                    data-testid={`component-status-${index}`}
                  >
                    {getStatusText(component.status)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {component.latency !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono" data-testid={`component-latency-${index}`}>
                      {component.latency}ms
                    </span>
                  </div>
                )}
                {component.lastTick && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Tick</span>
                    <span className="font-mono" data-testid={`component-last-tick-${index}`}>
                      {component.lastTick}
                    </span>
                  </div>
                )}
                {component.cpu && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="font-mono" data-testid={`component-cpu-${index}`}>
                      {component.cpu}
                    </span>
                  </div>
                )}
                {component.memory && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="font-mono" data-testid={`component-memory-${index}`}>
                      {component.memory}
                    </span>
                  </div>
                )}
                {component.checksPerMin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checks/min</span>
                    <span className="font-mono" data-testid={`component-checks-${index}`}>
                      {component.checksPerMin}
                    </span>
                  </div>
                )}
                {typeof component.blocks === "number" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blocks</span>
                    <span className="font-mono" data-testid={`component-blocks-${index}`}>
                      {component.blocks}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
