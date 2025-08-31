import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  const { toast } = useToast();

  const handleEmergencyStop = async () => {
    if (!confirm('Are you sure you want to trigger emergency stop? This will close all positions and halt trading.')) {
      return;
    }

    try {
      await apiRequest("POST", "/api/risk/emergency-stop");
      toast({
        title: "Emergency Stop Activated",
        description: "All trading has been halted and positions are being closed.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Emergency Stop Failed",
        description: "Failed to activate emergency stop. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="page-description">{description}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Emergency Stop */}
          <Button 
            variant="destructive" 
            onClick={handleEmergencyStop}
            data-testid="button-emergency-stop"
          >
            <i className="fas fa-stop-circle mr-2"></i>
            Emergency Stop
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium" data-testid="user-name">John Trader</p>
              <p className="text-xs text-muted-foreground" data-testid="user-role">Administrator</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <i className="fas fa-user text-primary-foreground text-sm"></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Add default export
export default Header;