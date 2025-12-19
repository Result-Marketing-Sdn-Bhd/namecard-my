/**
 * useSubscription Hook for WhatsCard
 *
 * Custom React hook to manage subscription state and operations
 *
 * Features:
 * - Fetch products from IAP
 * - Purchase subscriptions
 * - Restore purchases
 * - Check subscription status
 * - Loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { iapService } from '../services/iapService';
import { SubscriptionInfo, ProductInfo, SubscriptionPlan } from '../config/iap-config';
import { isSubscriptionActive } from '../utils/subscription-utils';

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

export const useSubscription = (): UseSubscriptionReturn => {
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Action states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  /**
   * Initialize IAP and load subscription status
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[useSubscription] 🚀 Initializing...');
        setIsLoading(true);
        setError(null);

        // Initialize IAP service
        await iapService.initialize();

        // Load current subscription status
        const currentSubscription = await iapService.getSubscriptionStatus();
        setSubscription(currentSubscription);

        console.log('[useSubscription] ✅ Initialized');
        console.log('[useSubscription] 📊 Subscription:', currentSubscription?.status || 'none');

        // CRITICAL FIX: Fetch products AFTER initialization completes
        // This ensures StoreKit connection is ready before fetching
        console.log('[useSubscription] 📦 Now fetching products after initialization...');
        await fetchProducts();
      } catch (err: any) {
        console.error('[useSubscription] ❌ Initialization error:', err);
        setError(err.message || 'Failed to initialize subscription service');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      iapService.disconnect();
    };
  }, []); // fetchProducts is stable, so we don't include it in deps

  /**
   * Fetch available products
   */
  const fetchProducts = useCallback(async () => {
    try {
      console.log('[useSubscription] 📦 Fetching products...');
      setProductsLoading(true);
      setProductsError(null);

      const fetchedProducts = await iapService.fetchProducts();
      setProducts(fetchedProducts);

      console.log('[useSubscription] ✅ Products loaded:', fetchedProducts.length);
    } catch (err: any) {
      console.error('[useSubscription] ❌ Product fetch error:', err);
      setProductsError(err.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // REMOVED: useEffect that was calling fetchProducts() too early
  // fetchProducts() is now called AFTER initialize() completes (line 80)

  /**
   * Purchase a subscription
   */
  const purchaseSubscription = useCallback(
    async (plan: SubscriptionPlan, promoCode?: string): Promise<boolean> => {
      try {
        console.log('[useSubscription] 💳 Starting purchase:', plan);
        setIsPurchasing(true);
        setError(null);

        const result = await iapService.purchaseSubscription(plan, promoCode);

        if (result.success && result.subscription) {
          console.log('[useSubscription] ✅ Purchase successful');
          setSubscription(result.subscription);
          return true;
        } else {
          console.log('[useSubscription] ❌ Purchase failed:', result.error);
          setError(result.error || 'Purchase failed');
          return false;
        }
      } catch (err: any) {
        console.error('[useSubscription] ❌ Purchase error:', err);
        console.error('[useSubscription] ❌ Error type:', typeof err);
        console.error('[useSubscription] ❌ Error keys:', Object.keys(err || {}));
        console.error('[useSubscription] ❌ Error stringified:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

        const errorMessage = err.message || err.toString() || 'Purchase failed';
        setError(errorMessage);

        // Re-throw to let PaywallScreen catch and display full details
        throw err;
      } finally {
        setIsPurchasing(false);
      }
    },
    []
  );

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useSubscription] 🔄 Restoring purchases...');
      setIsRestoring(true);
      setError(null);

      const result = await iapService.restorePurchases();

      if (result.success && result.subscription) {
        console.log('[useSubscription] ✅ Restore successful');
        setSubscription(result.subscription);
        return true;
      } else {
        console.log('[useSubscription] ❌ Restore failed:', result.error);
        setError(result.error || 'No purchases found');
        return false;
      }
    } catch (err: any) {
      console.error('[useSubscription] ❌ Restore error:', err);
      setError(err.message || 'Failed to restore purchases');
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
      console.log('[useSubscription] 🔄 Refreshing subscription status...');
      const currentSubscription = await iapService.getSubscriptionStatus();
      setSubscription(currentSubscription);
      console.log('[useSubscription] ✅ Subscription refreshed');
    } catch (err: any) {
      console.error('[useSubscription] ❌ Refresh error:', err);
      setError(err.message || 'Failed to refresh subscription');
    }
  }, []);

  /**
   * Clear subscription (for testing/logout)
   */
  const clearSubscription = useCallback(async (): Promise<void> => {
    try {
      console.log('[useSubscription] 🗑️ Clearing subscription...');
      await iapService.clearSubscription();
      setSubscription(null);
      console.log('[useSubscription] ✅ Subscription cleared');
    } catch (err: any) {
      console.error('[useSubscription] ❌ Clear error:', err);
      setError(err.message || 'Failed to clear subscription');
    }
  }, []);

  // Calculate if subscription is active
  const isActive = subscription ? isSubscriptionActive(subscription) : false;

  return {
    // State
    subscription,
    isActive,
    isLoading,
    error,

    // Products
    products,
    productsLoading,
    productsError,

    // Actions
    purchaseSubscription,
    restorePurchases,
    refreshSubscription,
    clearSubscription,

    // Action states
    isPurchasing,
    isRestoring,
  };
};

console.log('[useSubscription] ✅ Hook defined');
