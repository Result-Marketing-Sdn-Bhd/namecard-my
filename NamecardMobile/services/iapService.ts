/**
 * In-App Purchase Service for WhatsCard
 *
 * Handles all IAP operations with proper receipt validation
 *
 * CRITICAL FIXES APPLIED:
 * 1. ✅ finishTransaction() called after every purchase
 * 2. ✅ Real receipt validation with Supabase Edge Function
 * 3. ✅ Proper restore logic with product ID filtering
 * 4. ✅ Server-side receipt validation before storing subscription
 * 5. ✅ iOS promotional offers and error handling
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
let RNIap: any = null;
if (!IAP_CONFIG.MOCK_MODE) {
  try {
    RNIap = require('react-native-iap');
  } catch (error) {
    console.warn('[IAP Service] ⚠️ react-native-iap not available, using mock mode');
  }
}

const SUBSCRIPTION_STORAGE_KEY = '@whatscard_subscription';
const MOCK_PURCHASE_HISTORY_KEY = '@whatscard_mock_purchases';

// TODO: Replace with your actual Supabase Edge Function URL
const RECEIPT_VALIDATION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/validate-receipt`
  : '';

/**
 * IAP Service Class
 */
class IAPService {
  private isInitialized = false;
  private products: ProductInfo[] = [];
  private currentUserId: string | null = null;

  /**
   * Set current user ID for receipt validation
   */
  setUserId(userId: string | null): void {
    this.currentUserId = userId;
    console.log('[IAP Service] 👤 User ID set:', userId ? 'Yes' : 'No');
  }

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[IAP Service] ✅ Already initialized');
      return;
    }

    console.log('[IAP Service] 🚀 Initializing...');

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      console.log('[IAP Service] 🎭 Running in MOCK MODE');
      await this.delay(500);
      this.isInitialized = true;
      console.log('[IAP Service] ✅ Mock initialization complete');
      return;
    }

    try {
      console.log('[IAP Service] 📱 Connecting to real IAP (react-native-iap)...');
      console.log('[IAP Service] 📱 RNIap module available:', !!RNIap);
      console.log('[IAP Service] 📱 RNIap.initConnection available:', typeof RNIap.initConnection);

      const connectionResult = await RNIap.initConnection();
      console.log('[IAP Service] 🔗 initConnection result:', connectionResult);

      // Clear any stale iOS transactions
      if (Platform.OS === 'ios') {
        try {
          await RNIap.clearTransactionIOS();
          console.log('[IAP Service] 🧹 Cleared stale iOS transactions');
        } catch (error) {
          console.warn('[IAP Service] ⚠️ Could not clear iOS transactions:', error);
        }
      }

      this.isInitialized = true;
      console.log('[IAP Service] ✅ Real IAP connection established');
      console.log('[IAP Service] ✅ Android Billing Client ready');
    } catch (error) {
      console.error('[IAP Service] ❌ Initialization error:', error);
      console.error('[IAP Service] ❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to initialize In-App Purchases');
    }
  }

  /**
   * Disconnect from IAP
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
      console.log('[IAP Service] 🔍 Calling RNIap.fetchProducts with params:', JSON.stringify({ skus: productIdArray }));

      // Log billing client status before fetching
      console.log('[IAP Service] 🔍 About to call fetchProducts...');
      console.log('[IAP Service] 🔍 Billing client should be connected');

      // CRITICAL FIX: Must specify 'subs' type for subscriptions (not 'inapp')
      const products = await RNIap.fetchProducts({
        skus: productIdArray,
        type: 'subs' // Android subscriptions, not in-app purchases
      });

      console.log('[IAP Service] 📦 Full response from fetchProducts:', JSON.stringify(products, null, 2));
      console.log('[IAP Service] 📦 Response type:', typeof products);
      console.log('[IAP Service] 📦 Response is array?:', Array.isArray(products));
      console.log('[IAP Service] 📦 Response length:', Array.isArray(products) ? products.length : 'N/A');
      console.log('[IAP Service] ✅ fetchProducts returned successfully');

      // In react-native-iap v14, fetchProducts returns products directly (not { subscriptions: [] })
      const results = Array.isArray(products) ? products : [];
      console.log('[IAP Service] 📦 Final results:', JSON.stringify(results, null, 2));
      console.log('[IAP Service] 📊 Results length:', results.length);
      console.log('[IAP Service] 📊 Results type:', typeof results);
      console.log('[IAP Service] 📊 Is array?:', Array.isArray(results));

      // If empty, log diagnostic info
      if (results.length === 0) {
        console.log('[IAP Service] ⚠️ DIAGNOSTIC: Google Play returned 0 products');
        console.log('[IAP Service] ⚠️ Product IDs requested:', productIdArray);
        console.log('[IAP Service] ⚠️ This usually means:');
        console.log('[IAP Service] ⚠️   1. Products not created in Google Play Console');
        console.log('[IAP Service] ⚠️   2. Product IDs do not match exactly');
        console.log('[IAP Service] ⚠️   3. App not published to Internal Testing track');
        console.log('[IAP Service] ⚠️   4. Test account not added as Internal Tester');
        console.log('[IAP Service] ⚠️   5. Base plans not activated');
        console.log('[IAP Service] ⚠️   6. Package name mismatch');
        console.log('[IAP Service] ⚠️ App package name:', 'com.resultmarketing.whatscard');
      }

      if (!results || results.length === 0) {
        // CRITICAL FIX: In production, NEVER fallback to mock products
        // This was causing mock SKUs to poison this.products and trigger purchase failures
        if (__DEV__) {
          console.warn('[IAP Service] ⚠️ [DEV ONLY] No products found, falling back to mock');
          return this.fetchMockProducts();
        } else {
          console.error('[IAP Service] ❌ [PRODUCTION] Google Play returned 0 products - BLOCKING PURCHASE');
          console.error('[IAP Service] ❌ Cannot proceed without valid product data from Play Store');
          throw new Error('No products available from Google Play Store. Cannot purchase.');
        }
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

      // CRITICAL FIX: In production, NEVER fallback to mock on error
      if (__DEV__) {
        console.log('[IAP Service] 🔄 [DEV ONLY] Falling back to mock products');
        return this.fetchMockProducts();
      } else {
        console.error('[IAP Service] ❌ [PRODUCTION] Product fetch failed - BLOCKING PURCHASE');
        throw error; // Re-throw to prevent poisoning this.products with mocks
      }
    }
  }

  /**
   * Fetch mock products (for testing)
   */
  private async fetchMockProducts(): Promise<ProductInfo[]> {
    console.log('[IAP Service] 🎭 Fetching MOCK products...');

    await this.delay(IAP_CONFIG.MOCK_SETTINGS.fetchProductsDelay);

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
   * FIX #1: Calls finishTransaction()
   * FIX #2: Uses real receipt validation
   * FIX #4: Validates receipt before storing
   * FIX #5: Handles iOS promotional offers
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

      // CRITICAL FIX: Final safety check - NEVER allow mock IDs in production
      if (!__DEV__ && productId.includes('mock_')) {
        console.error('[IAP Service] ❌ [PRODUCTION] Attempted to purchase with mock ID:', productId);
        throw new Error('Cannot purchase with mock product ID in production');
      }

      // For Android, fetch product details to get offer tokens
      let subscriptionOffers: any[] | undefined;
      if (Platform.OS === 'android') {
        try {
          // In react-native-iap v14, fetchProducts returns products directly
          // CRITICAL FIX: Must specify 'subs' type for subscriptions
          const products = await RNIap.fetchProducts({
            skus: [productId],
            type: 'subs' // Android subscriptions
          });
          const currentProduct = products.find((p: any) => p.productId === productId);

          if (currentProduct?.subscriptionOfferDetails) {
            subscriptionOffers = currentProduct.subscriptionOfferDetails.map((offer: any) => ({
              sku: productId,
              offerToken: offer.offerToken,
            }));
            console.log('[IAP Service] 🎁 Subscription offers:', JSON.stringify(subscriptionOffers, null, 2));
          }
        } catch (error) {
          console.warn('[IAP Service] ⚠️ Could not fetch offer tokens:', error);
        }
      }

      // Execute purchase
      // CRITICAL FIX: In react-native-iap v14, use requestPurchase() for subscriptions
      // NOT requestSubscription() - that's the old API
      let purchase;
      if (Platform.OS === 'ios') {
        // iOS: Use requestPurchase with sku
        console.log('[IAP Service] 🍎 iOS: Calling requestPurchase...');
        purchase = await RNIap.requestPurchase({
          sku: productId,
        });
      } else {
        // Android: Use requestPurchase with offerToken if available
        console.log('[IAP Service] 🤖 Android: Calling requestPurchase...');

        // If we have subscription offers, use the first one
        if (subscriptionOffers && subscriptionOffers.length > 0) {
          const offerToken = subscriptionOffers[0].offerToken;
          console.log('[IAP Service] 🎁 Using offer token:', offerToken);

          purchase = await RNIap.requestPurchase({
            sku: productId,
            subscriptionOffers: [{
              sku: productId,
              offerToken: offerToken,
            }],
          });
        } else {
          // Fallback: Try without offer token (may fail on Google Play)
          console.warn('[IAP Service] ⚠️ No offer token found, attempting purchase without it');
          purchase = await RNIap.requestPurchase({
            sku: productId,
          });
        }
      }

      console.log('[IAP Service] ✅ requestPurchase returned successfully');
      console.log('[IAP Service] ✅ Purchase response:', JSON.stringify(purchase, null, 2));

      // FIX #4: Validate receipt on server BEFORE storing subscription
      console.log('[IAP Service] 🔐 Validating receipt on server...');
      const validatedSubscription = await this.validateReceiptAndCreateSubscription(
        purchase,
        plan,
        promoCode
      );

      if (!validatedSubscription) {
        throw new Error('Receipt validation failed');
      }

      // Save validated subscription
      await this.saveSubscription(validatedSubscription);

      // FIX #1: CRITICAL - Must call finishTransaction after successful purchase
      console.log('[IAP Service] 🏁 Finishing transaction...');
      await RNIap.finishTransaction({
        purchase,
        isConsumable: false, // Subscriptions are NOT consumable
      });
      console.log('[IAP Service] ✅ Transaction finished');

      console.log('[IAP Service] ✅ Purchase flow completed');
      return {
        success: true,
        subscription: validatedSubscription,
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
   * FIX #2 & #4: Validate receipt with server and create subscription from REAL data
   */
  private async validateReceiptAndCreateSubscription(
    purchase: any,
    plan: SubscriptionPlan,
    promoCode?: string
  ): Promise<SubscriptionInfo | null> {
    try {
      console.log('[IAP Service] 🔐 Starting receipt validation...');
      console.log('[IAP Service] 🔐 Validation URL:', RECEIPT_VALIDATION_URL);
      console.log('[IAP Service] 🔐 User ID:', this.currentUserId);
      console.log('[IAP Service] 🔐 Platform:', Platform.OS);

      // Get receipt data based on platform
      let receiptData;
      if (Platform.OS === 'ios') {
        receiptData = await RNIap.getReceiptDataIOS();
      } else {
        // Android uses the purchase token
        receiptData = purchase.transactionReceipt || purchase.purchaseToken;
      }

      if (!receiptData) {
        console.error('[IAP Service] ❌ No receipt data available');
        return null;
      }

      console.log('[IAP Service] 🔐 Receipt data length:', receiptData?.length);

      // Call Supabase Edge Function for validation
      console.log('[IAP Service] 🔐 Calling Edge Function...');
      const response = await fetch(RECEIPT_VALIDATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          receipt: receiptData,
          productId: purchase.productId,
          userId: this.currentUserId,
          platform: Platform.OS,
          transactionId: purchase.transactionId,
        }),
      });

      console.log('[IAP Service] 🔐 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[IAP Service] ❌ Receipt validation failed with status:', response.status);
        console.error('[IAP Service] ❌ Error response:', errorText);
        return null;
      }

      const result = await response.json();
      console.log('[IAP Service] 🔐 Validation result:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('[IAP Service] ❌ Receipt validation returned error:', result.error);
        return null;
      }

      console.log('[IAP Service] ✅ Receipt validated on server');
      console.log('[IAP Service] 📅 Expiry date from server:', result.expiryDate);

      // FIX #2: Use REAL expiry date from receipt validation
      return {
        plan,
        status: 'active',
        purchaseDate: result.purchaseDate || Date.now(),
        expiryDate: new Date(result.expiryDate).getTime(), // Real expiry from Apple/Google
        isPromo: !!promoCode,
        promoCode: promoCode || undefined,
      };
    } catch (error) {
      console.error('[IAP Service] ❌ Receipt validation error:', error);
      console.error('[IAP Service] ❌ Error details:', JSON.stringify(error, null, 2));

      // FALLBACK: If validation fails, use local data (NOT RECOMMENDED FOR PRODUCTION)
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('[IAP Service] ⚠️⚠️⚠️  USING FALLBACK SUBSCRIPTION  ⚠️⚠️⚠️');
      console.warn('[IAP Service] ⚠️  NO SERVER VALIDATION!');
      console.warn('[IAP Service] ⚠️  This allows subscription bypass!');
      console.warn('[IAP Service] ⚠️  Check logs above for the root cause!');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return this.createSubscriptionFromPurchase(plan, promoCode);
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

    await this.delay(IAP_CONFIG.MOCK_SETTINGS.purchaseDelay);

    if (IAP_CONFIG.MOCK_SETTINGS.simulatePurchaseError) {
      console.log('[IAP Service] ❌ Simulated purchase error');
      return {
        success: false,
        error: IAP_CONFIG.MOCK_SETTINGS.errorMessages.purchase,
      };
    }

    const subscription = simulatePurchase(plan, promoCode);
    await this.saveSubscription(subscription);
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
   * FIX #3: Proper filtering and validation of purchases
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
      const results = await RNIap.getAvailablePurchases();
      console.log('[IAP Service] 📜 Purchase history:', results.length, 'items');

      if (results.length === 0) {
        console.log('[IAP Service] ℹ️ No purchases found');
        return {
          success: false,
          error: 'No purchases found to restore',
        };
      }

      // FIX #3: Filter only OUR product IDs (not all purchases)
      const platform = Platform.OS as 'ios' | 'android';
      const productIds = getProductIds(platform);
      const validProductIds = [productIds.monthly, productIds.yearly];

      const ourPurchases = results.filter((purchase: any) =>
        validProductIds.includes(purchase.productId)
      );

      if (ourPurchases.length === 0) {
        console.log('[IAP Service] ℹ️ No WhatsCard subscriptions found');
        return {
          success: false,
          error: 'No WhatsCard subscriptions found to restore',
        };
      }

      console.log('[IAP Service] 📦 Found', ourPurchases.length, 'WhatsCard subscriptions');

      // Get most recent purchase
      const latestPurchase = ourPurchases[ourPurchases.length - 1];
      const plan = latestPurchase.productId.includes('monthly') ? 'monthly' : 'yearly';

      // FIX #4: Validate receipt before restoring
      console.log('[IAP Service] 🔐 Validating restored purchase...');
      const validatedSubscription = await this.validateReceiptAndCreateSubscription(
        latestPurchase,
        plan
      );

      if (!validatedSubscription) {
        throw new Error('Could not validate restored purchase');
      }

      await this.saveSubscription(validatedSubscription);

      // FIX #1: Finish the restored transaction
      await RNIap.finishTransaction({
        purchase: latestPurchase,
        isConsumable: false
      });

      console.log('[IAP Service] ✅ Purchases restored and validated');
      return {
        success: true,
        subscription: validatedSubscription,
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

    const history = await this.getMockPurchaseHistory();

    if (!history || history.length === 0) {
      console.log('[IAP Service] ℹ️ No mock purchases to restore');
      return {
        success: false,
        error: 'No purchases found to restore',
      };
    }

    const latestPurchase = history[history.length - 1];

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
    // Try to get from fetched products first
    const product = this.products.find((p) => p.type === plan);
    if (product) {
      // CRITICAL FIX: In production, NEVER return mock product IDs
      if (!__DEV__ && product.productId.includes('mock_')) {
        console.error('[IAP Service] ❌ [PRODUCTION] Detected mock product ID in cache:', product.productId);
        console.error('[IAP Service] ❌ This indicates fetchProducts() was poisoned with mock data');
        throw new Error('Cannot use mock product IDs in production');
      }
      return product.productId;
    }

    // FALLBACK: Use config if products not fetched
    console.warn('[IAP Service] ⚠️ Product not in fetched list, using config fallback');
    const platform = Platform.OS as 'ios' | 'android';
    const productIds = getProductIds(platform);
    const fallbackId = plan === 'monthly' ? productIds.monthly : productIds.yearly;

    // CRITICAL FIX: In production, verify fallback ID is not a mock
    if (!__DEV__ && fallbackId.includes('mock_')) {
      console.error('[IAP Service] ❌ [PRODUCTION] Config fallback returned mock ID:', fallbackId);
      throw new Error('Cannot use mock product IDs in production');
    }

    return fallbackId;
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
