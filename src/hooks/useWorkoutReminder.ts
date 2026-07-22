import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

const REMINDER_KEY_PREFIX = 'workout_reminder_shown_';

export function useWorkoutReminder() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        // Request permission after a short delay so it's not too aggressive on first load
        setTimeout(() => {
          Notification.requestPermission().then(setPermission);
        }, 5000);
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
        const reminderEnabled = userData.reminderEnabled ?? true;
        
        if (!reminderEnabled) return;

        const reminderTimeStr = userData.reminderTime || '18:00';
        const [reminderHour, reminderMinute] = reminderTimeStr.split(':').map(Number);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if current time is past the reminder time
        if (currentHour < reminderHour || (currentHour === reminderHour && currentMinute < reminderMinute)) {
          return; // Too early
        }

        const todayStr = format(now, 'yyyy-MM-dd');
        const reminderKey = `${REMINDER_KEY_PREFIX}${todayStr}`;
        
        // If we already showed it today, skip
        if (localStorage.getItem(reminderKey)) return;

        const workoutRef = doc(db, 'users', user.uid, 'completed_workouts', todayStr);
        const workoutSnap = await getDoc(workoutRef);

        if (!workoutSnap.exists() || !workoutSnap.data().completed) {
          // Show notification
          new Notification('Time to crush it!', {
            body: "You haven't logged your workout today. Let's get moving!",
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png'
          });
          
          localStorage.setItem(reminderKey, 'true');
        }
      } catch (error) {
        console.error('Error checking workout status for reminder:', error);
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
