import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roadsideally.app',
  appName: 'Roadside Ally',
  webDir: 'dist',
  server: {
    url: 'http://172.26.208.1:8080',
    cleartext: true
  }
};

export default config;
