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

        // Check workout
        const workoutRef = doc(db, 'users', user.uid, 'completed_workouts', todayStr);
        const workoutSnap = await getDoc(workoutRef);
        const workoutCompleted = workoutSnap.exists() && workoutSnap.data().completed;

        // Check nutrition
        const nutritionRef = doc(db, 'users', user.uid, 'completed_nutrition', todayStr);
        const nutritionSnap = await getDoc(nutritionRef);
        
        let allMealsCompleted = false;
        if (nutritionSnap.exists()) {
           const data = nutritionSnap.data();
           const bk = data.breakfast?.completed || data.breakfast === true;
           const lu = data.lunch?.completed || data.lunch === true;
           const dn = data.dinner?.completed || data.dinner === true;
           allMealsCompleted = bk && lu && dn;
        }

        if (!workoutCompleted || !allMealsCompleted) {
          const title = 'Time to crush it!';
          let body = "Don't forget to complete your daily meal plan and workout!";
          
          if (!workoutCompleted && allMealsCompleted) {
             body = "Your meals are on point! Now it's time to log your workout.";
          } else if (workoutCompleted && !allMealsCompleted) {
             body = "Great job on the workout! Don't forget to log your meals.";
          }

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(title, {
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                data: window.location.href,
                
              });
            });
          } else {
            new Notification(title, { body, icon: '/pwa-192x192.png' });
          }
          
          localStorage.setItem(reminderKey, 'true');
        } else {
          // Both completed, no need to remind, but we can set the flag so we don't check again today
          localStorage.setItem(reminderKey, 'true');
        }

      } catch (error) {
        console.error('Error checking status for reminder:', error);
      }
    };

    let unsubscribe: () => void;
    
    const interval = setInterval(() => {
      if (auth.currentUser) {
        checkAndNotify(auth.currentUser);
      }
    }, 60 * 1000);

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAndNotify(user);
      }
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [permission]);
}
