import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTelegramUser, getTelegramInitData } from '../lib/telegram';

/**
 * This component is used for debugging Telegram WebApp user data
 * It helps diagnose issues with Telegram ID retrieval in different environments
 */
export function TelegramUserDebug() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [rawInitData, setRawInitData] = useState<string | null>(null);
  const [hasWebApp, setHasWebApp] = useState(false);
  const [hasUserData, setHasUserData] = useState(false);
  
  // Update the debug info every second
  useEffect(() => {
    const checkTelegramStatus = () => {
      try {
        // Check if Telegram WebApp is available
        const webAppExists = window.Telegram && window.Telegram.WebApp;
        setHasWebApp(webAppExists);
        
        // Check if user data is available
        let userData = null;
        let userDataExists = false;
        
        if (webAppExists && window.Telegram.WebApp.initDataUnsafe) {
          userData = window.Telegram.WebApp.initDataUnsafe.user || null;
          userDataExists = !!userData;
        }
        
        setHasUserData(userDataExists);
        
        // Get and set the user data from our helper function
        const user = getTelegramUser();
        setTelegramUser(user);
        
        // Get and set the raw initData
        const initData = getTelegramInitData();
        setRawInitData(initData);
      } catch (error) {
        console.error("Error checking Telegram status:", error);
      }
    };
    
    // Run immediately
    checkTelegramStatus();
    
    // Then run every 2 seconds
    const interval = setInterval(checkTelegramStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          Telegram Debug Info
          <Badge variant={hasWebApp ? "default" : "destructive"} className="ml-2">
            {hasWebApp ? "WebApp OK" : "No WebApp"}
          </Badge>
          <Badge variant={hasUserData ? "default" : "secondary"} className="ml-2">
            {hasUserData ? "User Data OK" : "No User Data"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Information about the current Telegram WebApp environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">WebApp Available:</h3>
          <p className="text-sm">{hasWebApp ? "Yes" : "No"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-1">User Data Available:</h3>
          <p className="text-sm">{hasUserData ? "Yes" : "No"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-1">getTelegramUser() Result:</h3>
          <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-auto max-h-32">
            {JSON.stringify(telegramUser, null, 2)}
          </pre>
          <p className="text-xs mt-1 text-gray-500">
            {telegramUser?.id ? `⚠️ Using Telegram ID: ${telegramUser.id}` : "No Telegram ID available"}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-1">Init Data:</h3>
          <p className="text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded-md">
            {rawInitData || "No init data available"}
          </p>
        </div>
        
        <p className="text-xs text-red-500 mt-2">
          This debug panel is only for development purposes
        </p>
      </CardContent>
    </Card>
  );
}