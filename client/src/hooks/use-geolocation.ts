import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTelegramUser } from '@/lib/telegram';

interface GeolocationState {
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    error: null,
    loading: false
  });
  
  const { toast } = useToast();

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: "Геолокация не поддерживается вашим устройством", 
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Format coordinates to 6 decimal places
          const latitude = position.coords.latitude.toFixed(6);
          const longitude = position.coords.longitude.toFixed(6);
          
          // Get city name (in a real app would use reverse geocoding)
          const city = "Определено автоматически";
          
          // Save to state
          setState({
            latitude,
            longitude,
            city,
            error: null,
            loading: false
          });
          
          // Save the coordinates to the user's settings
          await saveLocationToSettings(latitude, longitude, city);
        } catch (error) {
          console.error("Error processing location:", error);
          setState(prev => ({ 
            ...prev, 
            error: "Ошибка при обработке местоположения", 
            loading: false 
          }));
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Не удалось определить местоположение";
        
        if (error.code === 1) {
          errorMessage = "Доступ к местоположению запрещен";
        } else if (error.code === 2) {
          errorMessage = "Местоположение недоступно";
        } else if (error.code === 3) {
          errorMessage = "Превышено время ожидания";
        }
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));
        
        toast({
          title: "❌ Ошибка геолокации",
          description: errorMessage,
          variant: "destructive",
          duration: 3000,
        });
      }, 
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  // Function to save location to user settings
  const saveLocationToSettings = async (latitude: string, longitude: string, city: string) => {
    try {
      // Get Telegram user data to ensure we're saving to the correct user
      const telegramUser = getTelegramUser();
      const userId = telegramUser?.id || 1;
      
      console.log(`Saving location to settings for user ID: ${userId}`);
      
      // Get current settings for this user
      const settings = await apiRequest('GET', `/api/settings?userId=${userId}`);
      
      // Create updated settings object with location data
      const updatedSettings = {
        userId,
        latitude,
        longitude,
        city,
        // Keep existing settings or use defaults
        notificationTime: settings?.notificationTime || "exact",
        notifyFajr: settings?.notifyFajr ?? false,
        notifyZuhr: settings?.notifyZuhr ?? true,
        notifyAsr: settings?.notifyAsr ?? true,
        notifyMaghrib: settings?.notifyMaghrib ?? true,
        notifyIsha: settings?.notifyIsha ?? true,
        menstruationDays: settings?.menstruationDays || 5,
        cycleDays: settings?.cycleDays || 28
      };
      
      // Save updated settings to database
      await apiRequest("POST", `/api/settings?userId=${userId}`, updatedSettings);
      
      // Update client data
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-times'] });
      
      toast({
        title: "✅ Местоположение обновлено",
        description: "Ваше местоположение было автоматически обновлено.",
        variant: "default",
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Error saving location to settings:", error);
      toast({
        title: "❌ Ошибка",
        description: "Не удалось сохранить местоположение.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return {
    ...state,
    detectLocation
  };
}