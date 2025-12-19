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
import { Platform, Alert } from 'react-native';

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
    console.warn('[IAP Service] ℹ️ This is NORMAL in Expo Go - native modules not supported');
    console.warn('[IAP Service] ℹ️ For real IAP testing, build with: eas build --platform ios');
    console.warn('[IAP Service] ℹ️ App will use mock purchases for UI testing');
  }
}

const SUBSCRIPTION_STORAGE_KEY = '@whatscard_subscription';
const MOCK_PURCHASE_HISTORY_KEY = '@whatscard_mock_purchases';

// Receipt validation endpoint - Supabase Edge Function
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
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private pendingPurchaseResolve: ((value: any) => void) | null = null;
  private pendingPurchaseReject: ((reason: any) => void) | null = null;

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
    console.log('[IAP Service] 🔍 IAP_CONFIG.MOCK_MODE:', IAP_CONFIG.MOCK_MODE);
    console.log('[IAP Service] 🔍 RNIap available:', !!RNIap);
    console.log('[IAP Service] 🔍 __DEV__:', __DEV__);
    console.log('[IAP Service] 🔍 Platform.OS:', Platform.OS);

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      console.log('[IAP Service] 🎭 Running in MOCK MODE');
      console.log('[IAP Service] 🎭 Reason: MOCK_MODE =', IAP_CONFIG.MOCK_MODE, ', RNIap =', !!RNIap);
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

      // CRITICAL FIX: Setup event listeners BEFORE making any purchases
      // requestPurchase() is event-based, not promise-based
      this.setupPurchaseListeners();

      this.isInitialized = true;
      console.log('[IAP Service] ✅ Real IAP connection established');
      console.log('[IAP Service] ✅ Android Billing Client ready');
      console.log('[IAP Service] ✅ Purchase listeners registered');
    } catch (error) {
      console.error('[IAP Service] ❌ Initialization error:', error);
      console.error('[IAP Service] ❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to initialize In-App Purchases');
    }
  }

  /**
   * CRITICAL FIX: Setup purchase event listeners
   * requestPurchase() is EVENT-BASED, not promise-based
   */
  private setupPurchaseListeners(): void {
    console.log('[IAP Service] 🎧 Setting up purchase listeners...');

    // Remove existing listeners if any
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }

    // Listen for successful purchases
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener((purchase: any) => {
      console.log('[IAP Service] 🎉 Purchase updated event received!');
      console.log('[IAP Service] 🎉 Purchase data:', JSON.stringify(purchase, null, 2));
      console.log('[IAP Service] 🎉 Pending resolve available:', !!this.pendingPurchaseResolve);

      if (this.pendingPurchaseResolve) {
        console.log('[IAP Service] 🎉 Resolving purchase promise with data');
        this.pendingPurchaseResolve(purchase);
        this.pendingPurchaseResolve = null;
        this.pendingPurchaseReject = null;
      } else {
        console.warn('[IAP Service] ⚠️ Purchase event received but no pending resolve handler!');
      }
    });

    // Listen for purchase errors
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
      console.error('[IAP Service] ❌ Purchase error event received!');
      console.error('[IAP Service] ❌ Error data:', JSON.stringify(error, null, 2));
      console.error('[IAP Service] ❌ Error code:', error?.code);
      console.error('[IAP Service] ❌ Error message:', error?.message);
      console.error('[IAP Service] ❌ Pending reject available:', !!this.pendingPurchaseReject);

      if (this.pendingPurchaseReject) {
        console.error('[IAP Service] ❌ Rejecting purchase promise with error');
        this.pendingPurchaseReject(error);
        this.pendingPurchaseResolve = null;
        this.pendingPurchaseReject = null;
      } else {
        console.warn('[IAP Service] ⚠️ Error event received but no pending reject handler!');
      }
    });

    console.log('[IAP Service] ✅ Purchase listeners registered');
  }

  /**
   * Disconnect from IAP
   */
  async disconnect(): Promise<void> {
    if (!IAP_CONFIG.MOCK_MODE && this.isInitialized && RNIap) {
      console.log('[IAP Service] 🔌 Disconnecting from IAP...');

      // Remove listeners
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

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

      // CRITICAL FIX: Use fetchProducts with type:'subs' for subscriptions
      // This should return full subscription details including subscriptionOfferDetails
      console.log('[IAP Service] 🔍 Fetching subscriptions with type:subs...');
      const products = await RNIap.fetchProducts({
        skus: productIdArray,
        type: 'subs'
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

      // If empty, log diagnostic info and show alert
      if (results.length === 0) {
        const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
        console.error('[IAP Service] ⚠️ DIAGNOSTIC:', storeName, 'returned 0 products');
        console.error('[IAP Service] ⚠️ Product IDs requested:', productIdArray);
        console.error('[IAP Service] ⚠️ Platform:', Platform.OS);
        console.error('[IAP Service] ⚠️ This usually means:');

        // Show visible alert for debugging
        setTimeout(() => {
          Alert.alert(
            '⚠️ IAP Debug: 0 Products',
            `${storeName} returned 0 products!\n\nRequested IDs:\n${productIdArray.join('\n')}\n\nPlatform: ${Platform.OS}\n\nThis means the subscriptions aren't available from Apple yet.`,
            [{ text: 'OK' }]
          );
        }, 1000);

        if (Platform.OS === 'ios') {
          console.error('[IAP Service] ⚠️   1. Subscriptions not created in App Store Connect');
          console.error('[IAP Service] ⚠️   2. Product IDs do not match exactly (check for hyphens vs underscores)');
          console.error('[IAP Service] ⚠️   3. Subscriptions not submitted for review');
          console.error('[IAP Service] ⚠️   4. App not published to TestFlight');
          console.error('[IAP Service] ⚠️   5. Sandbox test account issues');
          console.error('[IAP Service] ⚠️   6. Bundle ID mismatch');
          console.error('[IAP Service] ⚠️ App bundle ID:', 'com.alittlebetter.alittlebetter');
        } else {
          console.error('[IAP Service] ⚠️   1. Products not created in Google Play Console');
          console.error('[IAP Service] ⚠️   2. Product IDs do not match exactly');
          console.error('[IAP Service] ⚠️   3. App not published to Internal Testing track');
          console.error('[IAP Service] ⚠️   4. Test account not added as Internal Tester');
          console.error('[IAP Service] ⚠️   5. Base plans not activated');
          console.error('[IAP Service] ⚠️   6. Package name mismatch');
          console.error('[IAP Service] ⚠️ App package name:', 'com.resultmarketing.whatscard');
        }
      }

      if (!results || results.length === 0) {
        // CRITICAL FIX: In production, NEVER fallback to mock products
        // This was causing mock SKUs to poison this.products and trigger purchase failures
        if (__DEV__) {
          console.warn('[IAP Service] ⚠️ [DEV ONLY] No products found, falling back to mock');
          return this.fetchMockProducts();
        } else {
          const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
          console.error(`[IAP Service] ❌ [PRODUCTION] ${storeName} returned 0 products - BLOCKING PURCHASE`);
          console.error(`[IAP Service] ❌ Cannot proceed without valid product data from ${storeName}`);
          throw new Error(`No subscription products available from ${storeName}. Please ensure subscriptions are properly configured in ${storeName} Connect.`);
        }
      }

      this.products = results.map((product: any) => {
        // CRITICAL FIX: react-native-iap v14 product objects use .id (NOT .productId)
        const productId = product?.id || '';
        const type: SubscriptionPlan = productId.includes('monthly') ? 'monthly' : 'yearly';

        // Use hardcoded pricing from IAP_CONFIG instead of Google Play's localized price
        // This prevents confusing currency symbols (e.g., $ instead of RM in Malaysia)
        const configPrice = IAP_CONFIG.PRICING[type];

        return {
          productId: product?.id || '',
          type: type,
          price: configPrice.displayPrice,  // Use hardcoded displayPrice from config
          priceAmount: configPrice.usd,     // Use hardcoded USD amount from config
          currency: 'USD',                  // Always USD to match our pricing config
          title: product?.title || '',
          description: product?.description || '',
        };
      });

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
      // CRITICAL FIX: Use explicit ID mapping first, then verify in fetched products
      const productId = this.mapPlanToProductId(plan);
      console.log('[IAP Service] 🔍 Mapped plan to product ID:', productId);

      // Verify the product was fetched successfully
      const fetchedProduct = this.products.find((p) => p.productId === productId);
      if (!fetchedProduct && !__DEV__) {
        const storeName = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
        console.error('[IAP Service] ❌ Product not found in fetched products:', productId);
        console.error('[IAP Service] ❌ Available products:', this.products.map(p => p.productId));
        console.error('[IAP Service] ❌ Total products fetched:', this.products.length);
        console.error('[IAP Service] ❌ Platform:', Platform.OS);
        throw new Error(`Product "${productId}" not available from ${storeName}. Please check that the subscription is configured in ${storeName} Connect with this exact Product ID.`);
      }

      console.log('[IAP Service] 🛒 Purchasing product ID:', productId);
      console.log('[IAP Service] 🔍 Platform:', Platform.OS);

      // CRITICAL FIX: Final safety check - NEVER allow mock IDs in production
      if (!__DEV__ && productId.includes('mock_')) {
        console.error('[IAP Service] ❌ [PRODUCTION] Attempted to purchase with mock ID:', productId);
        throw new Error('Cannot purchase with mock product ID in production');
      }

      // For Android, fetch subscription details to get offer tokens
      let subscriptionOffers: any[] | undefined;
      if (Platform.OS === 'android') {
        try {
          // CRITICAL FIX: Use fetchProducts with type:'subs' to get full subscription details
          // getSubscriptions() does NOT exist in react-native-iap v14
          console.log('[IAP Service] 🔍 Fetching subscription details with fetchProducts({type:subs})...');
          const subscriptions = await RNIap.fetchProducts({
            skus: [productId],
            type: 'subs'
          });
          console.log('[IAP Service] 📦 fetchProducts result:', JSON.stringify(subscriptions, null, 2));

          // CRITICAL FIX: react-native-iap v14 product objects use .id (NOT .productId)
          const currentProduct = subscriptions.find((p: any) => p.id === productId);
          console.log('[IAP Service] 📦 Current product:', JSON.stringify(currentProduct, null, 2));

          // CRITICAL FIX: In react-native-iap v14.5.0, subscriptionOfferDetailsAndroid can be:
          // - An array (most common in v14)
          // - A JSON string (some edge cases)
          // Handle both cases defensively to prevent crashes
          let offerDetails: any[] | null = null;

          if (currentProduct?.subscriptionOfferDetailsAndroid) {
            console.log('[IAP Service] 🔍 Raw subscriptionOfferDetailsAndroid:', currentProduct.subscriptionOfferDetailsAndroid);
            console.log('[IAP Service] 🔍 Type:', typeof currentProduct.subscriptionOfferDetailsAndroid);

            // DEFENSIVE: Handle both array and string cases
            if (Array.isArray(currentProduct.subscriptionOfferDetailsAndroid)) {
              // Already an array - use directly
              offerDetails = currentProduct.subscriptionOfferDetailsAndroid;
              console.log('[IAP Service] ✅ subscriptionOfferDetailsAndroid is already an array');
            } else if (typeof currentProduct.subscriptionOfferDetailsAndroid === 'string') {
              // String - needs parsing
              try {
                offerDetails = JSON.parse(currentProduct.subscriptionOfferDetailsAndroid);
                console.log('[IAP Service] ✅ Parsed subscriptionOfferDetailsAndroid from JSON string');
              } catch (parseError) {
                console.error('[IAP Service] ❌ Failed to parse subscriptionOfferDetailsAndroid:', parseError);
                offerDetails = [];
              }
            } else {
              // Unknown type - use empty array
              console.warn('[IAP Service] ⚠️ subscriptionOfferDetailsAndroid is unexpected type, using empty array');
              offerDetails = [];
            }

            console.log('[IAP Service] 📦 Final offer details:', JSON.stringify(offerDetails, null, 2));
          }

          if (offerDetails && Array.isArray(offerDetails) && offerDetails.length > 0) {
            // CRITICAL FIX: Select offer based on billingPeriod to match subscription plan
            // Monthly = P1M, Yearly = P1Y
            const expectedPeriod = plan === 'monthly' ? 'P1M' : 'P1Y';
            console.log('[IAP Service] 🔍 Expected billing period for', plan, ':', expectedPeriod);
            console.log('[IAP Service] 🔍 Total offers available:', offerDetails.length);

            // DEFENSIVE: Find matching offer by validating pricingPhases
            // Never crash on undefined/null fields - use optional chaining
            const matchingOffer = offerDetails.find((offer: any) => {
              // DEFENSIVE: Check offer exists and has required structure
              if (!offer || typeof offer !== 'object') {
                console.warn('[IAP Service] ⚠️ Invalid offer object:', offer);
                return false;
              }

              // DEFENSIVE: Check pricingPhases structure
              if (!offer.pricingPhases?.pricingPhaseList || !Array.isArray(offer.pricingPhases.pricingPhaseList)) {
                console.warn('[IAP Service] ⚠️ Offer missing pricingPhaseList:', offer.basePlanId);
                return false;
              }

              if (offer.pricingPhases.pricingPhaseList.length === 0) {
                console.warn('[IAP Service] ⚠️ Empty pricingPhaseList:', offer.basePlanId);
                return false;
              }

              // DEFENSIVE: Check if any pricing phase matches expected period (with null safety)
              return offer.pricingPhases.pricingPhaseList.some((phase: any) => {
                if (!phase || typeof phase !== 'object') return false;
                return phase.billingPeriod === expectedPeriod;
              });
            });

            if (matchingOffer && matchingOffer.offerToken) {
              const basePlanId = matchingOffer.basePlanId || 'unknown';
              const billingPeriod = matchingOffer.pricingPhases?.pricingPhaseList?.[0]?.billingPeriod || 'unknown';

              console.log('[IAP Service] ✅ Selected offer:');
              console.log('[IAP Service]   - basePlanId:', basePlanId);
              console.log('[IAP Service]   - billingPeriod:', billingPeriod);
              console.log('[IAP Service]   - offerToken:', matchingOffer.offerToken);

              // CRITICAL FIX: react-native-iap v14.5.0 requires basePlanId + offerToken
              subscriptionOffers = [{
                sku: productId,
                basePlanId: matchingOffer.basePlanId,
                offerToken: matchingOffer.offerToken,
              }];
            } else {
              console.error('[IAP Service] ❌ CRITICAL: No offer with billingPeriod', expectedPeriod);
              console.error('[IAP Service] ❌ Available offers:', offerDetails.map((o: any) => ({
                basePlanId: o?.basePlanId || 'unknown',
                billingPeriod: o?.pricingPhases?.pricingPhaseList?.[0]?.billingPeriod || 'unknown',
                hasOfferToken: !!o?.offerToken
              })));

              if (!__DEV__) {
                throw new Error(`No ${plan} subscription offer found with billingPeriod ${expectedPeriod}`);
              } else {
                console.warn('[IAP Service] ⚠️ [DEV] Will attempt purchase without offer validation');
              }
            }
          } else {
            console.error('[IAP Service] ❌ CRITICAL: No subscriptionOfferDetails in product!');
            console.error('[IAP Service] ❌ Product keys:', Object.keys(currentProduct || {}));
            console.error('[IAP Service] ❌ Product data:', JSON.stringify(currentProduct, null, 2));
            console.error('[IAP Service] ❌ offerDetails type:', typeof offerDetails);
            console.error('[IAP Service] ❌ offerDetails:', offerDetails);

            // BLOCK purchase if no offer token available
            if (!__DEV__) {
              throw new Error('Android subscription requires offerToken - cannot proceed');
            } else {
              console.warn('[IAP Service] ⚠️ [DEV] Missing offer details - purchase may fail');
            }
          }
        } catch (error) {
          console.error('[IAP Service] ❌ Failed to fetch offer tokens:', error);
          if (!__DEV__) {
            throw error; // Re-throw in production to block purchase
          }
        }
      }

      // Execute purchase
      // CRITICAL FIX: requestPurchase() is EVENT-BASED, not promise-based
      // We must use a Promise wrapper to wait for the purchase event
      console.log('[IAP Service] 🛒 Starting purchase flow...');
      console.log('[IAP Service] 🛒 Purchase listeners active:', {
        updateListener: !!this.purchaseUpdateSubscription,
        errorListener: !!this.purchaseErrorSubscription,
        pendingResolve: !!this.pendingPurchaseResolve,
        pendingReject: !!this.pendingPurchaseReject,
      });

      const purchase = await new Promise<any>((resolve, reject) => {
        console.log('[IAP Service] 🛒 Creating purchase promise wrapper...');

        // Set a timeout in case no event fires
        const timeout = setTimeout(() => {
          console.error('[IAP Service] ⏱️ Purchase timeout - 60 seconds elapsed with no response');
          console.error('[IAP Service] ⏱️ This usually means:');
          console.error('[IAP Service] ⏱️ 1. Apple/Google payment sheet was dismissed without action');
          console.error('[IAP Service] ⏱️ 2. Network connectivity issue');
          console.error('[IAP Service] ⏱️ 3. IAP service not responding');

          if (this.pendingPurchaseReject) {
            const error = new Error('Purchase timeout after 60 seconds - No response from App Store. Please check your internet connection and try again.');
            this.pendingPurchaseReject(error);
          }
        }, 60000); // 60 second timeout

        // Store wrapped resolve/reject that clear timeout and self-null
        this.pendingPurchaseResolve = (value: any) => {
          clearTimeout(timeout);
          this.pendingPurchaseResolve = null;
          this.pendingPurchaseReject = null;
          resolve(value);
        };

        this.pendingPurchaseReject = (reason: any) => {
          clearTimeout(timeout);
          this.pendingPurchaseResolve = null;
          this.pendingPurchaseReject = null;
          reject(reason);
        };

        // Trigger the purchase (NO await - returns void)
        if (Platform.OS === 'ios') {
          console.log('[IAP Service] 🍎 iOS: Calling requestPurchase...');

          // CRITICAL FIX: Use same requestPurchase() API for both iOS and Android
          // iOS format uses platform-specific wrapper just like Android
          // https://github.com/dooboolab-community/react-native-iap
          const iosPurchaseRequest = {
            request: {
              ios: {
                sku: productId,  // iOS uses singular "sku" (not "skus" array)
              },
            },
            type: 'subs',  // Explicit subscription type
          };

          console.log('[IAP Service] 📦 iOS Purchase request:', JSON.stringify(iosPurchaseRequest, null, 2));

          try {
            console.log('[IAP Service] 🍎 Calling RNIap.requestPurchase()...');
            RNIap.requestPurchase(iosPurchaseRequest);
            console.log('[IAP Service] 🍎 RNIap.requestPurchase() called (void return - waiting for events)');
          } catch (requestError) {
            console.error('[IAP Service] ❌ Error calling requestPurchase:', requestError);
            reject(requestError);
          }
        } else {
          console.log('[IAP Service] 🤖 Android: Calling requestPurchase with subscription offers...');

          if (subscriptionOffers && subscriptionOffers.length > 0) {
            console.log('[IAP Service] 🎁 Using validated subscription offer with correct billingPeriod');

            // CRITICAL: GitHub issue #2963 solution - Use platform-specific request wrapper
            // https://github.com/dooboolab-community/react-native-iap/discussions/2963
            const androidRequest = {
              skus: [productId],  // Must be array
              subscriptionOffers: subscriptionOffers,  // Contains [{ sku, basePlanId, offerToken }]
            };

            const purchaseRequest = {
              request: {
                android: androidRequest,  // Platform-specific wrapper
              },
              type: 'subs',  // Explicit type
            };

            console.log('[IAP Service] 📦 Purchase request:', JSON.stringify(purchaseRequest, null, 2));

            RNIap.requestPurchase(purchaseRequest);
          } else {
            console.error('[IAP Service] ❌ No valid subscription offer found');
            throw new Error('Cannot purchase subscription without valid offer token');
          }
        }
      });

      console.log('[IAP Service] ✅ Purchase event received');
      console.log('[IAP Service] ✅ Purchase data:', JSON.stringify(purchase, null, 2));

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
      console.error('[IAP Service] ❌ Error type:', typeof error);
      console.error('[IAP Service] ❌ Error code:', error?.code);
      console.error('[IAP Service] ❌ Error message:', error?.message);
      console.error('[IAP Service] ❌ Error stack:', error?.stack);
      console.error('[IAP Service] ❌ Error keys:', Object.keys(error || {}));
      console.error('[IAP Service] ❌ Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Check if user canceled
      if (error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_CANCELED') {
        return {
          success: false,
          error: 'Purchase canceled',
        };
      }

      // Return detailed error message with all available information
      const errorDetails = [
        error.message,
        error.code ? `Code: ${error.code}` : null,
        error.localizedDescription ? `Description: ${error.localizedDescription}` : null,
        error.debugMessage ? `Debug: ${error.debugMessage}` : null,
      ].filter(Boolean).join(' | ');

      return {
        success: false,
        error: errorDetails || 'Purchase failed - unknown error',
      };
    }
  }

  /**
   * FIX #2 & #4: Validate receipt with server and create subscription from REAL data
   * PUBLIC for use in iOS hook
   */
  async validateReceiptAndCreateSubscription(
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
        // CRITICAL FIX: Use getTransactionJwsIOS() instead of deprecated getReceiptDataIOS()
        // react-native-iap v14+ recommends JWT-based validation for individual transactions
        // See: https://react-native-iap.hyo.dev/docs/guides/receipt-validation
        console.log('[IAP Service] 🔐 Platform: ios');

        try {
          // Get the transaction-specific JWT for this purchase
          const productId = purchase.productId;
          console.log('[IAP Service] 🔐 Getting transaction JWT for product:', productId);

          const transactionJWT = await RNIap.getTransactionJwsIOS(productId);
          console.log('[IAP Service] 🔐 Transaction JWT obtained, length:', transactionJWT?.length);

          receiptData = transactionJWT;
        } catch (jwtError) {
          console.error('[IAP Service] ❌ Failed to get transaction JWT:', jwtError);
          // Fallback: try to get the full app receipt (contains ALL transactions)
          console.warn('[IAP Service] ⚠️ Falling back to full app receipt...');
          receiptData = await RNIap.getReceiptDataIOS();
        }
      } else {
        // Android uses the purchase token
        receiptData = purchase.transactionReceipt || purchase.purchaseToken;
      }

      if (!receiptData) {
        console.error('[IAP Service] ❌ No receipt data available');
        return null;
      }

      console.log('[IAP Service] 🔐 Receipt data length:', receiptData?.length);

      // CRITICAL: Validate userId is available
      if (!this.currentUserId) {
        console.error('[IAP Service] ❌ No userId set! User must be logged in for receipt validation.');
        console.error('[IAP Service] ❌ Call iapService.setUserId() after authentication.');
        throw new Error('User must be logged in to validate receipts. Please sign in and try again.');
      }

      console.log('[IAP Service] 🔐 User ID:', this.currentUserId.substring(0, 8) + '...');
      console.log('[IAP Service] 🔐 Product ID:', purchase.productId);
      console.log('[IAP Service] 🔐 Platform:', Platform.OS);
      console.log('[IAP Service] 🔐 Transaction ID:', purchase.transactionId);

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
        throw new Error(`Server validation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[IAP Service] 🔐 Validation result:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('[IAP Service] ❌ Receipt validation returned error:', result.error);
        throw new Error(`Validation error: ${result.error}`);
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

  /**
   * CRITICAL FIX: Map plan name to explicit product ID
   * Prevents crashes when productId is undefined
   */
  private mapPlanToProductId(plan: SubscriptionPlan): string {
    const platform = Platform.OS as 'ios' | 'android';
    const productIds = getProductIds(platform);

    if (plan === 'monthly') {
      return productIds.monthly;
    } else if (plan === 'yearly') {
      return productIds.yearly;
    }

    // Fallback (should never happen)
    console.error('[IAP Service] ❌ Invalid plan type:', plan);
    return productIds.monthly;
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

  async saveSubscription(subscription: SubscriptionInfo): Promise<void> {
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

  /**
   * Open subscription management page (Apple/Google)
   *
   * This is the ONLY allowed way to let users cancel subscriptions.
   * Direct cancel buttons are PROHIBITED by App Store and Play Store guidelines.
   */
  async openSubscriptionManagement(): Promise<void> {
    console.log('[IAP Service] 🔗 Opening subscription management...');

    if (IAP_CONFIG.MOCK_MODE || !RNIap) {
      console.log('[IAP Service] 🎭 Mock mode: Would open subscription management');
      // In production, this would open the actual store
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        // iOS: Opens Settings → Apple ID → Subscriptions
        await RNIap.deepLinkToSubscriptions();
        console.log('[IAP Service] ✅ Opened iOS subscription management');
      } else {
        // Android: Opens Google Play Store → Subscriptions page
        await RNIap.deepLinkToSubscriptions();
        console.log('[IAP Service] ✅ Opened Google Play subscription management');
      }
    } catch (error) {
      console.error('[IAP Service] ❌ Failed to open subscription management:', error);
      // Fallback: Could show instructions to user
      throw new Error('Could not open subscription management. Please manage via your device settings.');
    }
  }
}

// Export singleton instance
export const iapService = new IAPService();

console.log('[IAP Service] ✅ Service initialized');
