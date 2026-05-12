import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DudaBusca',
  slug: 'dudabusca',
  owner: 'arturlras-organization',
  version: '0.4.2026',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#4CAF50',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.dudabusca.app',
    infoPlist: {
      NSCameraUsageDescription: 'Necessário para fotografar gôndolas e detectar preços.',
      NSPhotoLibraryUsageDescription: 'Necessário para selecionar fotos de gôndolas.',
    },
  },
  android: {
    package: 'com.dudabusca.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4CAF50',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission: 'Necessário para fotografar gôndolas e detectar preços.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Necessário para selecionar fotos de gôndolas.',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
    demoUserId: process.env.EXPO_PUBLIC_DEMO_USER_ID ?? null,
    eas: {
      projectId: '33f6c380-c6bc-4b89-ad85-f8f6c26fdbcc',
    },
  },
})
