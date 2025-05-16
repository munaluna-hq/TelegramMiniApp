import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { getTelegramUser } from '../lib/telegram';
// No longer using apiRequest
import { ClipboardCheck, BellRing, AlertTriangle } from 'lucide-react';

/**
 * NotificationTest Component
 * 
 * This component provides a simple UI for testing Telegram notifications
 * directly from the Telegram Mini App interface.
 */
export function NotificationTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; method?: string } | null>(null);
  
  // Function to send a test notification
  const sendTestNotification = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Always use a real Telegram ID for testing
      const REAL_TELEGRAM_ID = 262371163;
      
      // Try to get the user from Telegram WebApp
      const user = getTelegramUser();
      const telegramId = user?.id || REAL_TELEGRAM_ID;
      
      console.log(`Sending test notification using Telegram ID: ${telegramId}`);
      
      // Send the notification test request
      const response = await fetch("/api/test-mini-app-notification", {
        method: "POST",
        body: JSON.stringify({
          telegramId: telegramId.toString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Notification test response:", data);
      setResult(data);
    } catch (error) {
      console.error("Error sending test notification:", error);
      setResult({
        success: false,
        message: "Произошла ошибка при отправке тестового уведомления."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellRing className="mr-2 h-5 w-5" />
          Тест уведомлений
        </CardTitle>
        <CardDescription>
          Проверьте работу уведомлений от приложения MunaLuna
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm">
          Нажмите кнопку ниже, чтобы отправить тестовое уведомление. Если всё настроено правильно, 
          вы получите уведомление в Telegram в течение нескольких секунд.
        </p>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? "Успешно!" : "Ошибка!"}
            </AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{result.message}</p>
              {result.method && result.success && (
                <p className="text-xs text-muted-foreground">
                  Метод доставки: {result.method === 'direct_api' 
                    ? 'Прямой API запрос' 
                    : result.method === 'enhanced' 
                      ? 'Расширенные уведомления' 
                      : result.method === 'silent' 
                        ? 'Тихое уведомление' 
                        : result.method}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={sendTestNotification} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Отправка...
            </>
          ) : (
            <>
              <BellRing className="mr-2 h-4 w-4" />
              Отправить тестовое уведомление
            </>
          )}
        </Button>
        
        {/* Direct API button */}
        <Button 
          onClick={async () => {
            setIsLoading(true);
            setResult(null);
            
            try {
              // Always use a real Telegram ID for testing
              const REAL_TELEGRAM_ID = 262371163;
              
              // Try to get the user from Telegram WebApp
              const user = getTelegramUser();
              const telegramId = user?.id || REAL_TELEGRAM_ID;
              
              console.log(`Sending direct API notification using Telegram ID: ${telegramId}`);
              
              // Send the notification using direct API endpoint
              const response = await fetch("/api/direct-api-notification", {
                method: "POST",
                body: JSON.stringify({
                  telegramId: telegramId.toString()
                }),
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const data = await response.json();
              console.log("Direct API notification response:", data);
              setResult(data);
            } catch (error) {
              console.error("Error sending direct API notification:", error);
              setResult({
                success: false,
                message: "Произошла ошибка при отправке прямого уведомления."
              });
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading} 
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Отправка...
            </>
          ) : (
            <>
              <BellRing className="mr-2 h-4 w-4" />
              Прямое API уведомление
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}