import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors">
                <div className="text-right">
                  <p className="text-sm font-medium" data-testid="user-name">
                    {user?.username || "Loading..."}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="user-role">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-primary-foreground text-sm"></i>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <i className="fas fa-cog mr-2 text-sm"></i>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <i className="fas fa-user-circle mr-2 text-sm"></i>
                Account Management
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <i className="fas fa-life-ring mr-2 text-sm"></i>
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600" 
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
              >
                <i className="fas fa-sign-out-alt mr-2 text-sm"></i>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// Add default export
export default Header;