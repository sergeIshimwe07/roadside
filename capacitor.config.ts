import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roadsideally.app',
  appName: 'Roadside Ally',
  webDir: 'dist',
  server: {
    url: 'https://roadside-seven.vercel.app/',
    cleartext: true
  }
};

export default config;


// import type { CapacitorConfig } from '@capacitor/cli';

// const config: CapacitorConfig = {
//   appId: 'app.lovable.e0a11663caf84a9a98b6bd4026186dae',
//   appName: 'emergency-road-pal',
//   webDir: 'dist',
//   server: {
//     url: 'https://e0a11663-caf8-4a9a-98b6-bd4026186dae.lovableproject.com?forceHideBadge=true',
//     // url: 'http://172.26.208.1:8080',
//     cleartext: true
//   }
// };

// export default config;