import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    loading: true
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
          
          // Get city name using reverse geocoding API
          // For simplicity, we'll just set a placeholder city name
          // In a real application, you could use a reverse geocoding service
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
        
        // Show error toast
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
      // First get current settings
      const response = await fetch("/api/settings");
      let settings = await response.json();
      
      // If settings are missing or incomplete, provide default values to ensure
      // we meet the schema requirements
      if (!settings) {
        settings = {};
      }
      
      // Make sure all required fields are present
      const updatedSettings = {
        latitude,
        longitude,
        city,
        // Include these required fields with defaults if they don't exist
        notificationTime: settings.notificationTime || "exact",
        notifyFajr: settings.notifyFajr !== undefined ? settings.notifyFajr : false,
        notifyZuhr: settings.notifyZuhr !== undefined ? settings.notifyZuhr : true,
        notifyAsr: settings.notifyAsr !== undefined ? settings.notifyAsr : true,
        notifyMaghrib: settings.notifyMaghrib !== undefined ? settings.notifyMaghrib : true,
        notifyIsha: settings.notifyIsha !== undefined ? settings.notifyIsha : true,
        menstruationDays: settings.menstruationDays || 5,
        cycleDays: settings.cycleDays || 28
      };
      
      // Save updated settings
      await apiRequest("POST", "/api/settings", updatedSettings);
      
      // Invalidate settings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
      // Also invalidate prayer times since they depend on location
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