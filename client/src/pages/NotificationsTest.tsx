import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getTelegramUser } from "@/lib/telegram";

export default function NotificationsTest() {
  const [telegramId, setTelegramId] = useState('262371163');
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const { toast } = useToast();
  const telegramUser = getTelegramUser();

  const sendDirectTestNotification = async () => {
    if (!telegramId) {
      toast({
        title: "Ошибка",
        description: "Введите корректный Telegram ID",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    setLastResponse(null);

    try {
      console.log(`Sending test notification to Telegram ID: ${telegramId}`);
      
      const response = await fetch('/api/send-direct-test', {
        method: 'POST',
        body: JSON.stringify({ telegramId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setLastResponse(result);
      
      if (result.success) {
        toast({
          title: "Уведомление отправлено!",
          description: "Пожалуйста, проверьте ваш Telegram",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка отправки",
          description: result.message || "Не удалось отправить уведомление",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setLastResponse({ error: String(error) });
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить тестовое уведомление. Проверьте консоль для подробностей.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const sendOriginalTestNotification = async () => {
    if (!telegramId) {
      toast({
        title: "Ошибка",
        description: "Введите корректный Telegram ID",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    setLastResponse(null);

    try {
      console.log(`Sending original test notification to Telegram ID: ${telegramId}`);
      
      const response = await fetch('/api/send-test-notification', {
        method: 'POST',
        body: JSON.stringify({ telegramId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setLastResponse(result);
      
      if (response.ok) {
        toast({
          title: "Уведомление отправлено!",
          description: "Пожалуйста, проверьте ваш Telegram",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка отправки",
          description: result.message || "Не удалось отправить уведомление",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setLastResponse({ error: String(error) });
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить тестовое уведомление",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Тестирование уведомлений</h1>
      
      {/* User Info Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Информация о пользователе</CardTitle>
          <CardDescription>
            Проверьте свои данные для отправки уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="mr-4 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center">
              {telegramUser?.first_name?.[0] || "U"}
            </div>
            <div>
              <p className="font-medium">{telegramUser?.first_name || "Неизвестный пользователь"}</p>
              <p className="text-sm">Telegram ID: {telegramUser?.id || "Недоступно"}</p>
              <p className="text-sm">Имя: {telegramUser?.username ? `@${telegramUser.username}` : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Notification Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Отправка тестового уведомления</CardTitle>
          <CardDescription>
            Отправьте тестовое уведомление в Telegram, чтобы убедиться, что система уведомлений работает
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegramId">Ваш Telegram ID</Label>
              <Input
                id="telegramId"
                placeholder="Например: 262371163"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Telegram ID можно найти в настройках вашего Telegram, или используйте ID, отображаемый выше
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex w-full gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open("https://t.me/munaluna1_bot", "_blank")}
            >
              Открыть бота в Telegram
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={sendDirectTestNotification}
              disabled={sending}
            >
              {sending ? "Отправка..." : "Прямое тестовое уведомление"}
            </Button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={sendOriginalTestNotification}
            disabled={sending}
          >
            {sending ? "Отправка..." : "Стандартное тестовое уведомление"}
          </Button>
        </CardFooter>
      </Card>

      {/* Response Section */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Результат последнего запроса</CardTitle>
            <CardDescription>
              Техническая информация о последней отправке уведомления
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Эта информация может быть полезна для отладки, если у вас возникают проблемы с получением уведомлений
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}