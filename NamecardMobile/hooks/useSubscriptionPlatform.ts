/**
 * Platform-aware subscription hook selector
 *
 * Uses the official react-native-iap useIAP hook for iOS
 * Uses custom implementation for Android
 */

import { Platform } from 'react-native';
import { useSubscriptionIOS } from './useSubscriptionIOS';
import { useSubscription } from './useSubscription';

/**
 * Platform-aware hook that selects the appropriate subscription implementation
 *
 * - iOS: Uses official react-native-iap useIAP hook (more reliable, better maintained)
 * - Android: Uses custom implementation (unchanged)
 */
export const useSubscriptionPlatform = () => {
  if (Platform.OS === 'ios') {
    console.log('[useSubscriptionPlatform] 🍎 Using iOS-specific implementation with official useIAP hook');
    return useSubscriptionIOS();
  } else {
    console.log('[useSubscriptionPlatform] 🤖 Using Android custom implementation');
    return useSubscription();
  }
};
