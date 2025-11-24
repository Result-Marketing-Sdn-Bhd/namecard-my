import 'dotenv/config';

export default {
  expo: {
    name: "WhatsCard",
    slug: "namecard-my",
    owner: "jacobai",
    version: "2.0.3",
    sdkVersion: "54.0.0",
    scheme: "whatscard",
    orientation: "portrait",
    icon: "./assets/splash-icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#4A7A5C"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.whatscard.app",
      icon: "./assets/splash-icon.png",
      infoPlist: {
        NSCameraUsageDescription: "This app needs access to camera to scan business cards.",
        NSPhotoLibraryUsageDescription: "This app needs access to photo library to save and select business card images.",
        NSMicrophoneUsageDescription: "This app needs access to microphone for voice notes.",
        NSContactsUsageDescription: "This app needs access to contacts to save scanned business cards.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to add location data to business cards."
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:whatscard.app"
      ],
      entitlements: {
        "com.apple.developer.in-app-purchase": true
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/splash-icon.png",
        backgroundColor: "#4A7A5C"
      },
      package: "com.whatscard.app",
      versionCode: 5, // Version code 5 for Google Play (Android 15/16 compatibility update)
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "READ_CONTACTS",
        "WRITE_CONTACTS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "whatscard.app",
              pathPrefix: "/"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/splash-icon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-asset",
      "expo-camera",
      "expo-media-library",
      "expo-av",
      "expo-audio",
      "expo-file-system",
      "expo-document-picker",
      "expo-font",
      "react-native-iap",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.1.20"
          },
          ios: {
            deploymentTarget: "15.1",
            useFrameworks: "static"
          }
        }
      ],
      [
        "react-native-edge-to-edge",
        {
          android: {
            enforceNavigationBarContrast: false
          }
        }
      ]
    ],
    description: "WhatsCard - Smart Business Card Scanner. Scan, save, and connect with anyone on WhatsApp instantly. Transform paper cards into digital connections with AI-powered OCR technology.",
    primaryColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    // EAS Update configuration
    updates: {
      url: "https://u.expo.dev/66d97936-e847-4b80-a6c7-bf90ea4a0d80"
    },
    // Runtime version policy (applies to both iOS and Android)
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      eas: {
        projectId: "66d97936-e847-4b80-a6c7-bf90ea4a0d80"
      },
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY || "",
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      APP_ENV: process.env.APP_ENV || "development",
      DEBUG_MODE: process.env.DEBUG_MODE || "true"
    }
  }
};