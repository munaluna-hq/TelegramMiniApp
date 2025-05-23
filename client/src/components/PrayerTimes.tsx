import { useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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

// Prayer time item props
interface PrayerTimeItemProps {
  name: string;
  time?: string;
  icon: ReactNode;
  color: string;
}

export default function PrayerTimes() {
  const [date] = useState(new Date());
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
  const { data, isLoading, isError } = useQuery<PrayerTimesData>({
    queryKey: ['/api/prayer-times', formattedDate],
    queryFn: () => fetch(`/api/prayer-times?date=${formattedDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch prayer times');
        return res.json();
      }),
  });

  // Check if a prayer time is current (within the current hour)
  const isCurrentPrayer = (prayerTime?: string): boolean => {
    if (!currentTime || !prayerTime) return false;
    return prayerTime === currentTime.substring(0, 5);
  };

  // Helper function to render a prayer time item
  const renderPrayerTimeItem = ({ name, time, icon, color }: PrayerTimeItemProps) => {
    // Generate custom badge class based on the prayer time status
    const getBadgeClass = () => {
      if (isCurrentPrayer(time)) {
        if (color === 'primary') return 'bg-primary text-white';
        if (color === 'amber-500') return 'bg-amber-500 text-white';
        if (color === 'sky-500') return 'bg-sky-500 text-white';
        if (color === 'yellow-600') return 'bg-yellow-600 text-white';
        if (color === 'orange-500') return 'bg-orange-500 text-white';
        if (color === 'indigo-500') return 'bg-indigo-500 text-white';
        if (color === 'slate-700') return 'bg-slate-700 text-white';
        return 'bg-primary text-white';
      } else {
        if (color === 'primary') return 'bg-primary/10 text-primary';
        if (color === 'amber-500') return 'bg-amber-500/10 text-amber-500';
        if (color === 'sky-500') return 'bg-sky-500/10 text-sky-500';
        if (color === 'yellow-600') return 'bg-yellow-600/10 text-yellow-600';
        if (color === 'orange-500') return 'bg-orange-500/10 text-orange-500';
        if (color === 'indigo-500') return 'bg-indigo-500/10 text-indigo-500';
        if (color === 'slate-700') return 'bg-slate-700/10 text-slate-700';
        return 'bg-primary/10 text-primary';
      }
    };
      
    return (
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {icon}
          <span className="text-sm">{name}</span>
        </div>
        <Badge 
          variant={isCurrentPrayer(time) ? "default" : "outline"}
          className={getBadgeClass()}
        >
          {time || '--:--'}
        </Badge>
      </div>
    );
  };

  // Get next upcoming prayer
  const getNextPrayer = (): { name: string, time: string } | null => {
    if (!data) return null;
    
    const prayerTimes = [
      { name: 'Фаджр', time: data.fajr || '' },
      { name: 'Восход', time: data.sunrise || '' },
      { name: 'Зухр', time: data.zuhr || '' },
      { name: 'Аср', time: data.asr || '' },
      { name: 'Магриб', time: data.maghrib || '' },
      { name: 'Иша', time: data.isha || '' },
      { name: 'Полночь', time: data.midnight || '' }
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
              {/* Prayer time items */}
              {data && (
                <>
                  {renderPrayerTimeItem({
                    name: 'Фаджр', 
                    time: data.fajr, 
                    icon: <Moon className="h-4 w-4 mr-1 text-primary" />,
                    color: 'primary'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Восход', 
                    time: data.sunrise, 
                    icon: <Sunrise className="h-4 w-4 mr-1 text-amber-500" />,
                    color: 'amber-500'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Зухр', 
                    time: data.zuhr, 
                    icon: <Clock className="h-4 w-4 mr-1 text-sky-500" />,
                    color: 'sky-500'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Аср', 
                    time: data.asr, 
                    icon: <Clock className="h-4 w-4 mr-1 text-yellow-600" />,
                    color: 'yellow-600'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Магриб', 
                    time: data.maghrib, 
                    icon: <Sunset className="h-4 w-4 mr-1 text-orange-500" />,
                    color: 'orange-500'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Иша', 
                    time: data.isha, 
                    icon: <Moon className="h-4 w-4 mr-1 text-indigo-500" />,
                    color: 'indigo-500'
                  })}
                  
                  {renderPrayerTimeItem({
                    name: 'Полночь', 
                    time: data.midnight, 
                    icon: <Moon className="h-4 w-4 mr-1 text-slate-700" />,
                    color: 'slate-700'
                  })}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}