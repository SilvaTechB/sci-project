import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.46061cd3b3574f38b282d41462fe3fb9',
  appName: 'SCI Archive',
  webDir: 'dist',
  server: {
    url: 'https://46061cd3-b357-4f38-b282-d41462fe3fb9.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    Filesystem: {
      // Request all necessary permissions on Android
    },
  },
};

export default config;
