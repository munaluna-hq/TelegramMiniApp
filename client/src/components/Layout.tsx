import { ReactNode, useState } from "react";
import { Calendar, ListTodo, Settings as SettingsIcon } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">MunaLuna</h1>
          <button
            onClick={() => setActiveTab("settings")}
            className="text-white"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm mt-1 opacity-90">Помощник для осознанных поклонений</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-col items-center ${
            activeTab === "calendar" ? "tab-active" : "tab-inactive"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Календарь</span>
        </button>
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex flex-col items-center ${
            activeTab === "tracker" ? "tab-active" : "tab-inactive"
          }`}
        >
          <ListTodo className="h-5 w-5" />
          <span className="text-xs mt-1">Трекер</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center ${
            activeTab === "settings" ? "tab-active" : "tab-inactive"
          }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Настройки</span>
        </button>
      </nav>
    </div>
  );
}
