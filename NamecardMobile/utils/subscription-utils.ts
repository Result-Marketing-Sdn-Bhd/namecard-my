/**
 * Subscription Utility Functions for WhatsCard
 *
 * Helper functions for:
 * - Price formatting
 * - Savings calculations
 * - Promo code validation
 * - Subscription status checks
 */

import { IAP_CONFIG, SubscriptionPlan, SubscriptionInfo } from '../config/iap-config';

/**
 * Format price for display
 *
 * @param amount - Price amount (e.g., 9.75)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted price string (e.g., "$9.75")
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  // For other currencies, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error('[Subscription Utils] Error formatting price:', error);
    return `${amount.toFixed(2)} ${currency}`;
  }
};

/**
 * Calculate monthly equivalent price
 *
 * @param yearlyPrice - Annual price
 * @returns Monthly equivalent
 */
export const calculateMonthlyEquivalent = (yearlyPrice: number): number => {
  return yearlyPrice / 12;
};

/**
 * Calculate savings percentage
 *
 * @param monthlyPrice - Monthly subscription price
 * @param yearlyPrice - Yearly subscription price
 * @returns Savings percentage (e.g., 20 for 20%)
 */
export const calculateSavings = (monthlyPrice: number = 9.95, yearlyPrice: number = 117.99): number => {
  const yearlyMonthlyEquivalent = calculateMonthlyEquivalent(yearlyPrice);
  const savings = ((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100;
  return Math.round(savings);
};

/**
 * Calculate actual savings amount
 *
 * @param monthlyPrice - Monthly subscription price
 * @param yearlyPrice - Yearly subscription price
 * @returns Dollar amount saved per year
 */
export const calculateSavingsAmount = (monthlyPrice: number, yearlyPrice: number): number => {
  const yearlyAtMonthlyRate = monthlyPrice * 12;
  return yearlyAtMonthlyRate - yearlyPrice;
};

/**
 * Apply promo code to price
 *
 * @param originalPrice - Original price
 * @param promoCode - Promo code to apply
 * @param plan - Subscription plan
 * @returns Object with discounted price and discount amount
 */
export const applyPromoCode = (
  originalPrice: number,
  promoCode: string,
  plan: SubscriptionPlan
): {
  discountedPrice: number;
  discountAmount: number;
  isValid: boolean;
  message: string;
} => {
  const code = promoCode.toUpperCase();

  // Check if promo code exists
  const promo = IAP_CONFIG.PROMO_CODES[code as keyof typeof IAP_CONFIG.PROMO_CODES];

  if (!promo) {
    return {
      discountedPrice: originalPrice,
      discountAmount: 0,
      isValid: false,
      message: 'Invalid promo code',
    };
  }

  // Check if promo applies to this plan
  if (promo.applicableTo !== plan) {
    return {
      discountedPrice: originalPrice,
      discountAmount: 0,
      isValid: false,
      message: `Promo code only valid for ${promo.applicableTo} plan`,
    };
  }

  // Calculate discount
  const discountAmount = originalPrice * promo.discount;
  const discountedPrice = originalPrice - discountAmount;

  return {
    discountedPrice,
    discountAmount,
    isValid: true,
    message: `${promo.discount * 100}% discount applied!`,
  };
};

/**
 * Validate promo code
 *
 * @param code - Promo code to validate
 * @param plan - Subscription plan
 * @returns Validation result
 */
export const validatePromoCode = (
  code: string,
  plan: SubscriptionPlan
): {
  isValid: boolean;
  message: string;
  discount?: number;
} => {
  if (!code || code.trim() === '') {
    return {
      isValid: false,
      message: 'Please enter a promo code',
    };
  }

  const upperCode = code.toUpperCase();
  const promo = IAP_CONFIG.PROMO_CODES[upperCode as keyof typeof IAP_CONFIG.PROMO_CODES];

  if (!promo) {
    return {
      isValid: false,
      message: 'Invalid promo code',
    };
  }

  if (promo.applicableTo !== plan) {
    return {
      isValid: false,
      message: `This code is only valid for ${promo.applicableTo} subscriptions`,
    };
  }

  return {
    isValid: true,
    message: `${promo.description}`,
    discount: promo.discount,
  };
};

/**
 * Check if subscription is active
 *
 * @param subscription - Subscription info
 * @returns Whether subscription is active
 */
export const isSubscriptionActive = (subscription: SubscriptionInfo | null): boolean => {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;

  // Check if subscription hasn't expired
  const now = Date.now();
  return subscription.expiryDate > now;
};

/**
 * Check if subscription is expiring soon
 *
 * @param subscription - Subscription info
 * @param daysThreshold - Days before expiry to consider "expiring soon" (default: 7)
 * @returns Whether subscription is expiring soon
 */
export const isSubscriptionExpiringSoon = (
  subscription: SubscriptionInfo | null,
  daysThreshold: number = 7
): boolean => {
  if (!subscription) return false;
  if (!isSubscriptionActive(subscription)) return false;

  const now = Date.now();
  const daysUntilExpiry = (subscription.expiryDate - now) / (1000 * 60 * 60 * 24);

  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
};

/**
 * Get days until expiry
 *
 * @param subscription - Subscription info
 * @returns Number of days until expiry
 */
export const getDaysUntilExpiry = (subscription: SubscriptionInfo | null): number => {
  if (!subscription) return 0;

  const now = Date.now();
  const daysUntilExpiry = Math.ceil((subscription.expiryDate - now) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysUntilExpiry);
};

/**
 * Format expiry date
 *
 * @param timestamp - Expiry timestamp
 * @returns Formatted date string
 */
export const formatExpiryDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get subscription renewal message
 *
 * @param subscription - Subscription info
 * @returns Renewal message for user
 */
export const getSubscriptionRenewalMessage = (subscription: SubscriptionInfo | null): string => {
  if (!subscription) return '';

  if (!isSubscriptionActive(subscription)) {
    return 'Your subscription has expired';
  }

  const daysUntilExpiry = getDaysUntilExpiry(subscription);

  if (daysUntilExpiry === 0) {
    return 'Your subscription expires today';
  } else if (daysUntilExpiry === 1) {
    return 'Your subscription expires tomorrow';
  } else if (daysUntilExpiry <= 7) {
    return `Your subscription expires in ${daysUntilExpiry} days`;
  } else {
    return `Renews on ${formatExpiryDate(subscription.expiryDate)}`;
  }
};

/**
 * Get plan display name
 *
 * @param plan - Subscription plan
 * @returns Display name
 */
export const getPlanDisplayName = (plan: SubscriptionPlan): string => {
  return plan === 'monthly' ? 'Monthly' : 'Yearly';
};

/**
 * Get plan duration text
 *
 * @param plan - Subscription plan
 * @returns Duration text (e.g., "per month")
 */
export const getPlanDurationText = (plan: SubscriptionPlan): string => {
  return plan === 'monthly' ? 'per month' : 'per year';
};

/**
 * Calculate value proposition
 *
 * For yearly: Show monthly equivalent + savings
 *
 * @param plan - Subscription plan
 * @param price - Plan price
 * @returns Value proposition string
 */
export const getValueProposition = (plan: SubscriptionPlan, price: number): string => {
  if (plan === 'monthly') {
    return formatPrice(price) + ' per month';
  }

  // Yearly
  const monthlyEquivalent = calculateMonthlyEquivalent(price);
  const savings = calculateSavings(IAP_CONFIG.PRICING.monthly.usd, price);

  return `${formatPrice(monthlyEquivalent)}/month · Save ${savings}%`;
};

/**
 * Get best value badge text
 *
 * @param plan - Subscription plan
 * @returns Badge text or null
 */
export const getBestValueBadge = (plan: SubscriptionPlan): string | null => {
  if (plan === 'yearly') {
    return IAP_CONFIG.PRICING.yearly.badge || 'BEST VALUE';
  }
  return null;
};

/**
 * Mock purchase simulation
 *
 * Simulates a successful purchase for testing
 *
 * @param plan - Subscription plan
 * @returns Simulated subscription info
 */
export const simulatePurchase = (
  plan: SubscriptionPlan
): SubscriptionInfo => {
  const now = Date.now();
  const duration = IAP_CONFIG.DURATIONS[plan];

  return {
    plan,
    status: 'active',
    purchaseDate: now,
    expiryDate: now + duration,
    isPromo: false,
  };
};

/**
 * Get promo discount percentage
 *
 * @param code - Promo code
 * @param plan - Subscription plan
 * @returns Discount percentage (0-1)
 */
export const getPromoDiscount = (code: string, plan: SubscriptionPlan): number => {
  const promo = IAP_CONFIG.PROMO_CODES[code.toUpperCase() as keyof typeof IAP_CONFIG.PROMO_CODES];
  if (!promo || promo.applicableTo !== plan) return 0;
  return promo.discount;
};

/**
 * Calculate price after promo code discount
 *
 * @param originalPrice - Original price
 * @param code - Promo code
 * @param plan - Subscription plan
 * @returns Discounted price
 */
export const calculatePromoPrice = (originalPrice: number, code: string, plan: SubscriptionPlan): number => {
  const result = applyPromoCode(originalPrice, code, plan);
  return result.discountedPrice;
};

console.log('[Subscription Utils] ✅ Utility functions loaded');
