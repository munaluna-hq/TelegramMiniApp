import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Sunrise, Sunset, Moon } from 'lucide-react';

// Interface for prayer times data
interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
  date: string;
}

export default function PrayerTimes() {
  const [date, setDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState('');

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const timerId = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);

  // Format date as YYYY-MM-DD for API
  const formattedDate = format(date, 'yyyy-MM-dd');

  // Fetch prayer times from API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/prayer-times', formattedDate],
    queryFn: getQueryFn({
      on401: "returnNull",
      endpoint: `/api/prayer-times?date=${formattedDate}`,
      method: "GET"
    }),
  });

  // Check if a prayer time is current (within the current hour)
  const isCurrentPrayer = (prayerTime: string): boolean => {
    if (!currentTime || !prayerTime) return false;
    return prayerTime === currentTime.substring(0, 5);
  };

  // Get next upcoming prayer
  const getNextPrayer = (): { name: string, time: string } | null => {
    if (!data) return null;
    
    const prayerTimes = [
      { name: 'Фаджр', time: data.fajr },
      { name: 'Восход', time: data.sunrise },
      { name: 'Зухр', time: data.zuhr },
      { name: 'Аср', time: data.asr },
      { name: 'Магриб', time: data.maghrib },
      { name: 'Иша', time: data.isha },
      { name: 'Полночь', time: data.midnight }
    ];
    
    const currentHourMin = currentTime;
    
    // Find the next prayer time that's greater than current time
    for (const prayer of prayerTimes) {
      if (prayer.time > currentHourMin) {
        return prayer;
      }
    }
    
    // If no next prayer found today, return the first prayer of the day
    return prayerTimes[0];
  };

  const nextPrayer = data ? getNextPrayer() : null;

  if (isError) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Время молитв
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить время молитв. Пожалуйста, проверьте настройки локации.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Время молитв
          </div>
          <div className="text-sm font-normal">
            {format(date, 'd MMMM', { locale: ru })}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {nextPrayer && (
              <div className="mb-3 bg-accent p-2 rounded-md flex items-center justify-between">
                <span className="text-sm">Следующая молитва:</span>
                <Badge variant="outline" className="bg-primary/10">
                  {nextPrayer.name} - {nextPrayer.time}
                </Badge>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Moon className="h-4 w-4 mr-1 text-primary" />
                  <span className="text-sm">Фаджр</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.fajr) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.fajr) ? "bg-primary" : "bg-primary/10"}
                >
                  {data?.fajr}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Sunrise className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="text-sm">Восход</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.sunrise) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.sunrise) ? "bg-amber-500" : "bg-amber-500/10"}
                >
                  {data?.sunrise}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-sky-500" />
                  <span className="text-sm">Зухр</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.zuhr) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.zuhr) ? "bg-sky-500" : "bg-sky-500/10"}
                >
                  {data?.zuhr}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-yellow-600" />
                  <span className="text-sm">Аср</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.asr) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.asr) ? "bg-yellow-600" : "bg-yellow-600/10"}
                >
                  {data?.asr}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Sunset className="h-4 w-4 mr-1 text-orange-500" />
                  <span className="text-sm">Магриб</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.maghrib) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.maghrib) ? "bg-orange-500" : "bg-orange-500/10"}
                >
                  {data?.maghrib}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Moon className="h-4 w-4 mr-1 text-indigo-500" />
                  <span className="text-sm">Иша</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.isha) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.isha) ? "bg-indigo-500" : "bg-indigo-500/10"}
                >
                  {data?.isha}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Moon className="h-4 w-4 mr-1 text-slate-700" />
                  <span className="text-sm">Полночь</span>
                </div>
                <Badge 
                  variant={isCurrentPrayer(data?.midnight) ? "default" : "outline"}
                  className={isCurrentPrayer(data?.midnight) ? "bg-slate-700" : "bg-slate-700/10"}
                >
                  {data?.midnight}
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}