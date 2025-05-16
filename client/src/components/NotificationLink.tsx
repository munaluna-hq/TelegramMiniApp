import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function NotificationLink() {
  return (
    <div className="bg-pink-100 border-2 border-pink-300 rounded-lg p-4 my-4 shadow-md relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-pink-200 rounded-full opacity-50"></div>
      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-200 rounded-full opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <Bell className="w-5 h-5 text-pink-600 mr-2" />
          <h3 className="text-lg font-bold text-pink-800">Тестирование уведомлений</h3>
        </div>
        
        <p className="text-sm text-pink-700 mb-4 font-medium">
          ⚠️ Проблемы с получением уведомлений? Используйте наш расширенный инструмент тестирования:
        </p>
        
        <ul className="text-xs text-pink-700 mb-4 space-y-1 ml-6 list-disc">
          <li>Прямая отправка тестовых уведомлений</li>
          <li>Проверка соединения с Telegram</li>
          <li>Тестирование всех типов уведомлений</li>
        </ul>
        
        <Link href="/notifications-test">
          <Button className="w-full bg-pink-600 hover:bg-pink-700 shadow-sm transition-all duration-300 hover:shadow-md">
            <Bell className="w-5 h-5 mr-2" />
            Открыть расширенное тестирование
          </Button>
        </Link>
      </div>
    </div>
  );
}