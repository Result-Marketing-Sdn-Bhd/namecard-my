import 'dotenv/config';

// Import the static app.json to merge values
const appJson = require('./app.json');

export default {
  ...appJson,
  expo: {
    ...appJson.expo,
    // EAS Update configuration
    updates: {
      url: "https://u.expo.dev/66d97936-e847-4b80-a6c7-bf90ea4a0d80"
    },
    // Runtime version policy (applies to both iOS and Android)
    runtimeVersion: {
      policy: "appVersion"
    },
    // Plugins configuration
    plugins: [
      ...(appJson.expo.plugins || [])
      // react-native-iap v12.x works without explicit plugin configuration
    ],
    // Android-specific configuration
    android: {
      ...appJson.expo.android,
    },
    // iOS-specific configuration
    ios: {
      ...appJson.expo.ios,
    },
    // Override with environment-specific values
    extra: {
      ...appJson.expo.extra,
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