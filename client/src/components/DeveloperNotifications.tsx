import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Notification {
  message: string;
  timestamp: number;
}

// Component to simulate Telegram notifications in development mode
export default function DeveloperNotifications() {
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [processedIds, setProcessedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Function to check for new notifications
    const checkForNotifications = async () => {
      try {
        const response = await fetch('/api/dev-notifications');
        if (response.ok) {
          const data = await response.json();
          
          if (!data.notifications || !Array.isArray(data.notifications)) {
            return;
          }
          
          // Display new notifications
          const currentTime = Date.now();
          let hasNewNotifications = false;
          
          data.notifications.forEach((notification: Notification) => {
            // Only show notifications that are:
            // 1. Newer than our last check time
            // 2. Haven't been processed already (using timestamp as ID)
            if (notification.timestamp > lastCheckTime && !processedIds.has(notification.timestamp)) {
              hasNewNotifications = true;
              
              // Mark this notification as processed
              setProcessedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(notification.timestamp);
                return newSet;
              });
              
              // Show as toast
              toast({
                title: "📱 Telegram Notification",
                description: notification.message,
                variant: "default",
                duration: 10000,
              });
            }
          });
          
          // Update last check time if we have new notifications
          if (hasNewNotifications) {
            setLastCheckTime(currentTime);
          }
        }
      } catch (error) {
        console.error('Error checking for notifications:', error);
      }
    };

    // Check immediately on mount
    checkForNotifications();

    // Set interval to check periodically
    const intervalId = setInterval(checkForNotifications, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [lastCheckTime, processedIds]);

  // Render nothing visually, this is just a background process
  return null;
}