import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Subscribe to push notifications if we had a backend
        // For now we just get the permission so we can use local SW notifications
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return false;
  };

  const scheduleLocalReminder = async (title: string, body: string, delayMs = 5000) => {
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Since we don't have a backend to send real push messages,
      // we'll simulate a delayed notification via the service worker's showNotification
      setTimeout(() => {
        registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: '/',
        });
      }, delayMs);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleLocalReminder
  };
}
