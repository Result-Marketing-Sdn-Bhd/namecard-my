/**
 * In-App Purchase Service for WhatsCard
 *
 * Handles all IAP operations with mock mode support for testing
 *
 * MOCK MODE (MOCK_MODE = true):
 * - Simulates IAP without real purchases
 * - Perfect for testing in Expo Go
 * - Stores subscription in AsyncStorage
 * - Simulates loading delays
 *
 * PRODUCTION MODE (MOCK_MODE = false):
 * - Uses real expo-in-app-purchases
 * - Connects to Apple/Google stores
 * - Handles real transactions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  IAP_CONFIG,
  getProductIds,
  SubscriptionPlan,
  SubscriptionInfo,
  ProductInfo,
} from '../config/iap-config';
import { simulatePurchase } from '../utils/subscription-utils';

// Lazy load react-native-iap only when needed and not in mock mode
// NOTE: expo-in-app-purchases is DEPRECATED in Expo SDK 53
// Using react-native-iap instead (free, no RevenueCat fees!)
let RNIap: any = null;
if (!IAP_CONFIG.MOCK_MODE) {
  try {
    RNIap = require('react-native-iap');
  } catch (error) {
    console.warn('[IAP Service] ⚠️ react-native-iap not available, using mock mode');
    // Will fall back to mock mode
  }
}

const SUBSCRIPTION_STORAGE_KEY = '@whatscard_subscription';
const MOCK_PURCHASE_HISTORY_KEY = '@whatscard_mock_purchases';

/**
 * IAP Service Class
 */
class IAPService {
  private isInitialized = false;
  private products: ProductInfo[] = [];

  /**
   * Initialize IAP connection
   *
   * Call this when app starts or before first purchase
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[IAP Service] ✅ Already initialized');
      return;
    }

    console.log('[IAP Service] 🚀 Initializing...');

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      console.log('[IAP Service] 🎭 Running in MOCK MODE');
      // Simulate initialization delay
      await this.delay(500);
      this.isInitialized = true;
      console.log('[IAP Service] ✅ Mock initialization complete');
      return;
    }

    try {
      console.log('[IAP Service] 📱 Connecting to real IAP (react-native-iap)...');
      await RNIap.initConnection();
      this.isInitialized = true;
      console.log('[IAP Service] ✅ Real IAP connection established');
    } catch (error) {
      console.error('[IAP Service] ❌ Initialization error:', error);
      throw new Error('Failed to initialize In-App Purchases');
    }
  }

  /**
   * Disconnect from IAP
   *
   * Call this when app closes or when done with IAP
   */
  async disconnect(): Promise<void> {
    if (!IAP_CONFIG.MOCK_MODE && this.isInitialized && RNIap) {
      console.log('[IAP Service] 🔌 Disconnecting from IAP...');
      await RNIap.endConnection();
      this.isInitialized = false;
      console.log('[IAP Service] ✅ Disconnected');
    }
  }

  /**
   * Fetch available products
   *
   * @returns Array of product info
   */
  async fetchProducts(): Promise<ProductInfo[]> {
    console.log('[IAP Service] 📦 Fetching products...');

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      return this.fetchMockProducts();
    }

    try {
      const platform = Platform.OS as 'ios' | 'android';
      const productIds = getProductIds(platform);
      const productIdArray = [productIds.monthly, productIds.yearly];

      console.log('[IAP Service] 📱 Platform:', Platform.OS);
      console.log('[IAP Service] 🆔 Product IDs:', productIdArray);
      console.log('[IAP Service] 🔍 RNIap object:', Object.keys(RNIap || {}).join(', '));
      console.log('[IAP Service] 🔍 getSubscriptions type:', typeof RNIap?.getSubscriptions);
      console.log('[IAP Service] 🔍 Attempting to fetch subscriptions from store...');

      // react-native-iap API: getSubscriptions() for subscription products
      // v14 API takes array directly, not object with skus property
      console.log('[IAP Service] 🔍 Calling getSubscriptions with:', productIdArray);
      const results = await RNIap.getSubscriptions(productIdArray);
      console.log('[IAP Service] ✅ getSubscriptions returned successfully');

      console.log('[IAP Service] 📦 Raw results from store:', JSON.stringify(results, null, 2));

      if (!results || results.length === 0) {
        console.warn('[IAP Service] ⚠️ No products found, falling back to mock');
        return this.fetchMockProducts();
      }

      this.products = results.map((product: any) => ({
        productId: product.productId,
        type: product.productId.includes('monthly') ? 'monthly' : 'yearly',
        price: product.localizedPrice || '$0.00',
        priceAmount: parseFloat(product.price || '0'),
        currency: product.currency || 'USD',
        title: product.title || '',
        description: product.description || '',
      }));

      console.log('[IAP Service] ✅ Fetched', this.products.length, 'products');
      return this.products;
    } catch (error) {
      console.error('[IAP Service] ❌ Error fetching products:', error);
      console.log('[IAP Service] 🔄 Falling back to mock products');
      return this.fetchMockProducts();
    }
  }

  /**
   * Fetch mock products (for testing)
   *
   * @returns Mock product data
   */
  private async fetchMockProducts(): Promise<ProductInfo[]> {
    console.log('[IAP Service] 🎭 Fetching MOCK products...');

    // Simulate network delay
    await this.delay(IAP_CONFIG.MOCK_SETTINGS.fetchProductsDelay);

    // Simulate fetch error if enabled
    if (IAP_CONFIG.MOCK_SETTINGS.simulateFetchError) {
      throw new Error(IAP_CONFIG.MOCK_SETTINGS.errorMessages.fetch);
    }

    const mockProducts: ProductInfo[] = [
      {
        productId: IAP_CONFIG.MOCK_PRODUCTS.monthly,
        type: 'monthly',
        price: IAP_CONFIG.PRICING.monthly.displayPrice,
        priceAmount: IAP_CONFIG.PRICING.monthly.usd,
        currency: 'USD',
        title: 'WhatsCard Premium Monthly',
        description: IAP_CONFIG.PRICING.monthly.description,
      },
      {
        productId: IAP_CONFIG.MOCK_PRODUCTS.yearly,
        type: 'yearly',
        price: IAP_CONFIG.PRICING.yearly.displayPrice,
        priceAmount: IAP_CONFIG.PRICING.yearly.usd,
        currency: 'USD',
        title: 'WhatsCard Premium Yearly',
        description: IAP_CONFIG.PRICING.yearly.description,
      },
    ];

    this.products = mockProducts;
    console.log('[IAP Service] ✅ Mock products loaded:', this.products.length);
    return mockProducts;
  }

  /**
   * Purchase a subscription
   *
   * @param plan - Subscription plan to purchase
   * @param promoCode - Optional promo code
   * @returns Purchase result
   */
  async purchaseSubscription(
    plan: SubscriptionPlan,
    promoCode?: string
  ): Promise<{
    success: boolean;
    subscription?: SubscriptionInfo;
    error?: string;
  }> {
    console.log('[IAP Service] 💳 Purchasing subscription:', plan);
    if (promoCode) {
      console.log('[IAP Service] 🎟️ Promo code:', promoCode);
    }

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      return this.mockPurchase(plan, promoCode);
    }

    try {
      const productId = this.getProductIdForPlan(plan);

      if (!productId) {
        throw new Error(`Product not found for plan: ${plan}`);
      }

      console.log('[IAP Service] 🛒 Purchasing product ID:', productId);
      console.log('[IAP Service] 🔍 Platform:', Platform.OS);
      console.log('[IAP Service] 🎟️ Promo code:', promoCode || 'none');
      console.log('[IAP Service] 🔍 requestSubscription type:', typeof RNIap?.requestSubscription);

      // react-native-iap API: requestSubscription() for subscription purchase
      console.log('[IAP Service] 🔍 Calling requestSubscription with:', { sku: productId });
      const purchase = await RNIap.requestSubscription({
        sku: productId,
        ...(promoCode && Platform.OS === 'android' && {
          offerToken: promoCode, // Android promo offers
        }),
      });
      console.log('[IAP Service] ✅ requestSubscription returned successfully');

      console.log('[IAP Service] ✅ Purchase response:', JSON.stringify(purchase, null, 2));

      // Create subscription record
      const subscription = this.createSubscriptionFromPurchase(plan, promoCode);
      await this.saveSubscription(subscription);

      console.log('[IAP Service] ✅ Purchase flow completed');
      return {
        success: true,
        subscription,
      };
    } catch (error: any) {
      console.error('[IAP Service] ❌ Purchase error:', error);

      // Check if user canceled
      if (error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_CANCELED') {
        return {
          success: false,
          error: 'Purchase canceled',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Mock purchase (for testing)
   */
  private async mockPurchase(
    plan: SubscriptionPlan,
    promoCode?: string
  ): Promise<{
    success: boolean;
    subscription?: SubscriptionInfo;
    error?: string;
  }> {
    console.log('[IAP Service] 🎭 Simulating MOCK purchase...');

    // Simulate purchase delay
    await this.delay(IAP_CONFIG.MOCK_SETTINGS.purchaseDelay);

    // Simulate purchase error if enabled
    if (IAP_CONFIG.MOCK_SETTINGS.simulatePurchaseError) {
      console.log('[IAP Service] ❌ Simulated purchase error');
      return {
        success: false,
        error: IAP_CONFIG.MOCK_SETTINGS.errorMessages.purchase,
      };
    }

    // Create mock subscription
    const subscription = simulatePurchase(plan, promoCode);

    // Save to storage
    await this.saveSubscription(subscription);

    // Save to purchase history
    await this.saveMockPurchaseHistory(subscription);

    console.log('[IAP Service] ✅ Mock purchase successful');
    console.log('[IAP Service] 📅 Expires:', new Date(subscription.expiryDate).toLocaleString());

    return {
      success: true,
      subscription,
    };
  }

  /**
   * Restore previous purchases
   *
   * @returns Restore result
   */
  async restorePurchases(): Promise<{
    success: boolean;
    subscription?: SubscriptionInfo;
    error?: string;
  }> {
    console.log('[IAP Service] 🔄 Restoring purchases...');

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      return this.mockRestore();
    }

    try {
      // react-native-iap API: getAvailablePurchases() to restore
      const results = await RNIap.getAvailablePurchases();

      console.log('[IAP Service] 📜 Purchase history:', results.length, 'items');

      if (results.length === 0) {
        console.log('[IAP Service] ℹ️ No purchases found');
        return {
          success: false,
          error: 'No purchases found to restore',
        };
      }

      // Find most recent active subscription
      const latestPurchase = results[results.length - 1];
      const plan = latestPurchase.productId.includes('monthly') ? 'monthly' : 'yearly';

      const subscription = this.createSubscriptionFromPurchase(plan);
      await this.saveSubscription(subscription);

      // Finish transaction (required by react-native-iap)
      await RNIap.finishTransaction({ purchase: latestPurchase, isConsumable: false });

      console.log('[IAP Service] ✅ Purchases restored');
      return {
        success: true,
        subscription,
      };
    } catch (error: any) {
      console.error('[IAP Service] ❌ Restore error:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  /**
   * Mock restore (for testing)
   */
  private async mockRestore(): Promise<{
    success: boolean;
    subscription?: SubscriptionInfo;
    error?: string;
  }> {
    console.log('[IAP Service] 🎭 Simulating MOCK restore...');

    await this.delay(IAP_CONFIG.MOCK_SETTINGS.restoreDelay);

    if (IAP_CONFIG.MOCK_SETTINGS.simulateRestoreError) {
      console.log('[IAP Service] ❌ Simulated restore error');
      return {
        success: false,
        error: IAP_CONFIG.MOCK_SETTINGS.errorMessages.restore,
      };
    }

    // Try to get from purchase history
    const history = await this.getMockPurchaseHistory();

    if (!history || history.length === 0) {
      console.log('[IAP Service] ℹ️ No mock purchases to restore');
      return {
        success: false,
        error: 'No purchases found to restore',
      };
    }

    // Get most recent purchase
    const latestPurchase = history[history.length - 1];

    // Check if still valid
    if (latestPurchase.expiryDate < Date.now()) {
      console.log('[IAP Service] ⚠️ Found expired subscription');
      latestPurchase.status = 'expired';
    }

    await this.saveSubscription(latestPurchase);

    console.log('[IAP Service] ✅ Mock purchases restored');
    return {
      success: true,
      subscription: latestPurchase,
    };
  }

  /**
   * Get current subscription status
   *
   * @returns Current subscription or null
   */
  async getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);

      if (!stored) {
        console.log('[IAP Service] ℹ️ No subscription found');
        return null;
      }

      const subscription: SubscriptionInfo = JSON.parse(stored);

      // Check if expired
      if (subscription.expiryDate < Date.now()) {
        console.log('[IAP Service] ⚠️ Subscription expired');
        subscription.status = 'expired';
        await this.saveSubscription(subscription);
      }

      console.log('[IAP Service] 📊 Subscription status:', subscription.status);
      return subscription;
    } catch (error) {
      console.error('[IAP Service] ❌ Error getting subscription status:', error);
      return null;
    }
  }

  /**
   * Clear subscription (for testing/logout)
   */
  async clearSubscription(): Promise<void> {
    console.log('[IAP Service] 🗑️ Clearing subscription...');
    await AsyncStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    console.log('[IAP Service] ✅ Subscription cleared');
  }

  /**
   * Set mock subscription (for testing)
   */
  async setMockSubscription(plan: SubscriptionPlan): Promise<void> {
    if (!IAP_CONFIG.MOCK_MODE && RNIap) {
      console.warn('[IAP Service] ⚠️ Cannot set mock subscription when not in mock mode');
      return;
    }

    const subscription = simulatePurchase(plan);
    await this.saveSubscription(subscription);
    console.log('[IAP Service] 🎭 Mock subscription set:', plan);
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getProductIdForPlan(plan: SubscriptionPlan): string | null {
    const product = this.products.find((p) => p.type === plan);
    return product?.productId || null;
  }

  private createSubscriptionFromPurchase(
    plan: SubscriptionPlan,
    promoCode?: string
  ): SubscriptionInfo {
    const now = Date.now();
    const duration = IAP_CONFIG.DURATIONS[plan];

    return {
      plan,
      status: 'active',
      purchaseDate: now,
      expiryDate: now + duration,
      isPromo: !!promoCode,
      promoCode: promoCode || undefined,
    };
  }

  private async saveSubscription(subscription: SubscriptionInfo): Promise<void> {
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    console.log('[IAP Service] 💾 Subscription saved to storage');
  }

  private async saveMockPurchaseHistory(subscription: SubscriptionInfo): Promise<void> {
    try {
      const existing = await this.getMockPurchaseHistory();
      const updated = [...existing, subscription];
      await AsyncStorage.setItem(MOCK_PURCHASE_HISTORY_KEY, JSON.stringify(updated));
      console.log('[IAP Service] 📝 Added to mock purchase history');
    } catch (error) {
      console.error('[IAP Service] ❌ Error saving purchase history:', error);
    }
  }

  private async getMockPurchaseHistory(): Promise<SubscriptionInfo[]> {
    try {
      const stored = await AsyncStorage.getItem(MOCK_PURCHASE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[IAP Service] ❌ Error getting purchase history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const iapService = new IAPService();

console.log('[IAP Service] ✅ Service initialized');
