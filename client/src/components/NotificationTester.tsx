import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function NotificationTester() {
  const [telegramId, setTelegramId] = useState('262371163');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendTestNotification = async () => {
    if (!telegramId) {
      toast({
        title: "Ошибка",
        description: "Введите корректный Telegram ID",
        variant: "destructive"
      });
      return;
    }

    setSending(true);

    try {
      // Send test notification
      const response = await fetch('/api/send-direct-test', {
        method: 'POST',
        body: JSON.stringify({ telegramId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
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
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить тестовое уведомление. Проверьте консоль для подробностей.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Тестирование уведомлений</CardTitle>
        <CardDescription>
          Отправьте тестовое уведомление в Telegram, чтобы убедиться что всё работает правильно
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="telegramId">Ваш Telegram ID</Label>
            <Input
              id="telegramId"
              placeholder="Например: 262371163"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.open("https://t.me/munaluna1_bot", "_blank")}>
          Открыть бот
        </Button>
        <Button onClick={sendTestNotification} disabled={sending}>
          {sending ? "Отправка..." : "Отправить тестовое уведомление"}
        </Button>
      </CardFooter>
    </Card>
  );
}