import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, User, CheckCircle, Bell } from "lucide-react";
import { getTelegramUser, showAlert } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import NotificationLink from "@/components/NotificationLink";

export default function Settings() {
  const telegramUser = getTelegramUser();
  const userId = telegramUser?.id || 1; // Get user ID from Telegram or default to 1
  
  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings', userId],
    queryFn: () => apiRequest('GET', `/api/settings?userId=${userId}`),
  });
  
  const { toast } = useToast();
  
  // Track notification test status
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);

  const [formData, setFormData] = useState({
    city: "",
    latitude: "",
    longitude: "",
    notificationTime: "exact",
    notifyFajr: false,
    notifyZuhr: true,
    notifyAsr: true,
    notifyMaghrib: true,
    notifyIsha: true,
    menstruationDays: 5,
    cycleDays: 28
  });

  // Define interface for settings
  interface UserSettings {
    id?: number;
    userId?: number;
    city?: string;
    latitude?: string;
    longitude?: string;
    notificationTime?: string;
    notifyFajr?: boolean;
    notifyZuhr?: boolean;
    notifyAsr?: boolean;
    notifyMaghrib?: boolean;
    notifyIsha?: boolean;
    menstruationDays?: number;
    cycleDays?: number;
  }

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      console.log("Loading settings from server:", settings);
      const userSettings = settings as UserSettings;
      
      // Create a new settings object with default values for missing properties
      const updatedFormData = {
        city: userSettings.city || "",
        latitude: userSettings.latitude || "",
        longitude: userSettings.longitude || "",
        // Make sure notification time is always one of the valid options
        notificationTime: ["exact", "5min", "10min"].includes(userSettings.notificationTime || "") 
          ? userSettings.notificationTime || "exact"
          : "exact",
        // Use null coalescing (??) operator to handle false values correctly
        notifyFajr: userSettings.notifyFajr ?? false,
        notifyZuhr: userSettings.notifyZuhr ?? true,
        notifyAsr: userSettings.notifyAsr ?? true,
        notifyMaghrib: userSettings.notifyMaghrib ?? true,
        notifyIsha: userSettings.notifyIsha ?? true,
        menstruationDays: userSettings.menstruationDays || 5,
        cycleDays: userSettings.cycleDays || 28
      };
      
      console.log("Setting form data to:", updatedFormData);
      setFormData(updatedFormData);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      // Add the user ID to the settings data to ensure it's updating the correct user
      return apiRequest("POST", `/api/settings?userId=${userId}`, {
        ...data,
        userId: userId, // Include user ID to ensure settings are only applied to this user
      });
    },
    onSuccess: () => {
      // Always show toast notification since it's more reliable
      toast({
        title: "✅ Настройки сохранены",
        description: "Ваши настройки успешно сохранены.",
        variant: "default",
        duration: 3000,
      });
      
      // Log success message in development
      console.log("Settings saved successfully");
      
      // Refresh settings data with the correct user ID
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
    },
    onError: (error) => {
      toast({
        title: "❌ Ошибка",
        description: "Не удалось сохранить настройки. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
        duration: 3000,
      });
      console.error("Failed to save settings:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [id]: numValue,
    }));
  };
  
  // Function to send a test notification to the user's Telegram ID
  const sendTestNotification = async () => {
    // Get the user's Telegram ID from the current logged in user
    const userTelegramId = telegramUser?.id;
    
    if (!userTelegramId) {
      toast({
        title: "Ошибка",
        description: "Невозможно определить ваш Telegram ID. Пожалуйста, обновите страницу и попробуйте снова.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingTestNotification(true);
    
    try {
      // Log the Telegram ID we're using
      console.log("Sending notification to Telegram ID:", userTelegramId);
      
      // Use our new direct test endpoint for improved reliability
      const response = await fetch('/api/send-direct-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          telegramId: userTelegramId.toString() 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Уведомление отправлено",
          description: "Тестовое уведомление было отправлено. Проверьте свой Telegram.",
          variant: "default",
        });
      } else {
        toast({
          title: "Ошибка",
          description: data.message || "Не удалось отправить тестовое уведомление",
          variant: "destructive",
        });
        
        // Log the error for debugging
        console.error("Failed to send notification:", data);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке уведомления",
        variant: "destructive",
      });
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    console.log(`Radio changed: ${name} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    console.log(`Switch changed: ${id} = ${checked}`);
    setFormData((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting settings form data:", formData);
    
    // Ensure all fields are correctly formatted and typed
    const settings = {
      ...formData,
      // Make sure notification time is valid
      notificationTime: ["exact", "5min", "10min"].includes(formData.notificationTime) 
        ? formData.notificationTime 
        : "exact",
      // Ensure boolean fields are explicitly converted to boolean
      notifyFajr: Boolean(formData.notifyFajr),
      notifyZuhr: Boolean(formData.notifyZuhr),
      notifyAsr: Boolean(formData.notifyAsr),
      notifyMaghrib: Boolean(formData.notifyMaghrib),
      notifyIsha: Boolean(formData.notifyIsha),
      // Ensure number fields are numbers
      menstruationDays: Number(formData.menstruationDays),
      cycleDays: Number(formData.cycleDays)
    };
    
    console.log("Prepared settings for saving:", settings);
    updateSettingsMutation.mutate(settings);
  };

  // Use our custom geolocation hook
  const { detectLocation, latitude, longitude, city, error, loading } = useGeolocation();
  
  // Effect to update form when geolocation is obtained
  useEffect(() => {
    if (latitude && longitude) {
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
        city: city || prev.city, // Use detected city or keep current one
      }));
    }
  }, [latitude, longitude, city]);
  
  const handleDetectLocation = () => {
    detectLocation();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Настройки</h2>

      <form onSubmit={handleSubmit}>
        {/* Location Settings */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Локация</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city" className="block text-sm text-gray-600 mb-1">
                Город
              </Label>
              <Input
                id="city"
                className="w-full"
                placeholder="Москва"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="latitude" className="block text-sm text-gray-600 mb-1">
                  Широта
                </Label>
                <Input
                  id="latitude"
                  className="w-full"
                  placeholder="55.7558"
                  value={formData.latitude}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="longitude" className="block text-sm text-gray-600 mb-1">
                  Долгота
                </Label>
                <Input
                  id="longitude"
                  className="w-full"
                  placeholder="37.6173"
                  value={formData.longitude}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleDetectLocation}
            >
              <MapPin className="h-4 w-4 mr-2" /> Определить автоматически
            </Button>
          </div>
        </div>

        {/* Prayer Notification Settings */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Напоминания о намазе</h3>
          
          {/* Notification Timing */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Время напоминания</p>
            <RadioGroup
              value={formData.notificationTime || "exact"}
              onValueChange={(value) => handleRadioChange("notificationTime", value)}
              className="flex flex-wrap gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="notification-exact" />
                <Label htmlFor="notification-exact" className="text-sm">Точно в намаз</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5min" id="notification-5min" />
                <Label htmlFor="notification-5min" className="text-sm">За 5 минут</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10min" id="notification-10min" />
                <Label htmlFor="notification-10min" className="text-sm">За 10 минут</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Prayer Notification Toggles */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="notifyFajr" className="text-gray-700">Фаджр</Label>
              <Switch
                id="notifyFajr"
                checked={formData.notifyFajr}
                onCheckedChange={(checked) => handleSwitchChange("notifyFajr", checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="notifyZuhr" className="text-gray-700">Зухр</Label>
              <Switch
                id="notifyZuhr"
                checked={formData.notifyZuhr}
                onCheckedChange={(checked) => handleSwitchChange("notifyZuhr", checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="notifyAsr" className="text-gray-700">Аср</Label>
              <Switch
                id="notifyAsr"
                checked={formData.notifyAsr}
                onCheckedChange={(checked) => handleSwitchChange("notifyAsr", checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="notifyMaghrib" className="text-gray-700">Магриб</Label>
              <Switch
                id="notifyMaghrib"
                checked={formData.notifyMaghrib}
                onCheckedChange={(checked) => handleSwitchChange("notifyMaghrib", checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="notifyIsha" className="text-gray-700">Иша</Label>
              <Switch
                id="notifyIsha"
                checked={formData.notifyIsha}
                onCheckedChange={(checked) => handleSwitchChange("notifyIsha", checked)}
              />
            </div>
          </div>
        </div>

        {/* Cycle Settings */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Настройки цикла</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="menstruationDays" className="block text-sm text-gray-600 mb-1">
                Средняя длительность менструации (дни)
              </Label>
              <Input
                id="menstruationDays"
                type="number"
                min="1"
                max="14"
                className="w-full"
                value={formData.menstruationDays}
                onChange={(e) => handleNumberChange("menstruationDays", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cycleDays" className="block text-sm text-gray-600 mb-1">
                Средняя длительность цикла (дни)
              </Label>
              <Input
                id="cycleDays"
                type="number"
                min="21"
                max="45"
                className="w-full"
                value={formData.cycleDays}
                onChange={(e) => handleNumberChange("cycleDays", e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h3 className="text-lg font-medium mb-3">Аккаунт</h3>
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-medium mr-3">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{telegramUser?.first_name || "Пользователь"}</p>
              <p className="text-sm text-gray-600">ID: {telegramUser?.id || "N/A"}</p>
            </div>
          </div>
          
          {/* Test Notification Section */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <h4 className="text-md font-medium mb-2">Тестовое уведомление</h4>
            <p className="text-sm text-gray-600 mb-2">Отправьте тестовое уведомление, чтобы проверить настройки бота</p>
            
            <Button 
              type="button"
              onClick={sendTestNotification}
              disabled={isSendingTestNotification}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isSendingTestNotification ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Отправка...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Отправить тестовое уведомление
                </span>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Уведомление будет отправлено на ваш аккаунт Telegram
            </p>
          </div>
          
          {/* Add link to the new notifications test page */}
          <NotificationLink />
        </div>

        {/* Save Button */}
        <Button 
          type="submit" 
          className="w-full mb-4"
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение...
            </span>
          ) : (
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Сохранить настройки
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
