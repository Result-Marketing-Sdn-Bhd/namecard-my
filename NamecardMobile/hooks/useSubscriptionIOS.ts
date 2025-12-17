/**
 * iOS-specific subscription hook using official react-native-iap useIAP hook
 *
 * This uses the official useIAP hook which handles:
 * - Automatic connection initialization
 * - Product fetching
 * - Purchase listeners via callbacks
 * - Error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  useIAP,
  requestPurchase,
  finishTransaction,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { IAP_CONFIG, getProductIds, SubscriptionPlan, SubscriptionInfo, ProductInfo } from '../config/iap-config';
import { iapService } from '../services/iapService';

interface UseSubscriptionReturn {
  // Subscription state
  subscription: SubscriptionInfo | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Products
  products: ProductInfo[];
  productsLoading: boolean;
  productsError: string | null;

  // Actions
  purchaseSubscription: (plan: SubscriptionPlan, promoCode?: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => Promise<void>;

  // Purchase state
  isPurchasing: boolean;
  isRestoring: boolean;
}

export const useSubscriptionIOS = (): UseSubscriptionReturn => {
  // Local state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Get product IDs
  const productIds = getProductIds('ios');
  const productIdArray = [productIds.monthly, productIds.yearly];

  /**
   * Handle purchase success callback
   */
  const handlePurchaseSuccess = useCallback(async (purchase: Purchase) => {
    console.log('[useSubscriptionIOS] 🎉 Purchase received:', purchase.productId);

    try {
      // Validate receipt with server
      console.log('[useSubscriptionIOS] 🔐 Validating receipt...');
      const plan: SubscriptionPlan = purchase.productId.includes('monthly') ? 'monthly' : 'yearly';

      const validatedSubscription = await iapService.validateReceiptAndCreateSubscription(
        purchase,
        plan
      );

      if (validatedSubscription) {
        console.log('[useSubscriptionIOS] ✅ Receipt validated');
        await iapService.saveSubscription(validatedSubscription);
        setSubscription(validatedSubscription);

        // Finish transaction
        await finishTransaction({ purchase, isConsumable: false });
        console.log('[useSubscriptionIOS] ✅ Transaction finished');
      } else {
        throw new Error('Receipt validation failed');
      }
    } catch (err: any) {
      console.error('[useSubscriptionIOS] ❌ Purchase processing error:', err);
      setError(err.message || 'Purchase processing failed');
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  /**
   * Handle purchase error callback
   */
  const handlePurchaseError = useCallback((purchaseError: PurchaseError) => {
    console.error('[useSubscriptionIOS] ❌ Purchase error:', purchaseError);

    // Check if user canceled (use string comparison to avoid TypeScript error)
    const errorCode = purchaseError.code as string;
    if (errorCode === 'E_USER_CANCELLED' || errorCode === 'E_USER_CANCELED') {
      setError('Purchase canceled');
    } else {
      setError(purchaseError.message || 'Purchase failed');
    }

    setIsPurchasing(false);
  }, []);

  // Use official useIAP hook with callback handlers
  const {
    connected,
    products: iapProducts,
    subscriptions: iapSubscriptions,
    fetchProducts: fetchProductsHook,
    finishTransaction: finishTransactionHook,
  } = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: handlePurchaseError,
  });

  console.log('[useSubscriptionIOS] 🍎 Using official useIAP hook');
  console.log('[useSubscriptionIOS] 🔗 Connected:', connected);

  /**
   * Fetch subscriptions when connected
   */
  useEffect(() => {
    const fetchProducts = async () => {
      if (!connected) {
        console.log('[useSubscriptionIOS] ⏳ Waiting for IAP connection...');
        return;
      }

      try {
        console.log('[useSubscriptionIOS] 📦 Fetching subscriptions...');
        console.log('[useSubscriptionIOS] 📦 Product IDs:', productIdArray);
        setProductsLoading(true);
        setProductsError(null);

        // CRITICAL FIX: Must specify type:'subs' for subscriptions
        await fetchProductsHook({ skus: productIdArray, type: 'subs' });
        console.log('[useSubscriptionIOS] ✅ fetchProducts called with type:subs');
      } catch (err: any) {
        console.error('[useSubscriptionIOS] ❌ Error fetching subscriptions:', err);
        setProductsError(err.message || 'Failed to fetch subscriptions');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [connected, fetchProductsHook]);

  /**
   * Process fetched products from useIAP hook
   */
  useEffect(() => {
    console.log('[useSubscriptionIOS] 📦 iapSubscriptions updated:', iapSubscriptions?.length || 0);
    console.log('[useSubscriptionIOS] 📦 iapProducts updated:', iapProducts?.length || 0);
    console.log('[useSubscriptionIOS] 📦 Raw iapSubscriptions:', JSON.stringify(iapSubscriptions, null, 2));
    console.log('[useSubscriptionIOS] 📦 Raw iapProducts:', JSON.stringify(iapProducts, null, 2));

    const allProducts = [...(iapSubscriptions || []), ...(iapProducts || [])];

    if (allProducts.length > 0) {
      const mappedProducts: ProductInfo[] = allProducts.map((product: any) => {
        const productId = product.productId;
        const type: SubscriptionPlan = productId.includes('monthly') ? 'monthly' : 'yearly';
        const configPrice = IAP_CONFIG.PRICING[type];

        console.log('[useSubscriptionIOS] 🔍 Mapping product:', {
          productId,
          type,
          localizedPrice: product.localizedPrice,
          price: product.price,
          currency: product.currency,
        });

        return {
          productId: product.productId,
          type: type,
          price: product.localizedPrice || configPrice.displayPrice,
          priceAmount: product.price ? parseFloat(product.price) : configPrice.usd,
          currency: product.currency || 'USD',
          title: product.title || '',
          description: product.description || '',
        };
      });

      setProducts(mappedProducts);
      setProductsLoading(false);
      console.log('[useSubscriptionIOS] ✅ Mapped', mappedProducts.length, 'products');
      console.log('[useSubscriptionIOS] ✅ Final products:', JSON.stringify(mappedProducts, null, 2));
    } else {
      console.warn('[useSubscriptionIOS] ⚠️ No products received from App Store');
      console.warn('[useSubscriptionIOS] ⚠️ This means:');
      console.warn('[useSubscriptionIOS] ⚠️ 1. Products not created in App Store Connect');
      console.warn('[useSubscriptionIOS] ⚠️ 2. Product IDs mismatch');
      console.warn('[useSubscriptionIOS] ⚠️ 3. App not published to TestFlight');
      console.warn('[useSubscriptionIOS] ⚠️ 4. Sandbox account not configured');
      console.warn('[useSubscriptionIOS] ⚠️ Expected product IDs:', productIdArray);
      setProductsLoading(false);
    }
  }, [iapSubscriptions, iapProducts]);

  /**
   * Load current subscription on mount
   */
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setIsLoading(true);
        const currentSubscription = await iapService.getSubscriptionStatus();
        setSubscription(currentSubscription);
      } catch (err: any) {
        console.error('[useSubscriptionIOS] ❌ Error loading subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscription();
  }, []);

  /**
   * Purchase subscription
   */
  const purchaseSubscription = useCallback(
    async (plan: SubscriptionPlan, promoCode?: string): Promise<boolean> => {
      try {
        console.log('[useSubscriptionIOS] 💳 Starting purchase:', plan);
        setIsPurchasing(true);
        setError(null);

        // Get product ID
        const productId = plan === 'monthly' ? productIds.monthly : productIds.yearly;
        console.log('[useSubscriptionIOS] 🛒 Product ID:', productId);

        // Verify product exists
        const product = products.find(p => p.productId === productId);
        if (!product) {
          throw new Error(`Product ${productId} not found. Make sure products are fetched first.`);
        }

        // Request purchase using official hook function with correct structure
        await requestPurchase({
          type: 'subs',
          request: {
            apple: {
              sku: productId,
            },
          },
        });
        console.log('[useSubscriptionIOS] 🛒 Purchase requested');

        // The useIAP hook will handle the response via onPurchaseSuccess/onPurchaseError callbacks
        return true;
      } catch (err: any) {
        console.error('[useSubscriptionIOS] ❌ Purchase error:', err);
        setError(err.message || 'Purchase failed');
        setIsPurchasing(false);
        return false;
      }
    },
    [productIds, products]
  );

  /**
   * Restore purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useSubscriptionIOS] 🔄 Restoring purchases...');
      setIsRestoring(true);
      setError(null);

      const result = await iapService.restorePurchases();

      if (result.success && result.subscription) {
        setSubscription(result.subscription);
        return true;
      } else {
        setError(result.error || 'No purchases found');
        return false;
      }
    } catch (err: any) {
      console.error('[useSubscriptionIOS] ❌ Restore error:', err);
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  /**
   * Refresh subscription status
   */
  const refreshSubscription = useCallback(async (): Promise<void> => {
    try {
      const currentSubscription = await iapService.getSubscriptionStatus();
      setSubscription(currentSubscription);
    } catch (err: any) {
      console.error('[useSubscriptionIOS] ❌ Refresh error:', err);
    }
  }, []);

  /**
   * Clear subscription (for testing)
   */
  const clearSubscription = useCallback(async (): Promise<void> => {
    await iapService.clearSubscription();
    setSubscription(null);
  }, []);

  return {
    subscription,
    isActive: subscription?.status === 'active',
    isLoading,
    error,
    products,
    productsLoading,
    productsError,
    purchaseSubscription,
    restorePurchases,
    refreshSubscription,
    clearSubscription,
    isPurchasing,
    isRestoring,
  };
};
