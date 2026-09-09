/**
 * Android-ready Web Push & System Notification Service
 * Supports ServiceWorker showNotification, Android vibration patterns, badging, and action buttons.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export async function sendAppNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    // Android vibration pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    // @ts-ignore
    vibrate: [200, 100, 200],
    tag: options?.tag || 'fitness-coach-alert',
    renotify: true,
    data: {
      url: options?.url || window.location.origin,
      dateOfArrival: Date.now(),
      ...options?.data,
    },
    ...options,
  };

  try {
    // If Service Worker is registered and ready, use it (required for reliable Android background notification delivery)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Standard notification fallback failed, attempting direct Notification:', err);
    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (fallbackErr) {
      console.error('Failed to trigger notification:', fallbackErr);
      return false;
    }
  }
}

/**
 * App Badging API for Android launcher icon dots / numeric badges
 */
export async function updateAppBadge(count?: number) {
  try {
    // @ts-ignore
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (count !== undefined && count > 0) {
        // @ts-ignore
        await navigator.setAppBadge(count);
      } else if (count === 0) {
        // @ts-ignore
        await navigator.clearAppBadge();
      } else {
        // @ts-ignore
        await navigator.setAppBadge();
      }
    }
  } catch (e) {
    // Badging not supported or permission denied; ignore safely
  }
}

export async function clearAppBadge() {
  try {
    // @ts-ignore
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      // @ts-ignore
      await navigator.clearAppBadge();
    }
  } catch (e) {
    // Ignore safely
  }
}
