import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitcoach.app',
  appName: 'FitCoach',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
