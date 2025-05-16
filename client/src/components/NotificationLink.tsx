import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function NotificationLink() {
  return (
    <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 my-4">
      <h3 className="text-lg font-medium text-pink-800 mb-2">Тестирование уведомлений</h3>
      <p className="text-sm text-pink-700 mb-3">
        Если вы не получаете уведомления в Telegram, попробуйте наш новый инструмент для тестирования и диагностики:
      </p>
      <Link href="/notifications-test">
        <Button className="w-full bg-pink-600 hover:bg-pink-700">
          <Bell className="w-4 h-4 mr-2" />
          Открыть тест уведомлений
        </Button>
      </Link>
    </div>
  );
}