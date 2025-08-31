import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          wsRef.current = null;
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "PRICE_UPDATE":
        // Update market data in cache
        queryClient.setQueryData(["market-data", data.data.symbol], data.data);
        break;
        
      case "STRATEGY_STARTED":
      case "STRATEGY_STOPPED":
      case "STRATEGY_UPDATED":
        // Invalidate strategies query to refetch
        queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        break;
        
      case "POSITION_OPENED":
      case "POSITION_CLOSED":
      case "POSITION_UPDATED":
        // Invalidate positions and dashboard queries
        queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        break;
        
      case "ORDER_FILLED":
      case "ORDER_CANCELLED":
        // Invalidate orders query
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        break;
        
      case "RISK_EVENT":
        // Invalidate risk data
        queryClient.invalidateQueries({ queryKey: ["/api/risk/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/risk/events"] });
        break;
        
      case "ALERT_CREATED":
        // Invalidate alerts
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        break;
        
      case "EMERGENCY_STOP":
        // Force refresh all data
        queryClient.invalidateQueries();
        break;
        
      case "SYSTEM_STATUS_UPDATE":
        // Update system status
        queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        break;
        
      default:
        console.log("Unknown WebSocket message type:", data.type);
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  return { sendMessage, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
