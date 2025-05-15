import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { getTelegramUser } from "@/lib/telegram";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useGeolocation } from "@/hooks/use-geolocation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const user = getTelegramUser();
        
        if (user) {
          // Register or authenticate user with our backend
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramUser: user }),
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  // Initialize geolocation hook
  const geolocation = useGeolocation();
  
  // Effect to detect location after authentication
  useEffect(() => {
    if (isAuthenticated && !showSplash) {
      // Automatic geolocation detection
      console.log("Detecting user location...");
      geolocation.detectLocation();
    }
  }, [isAuthenticated, showSplash]);

  // Show loading animation on launch
  if (showSplash) {
    return <LoadingAnimation onComplete={handleAnimationComplete} />;
  }

  // Show loading state after animation if still authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-primary text-xl font-heading">Загрузка...</div>
      </div>
    );
  }

  // For development purposes - auto-authenticate in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && !isAuthenticated) {
    console.log("Development mode: Auto-authenticating");
    setIsAuthenticated(true);
  }
  
  if (!isAuthenticated) {
    // Create a mock user for development testing
    const mockTelegramUser = {
      id: 12345,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      auth_date: Math.floor(Date.now() / 1000)
    };
    
    // Try to detect if we're in Telegram's webview
    const isInTelegram = window.Telegram && window.Telegram.WebApp;
    
    // If we're in Telegram but not authenticated, try to authenticate again
    if (isInTelegram) {
      // Try to authenticate with Telegram data 
      const retryAuthentication = async () => {
        try {
          const user = getTelegramUser(); // Import from telegram.ts
          
          if (user) {
            // Register or authenticate user with our backend
            const response = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegramUser: user }),
            });
            
            if (response.ok) {
              setIsAuthenticated(true);
            }
          }
        } catch (error) {
          console.error("Authentication retry error:", error);
        }
      };
      
      // Try to authenticate after a short delay
      setTimeout(() => {
        retryAuthentication();
      }, 500);
      
      // Show loading while trying to authenticate
      return (
        <div className="min-h-screen flex items-center justify-center bg-light">
          <div className="text-primary text-xl font-heading">Загрузка...</div>
        </div>
      );
    }
    
    // Not in Telegram and not authenticated
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-light p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-heading font-semibold text-primary mb-4">MunaLuna</h1>
          <p className="text-dark mb-6">Пожалуйста, откройте приложение через Telegram бота</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
