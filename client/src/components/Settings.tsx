import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, User } from "lucide-react";
import { getTelegramUser } from "@/lib/telegram";

export default function Settings() {
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

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

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        city: settings.city || "",
        latitude: settings.latitude || "",
        longitude: settings.longitude || "",
        notificationTime: settings.notificationTime || "exact",
        notifyFajr: settings.notifyFajr || false,
        notifyZuhr: settings.notifyZuhr || true,
        notifyAsr: settings.notifyAsr || true,
        notifyMaghrib: settings.notifyMaghrib || true,
        notifyIsha: settings.notifyIsha || true,
        menstruationDays: settings.menstruationDays || 5,
        cycleDays: settings.cycleDays || 28
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
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

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const telegramUser = getTelegramUser();

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
              value={formData.notificationTime}
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
        </div>

        {/* Save Button */}
        <Button type="submit" className="w-full mb-4">
          Сохранить настройки
        </Button>
      </form>
    </div>
  );
}
