import Constants from 'expo-constants';

type Environment = 'development' | 'staging' | 'production';

interface Config {
  // App Settings
  APP_ENV: Environment;
  DEBUG_MODE: boolean;

  // API Endpoints
  API_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // Third-party Services
  GOOGLE_VISION_API_KEY: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;

  // Analytics & Monitoring
  ANALYTICS_ENABLED: boolean;
  ERROR_REPORTING_ENABLED: boolean;
  SENTRY_DSN?: string;
  MIXPANEL_TOKEN?: string;

  // In-App Purchases
  REVENUECAT_API_KEY?: string;

  // Feature Flags
  USE_MOCK_OCR: boolean;
  USE_MOCK_AUTH: boolean;
}

// Get environment variables from Expo Constants
const getEnvVars = (): Config => {
  const extra = Constants.expoConfig?.extra || {};

  // Determine environment
  const environment = (extra.APP_ENV as Environment) || 'development';

  // Base configuration
  const baseConfig: Config = {
    APP_ENV: environment,
    DEBUG_MODE: extra.DEBUG_MODE === 'true' || environment === 'development',

    // API Configuration
    API_BASE_URL: extra.API_BASE_URL || '',
    SUPABASE_URL: extra.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: extra.SUPABASE_ANON_KEY || '',

    // Services
    GOOGLE_VISION_API_KEY: extra.GOOGLE_VISION_API_KEY || '',
    GEMINI_API_KEY: extra.GEMINI_API_KEY || '',
    OPENAI_API_KEY: extra.OPENAI_API_KEY || '',

    // Analytics
    ANALYTICS_ENABLED: extra.ANALYTICS_ENABLED === 'true',
    ERROR_REPORTING_ENABLED: extra.ERROR_REPORTING_ENABLED === 'true',
    SENTRY_DSN: extra.SENTRY_DSN,
    MIXPANEL_TOKEN: extra.MIXPANEL_TOKEN,

    // IAP
    REVENUECAT_API_KEY: extra.REVENUECAT_API_KEY,

    // Feature Flags
    USE_MOCK_OCR: extra.USE_MOCK_OCR === 'true',
    USE_MOCK_AUTH: extra.USE_MOCK_AUTH === 'true',
  };

  // Environment-specific overrides
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        DEBUG_MODE: false,
        ANALYTICS_ENABLED: true,
        ERROR_REPORTING_ENABLED: true,
        USE_MOCK_OCR: false,
        USE_MOCK_AUTH: false,
      };

    case 'staging':
      return {
        ...baseConfig,
        DEBUG_MODE: false,
        ANALYTICS_ENABLED: true,
        ERROR_REPORTING_ENABLED: true,
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        DEBUG_MODE: true,
        ANALYTICS_ENABLED: false,
        ERROR_REPORTING_ENABLED: false,
      };
  }
};

// Export configuration
export const Config = getEnvVars();

// Helper functions
export const isDevelopment = () => Config.APP_ENV === 'development';
export const isStaging = () => Config.APP_ENV === 'staging';
export const isProduction = () => Config.APP_ENV === 'production';
export const isDebugMode = () => Config.DEBUG_MODE;

// Validate required configurations
export const validateConfig = (): { isValid: boolean; missingKeys: string[] } => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !Config[key as keyof Config]);

  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);

    // In development, continue with warnings
    if (isDevelopment()) {
      console.warn('Continuing in development mode with missing configurations');
    } else {
      // In production/staging, throw error
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  return {
    isValid: missing.length === 0,
    missingKeys: missing
  };
};

// Debug logging
if (isDebugMode()) {
  console.log('Environment Configuration:', {
    APP_ENV: Config.APP_ENV,
    DEBUG_MODE: Config.DEBUG_MODE,
    API_BASE_URL: Config.API_BASE_URL,
    SUPABASE_URL: Config.SUPABASE_URL ? '✓ Configured' : '✗ Missing',
    GEMINI_API_KEY: Config.GEMINI_API_KEY ? `✓ Configured (${Config.GEMINI_API_KEY.substring(0, 10)}...)` : '✗ Missing',
    GOOGLE_VISION_API_KEY: Config.GOOGLE_VISION_API_KEY ? '✓ Configured' : '✗ Missing',
    OPENAI_API_KEY: Config.OPENAI_API_KEY ? '✓ Configured' : '✗ Missing',
    ANALYTICS_ENABLED: Config.ANALYTICS_ENABLED,
  });
}

export default Config;