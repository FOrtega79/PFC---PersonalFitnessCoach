import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { sendAppNotification, updateAppBadge } from '../lib/notifications';

const REMINDER_KEY_PREFIX = 'workout_reminder_shown_';
const PHOTO_REMINDER_KEY_PREFIX = 'photo_reminder_shown_';

export function useWorkoutReminder() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        // Request permission after a short delay so it's not too aggressive on first load
        setTimeout(() => {
          Notification.requestPermission().then(setPermission);
        }, 4000);
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;

    const checkAndNotify = async (user: any) => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return;
        
        const userData = userSnap.data();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const todayStr = format(now, 'yyyy-MM-dd');

        // 1. Check Workout Reminder
        const reminderEnabled = userData.reminderEnabled ?? true;
        if (reminderEnabled) {
          const reminderTimeStr = userData.reminderTime || '18:00';
          const [reminderHour, reminderMinute] = reminderTimeStr.split(':').map(Number);
          
          if (currentHour > reminderHour || (currentHour === reminderHour && currentMinute >= reminderMinute)) {
            const reminderKey = `${REMINDER_KEY_PREFIX}${todayStr}`;
            
            if (!localStorage.getItem(reminderKey)) {
              const workoutRef = doc(db, 'users', user.uid, 'completed_workouts', todayStr);
              const workoutSnap = await getDoc(workoutRef);

              if (!workoutSnap.exists() || !workoutSnap.data().completed) {
                await sendAppNotification('Time to crush it! 💪', {
                  body: "You haven't logged your workout today. Let's get moving!",
                  icon: '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  tag: 'workout-reminder',
                });
                await updateAppBadge(1);
                localStorage.setItem(reminderKey, 'true');
              }
            }
          }
        }

        // 2. Check Daily Photo Reminder
        const photoReminderEnabled = userData.photoReminderEnabled ?? true;
        if (photoReminderEnabled) {
          const photoReminderTimeStr = userData.photoReminderTime || '09:00';
          const [photoHour, photoMinute] = photoReminderTimeStr.split(':').map(Number);

          if (currentHour > photoHour || (currentHour === photoHour && currentMinute >= photoMinute)) {
            const photoReminderKey = `${PHOTO_REMINDER_KEY_PREFIX}${todayStr}`;

            if (!localStorage.getItem(photoReminderKey)) {
              const logRef = doc(db, 'users', user.uid, 'daily_logs', todayStr);
              const logSnap = await getDoc(logRef);

              if (!logSnap.exists() || !logSnap.data().photo) {
                await sendAppNotification('📸 Daily Progress Snap', {
                  body: "Capture today's progress photo to track your physical transformation!",
                  icon: '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  tag: 'photo-reminder',
                });
                await updateAppBadge(1);
                localStorage.setItem(photoReminderKey, 'true');
              }
            }
          }
        }

      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    let unsubscribe: () => void;
    
    // Check every minute
    const interval = setInterval(() => {
      if (auth.currentUser) {
        checkAndNotify(auth.currentUser);
      }
    }, 60 * 1000);

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Also check immediately when auth state changes (e.g. app load)
        checkAndNotify(user);
      }
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [permission]);
}
