/**
 * In-App Purchase Configuration for WhatsCard
 *
 * MOCK MODE:
 * - Set MOCK_MODE to true for testing in Expo Go and development
 * - Mock mode simulates IAP without real purchases
 * - Perfect for UI/UX testing and flow validation
 *
 * PRODUCTION MODE:
 * - Set MOCK_MODE to false when ready for production
 * - Update PRODUCTS.ios and PRODUCTS.android with real product IDs
 * - Real product IDs come from App Store Connect and Google Play Console
 */

export const IAP_CONFIG = {
  /**
   * MOCK MODE TOGGLE
   *
   * true  = Use mock data (perfect for Expo Go testing)
   * false = Use real IAP (requires production build)
   */
  MOCK_MODE: false,

  /**
   * MOCK PRODUCT IDs
   * Used when MOCK_MODE is true
   * These simulate real product IDs for testing
   */
  MOCK_PRODUCTS: {
    monthly: 'mock_whatscard_monthly_premium',
    yearly: 'mock_whatscard_yearly_premium',
  },

  /**
   * REAL PRODUCT IDs
   *
   * iOS App Store Connect:
   * - App ID: 6754809694
   * - Bundle ID: com.alittlebetter.better
   * - Subscription Group: Premium Access (21821977)
   *
   * Android Google Play Console:
   * - Package Name: com.resultmarketing.whatscard
   * - Developer Account: Drinking Monster (6055773806895794556)
   * - Service Fee: 15%
   */
  PRODUCTS: {
    ios: {
      monthly: 'whatscard_premium_monthly',  // NEW: Unique monthly subscription
      yearly: 'whatscard_premium_yearly',    // NEW: Unique yearly subscription
    },
    android: {
      monthly: 'whatscard_premium_monthly',  // Product ID from Google Play
      yearly: 'whatscard_premium_yearly',    // Product ID from Google Play
    },
  },

  /**
   * PROMO CODES
   *
   * Define promotional codes and their discounts
   * discount: 0.70 = 70% off
   * applicableTo: which plan the promo applies to
   */
  PROMO_CODES: {
    WHATSBNI: {
      code: 'WHATSBNI',
      discount: 0.70, // 70% off
      applicableTo: 'yearly' as 'monthly' | 'yearly',
      description: '70% off yearly subscription',
    },
  },

  /**
   * PRICING STRUCTURE
   *
   * Unified Pricing (Both iOS & Android):
   * - Monthly: $9.99 USD per month
   * - Yearly: $117.99 USD per year
   * - Yearly with WHATSBNI promo: $35.40 USD per year (70% off)
   *
   * Note: Both platforms use the same pricing for consistency.
   * Actual prices will be fetched from app stores.
   */
  PRICING: {
    monthly: {
      usd: 9.99,
      displayPrice: '$9.99',
      period: 'month',
      description: 'Perfect for trying out',
    },
    yearly: {
      usd: 117.99,
      displayPrice: '$117.99',
      period: 'year',
      description: 'Best value - Save 18%',
      savings: 18, // percentage ($9.99/month x 12 = $119.88, yearly = $117.99)
      badge: 'BEST VALUE',
    },
    yearlyWithPromo: {
      usd: 35.40,  // 70% off $117.99
      displayPrice: '$35.40',
      period: 'year',
      description: 'Special offer - 70% off',
    },
  },

  /**
   * SUBSCRIPTION FEATURES
   *
   * Features included in premium subscription
   * Used for displaying benefits to users
   */
  FEATURES: [
    {
      id: 'unlimited_scans',
      icon: 'camera',
      title: 'Unlimited Card Scans',
      description: 'Scan as many business cards as you need',
    },
    {
      id: 'ai_ocr',
      icon: 'flash',
      title: 'AI-Powered OCR',
      description: 'Advanced text recognition with 99% accuracy',
    },
    {
      id: 'whatsapp_integration',
      icon: 'logo-whatsapp',
      title: 'WhatsApp Quick Connect',
      description: 'Instantly message contacts via WhatsApp',
    },
    {
      id: 'voice_notes',
      icon: 'mic',
      title: 'Voice Notes & Reminders',
      description: 'Add voice memos to your contacts',
    },
    {
      id: 'export',
      icon: 'download',
      title: 'Export to Excel',
      description: 'Export your contacts to Excel or CSV',
    },
    {
      id: 'cloud_sync',
      icon: 'cloud',
      title: 'Cloud Sync',
      description: 'Access your contacts from any device',
    },
    {
      id: 'premium_support',
      icon: 'headset',
      title: 'Priority Support',
      description: '24/7 email support with fast response',
    },
    {
      id: 'no_ads',
      icon: 'remove-circle',
      title: 'Ad-Free Experience',
      description: 'No advertisements, ever',
    },
  ],

  /**
   * FREE TIER LIMITS
   *
   * Limits for free users (to encourage upgrades)
   */
  FREE_TIER: {
    maxScans: 10,
    maxContacts: 50,
    features: ['basic_scan', 'manual_entry', 'basic_export'],
  },

  /**
   * SUBSCRIPTION DURATIONS
   *
   * For simulating subscription expiry in mock mode
   */
  DURATIONS: {
    monthly: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    yearly: 365 * 24 * 60 * 60 * 1000,  // 365 days in milliseconds
  },

  /**
   * MOCK BEHAVIOR SETTINGS
   *
   * Customize mock behavior for testing different scenarios
   */
  MOCK_SETTINGS: {
    // Simulate loading delay (in ms)
    fetchProductsDelay: 2000,
    purchaseDelay: 1500,
    restoreDelay: 1000,

    // Simulate errors (for testing error handling)
    simulateFetchError: false,
    simulatePurchaseError: false,
    simulateRestoreError: false,

    // Error messages for testing
    errorMessages: {
      fetch: 'Failed to fetch products. Please check your connection.',
      purchase: 'Purchase failed. Please try again.',
      restore: 'No purchases found to restore.',
      network: 'Network error. Please check your internet connection.',
      canceled: 'Purchase canceled by user.',
    },
  },
} as const;

/**
 * TYPE DEFINITIONS
 */
export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'pending';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiryDate: number; // timestamp
  purchaseDate: number; // timestamp
  isPromo: boolean;
  promoCode?: string;
}

export interface ProductInfo {
  productId: string;
  type: SubscriptionPlan;
  price: string;
  priceAmount: number;
  currency: string;
  title: string;
  description: string;
}

/**
 * HELPER FUNCTION
 * Get product IDs based on platform and mock mode
 */
export const getProductIds = (platform: 'ios' | 'android' = 'ios'): {
  monthly: string;
  yearly: string;
} => {
  if (IAP_CONFIG.MOCK_MODE) {
    console.log('[IAP Config] 🎭 Using MOCK product IDs');
    return IAP_CONFIG.MOCK_PRODUCTS;
  }

  console.log(`[IAP Config] 📱 Using REAL ${platform.toUpperCase()} product IDs`);
  return IAP_CONFIG.PRODUCTS[platform];
};

/**
 * VALIDATION HELPERS
 */
export const isValidPromoCode = (code: string): boolean => {
  return code.toUpperCase() in IAP_CONFIG.PROMO_CODES;
};

export const getPromoDiscount = (code: string, plan: SubscriptionPlan): number => {
  const promo = IAP_CONFIG.PROMO_CODES[code.toUpperCase() as keyof typeof IAP_CONFIG.PROMO_CODES];
  if (!promo) return 0;
  if (promo.applicableTo !== plan) return 0;
  return promo.discount;
};

export const calculatePromoPrice = (originalPrice: number, code: string, plan: SubscriptionPlan): number => {
  const discount = getPromoDiscount(code, plan);
  return originalPrice * (1 - discount);
};

console.log('[IAP Config] ⚙️ Configuration loaded');
console.log(`[IAP Config] Mock Mode: ${IAP_CONFIG.MOCK_MODE ? '✅ ENABLED' : '❌ DISABLED'}`);
