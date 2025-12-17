/**
 * PaywallScreen for WhatsCard
 *
 * Beautiful subscription paywall with:
 * - Monthly and Yearly pricing options
 * - Promo code support (WHATSBNI = 70% off)
 * - Restore purchases
 * - Feature highlights
 * - Professional, modern UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PricingCard } from '../business/PricingCard';
import { useSubscriptionPlatform } from '../../hooks/useSubscriptionPlatform';
import { IAP_CONFIG, SubscriptionPlan } from '../../config/iap-config';
import { validatePromoCode, calculatePromoPrice, formatPrice } from '../../utils/subscription-utils';

interface PaywallScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onClose,
  onSuccess,
  onSkip,
  showSkipButton = true
}) => {
  const {
    products,
    productsLoading,
    purchaseSubscription,
    restorePurchases,
    isPurchasing,
    isRestoring,
    error: subscriptionError,
  } = useSubscriptionPlatform();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  // 🚫 Apple Guidelines: Promo codes disabled on iOS (Guideline 3.1.1)
  // Apple requires all unlocking mechanisms to go through official IAP
  // Android can still use promo codes
  const isPromoCodeEnabled = Platform.OS === 'android';

  // Debug: Log products when they change
  React.useEffect(() => {
    console.log('[PaywallScreen] 📦 Products updated:', products.length);
    console.log('[PaywallScreen] 📦 Products:', JSON.stringify(products, null, 2));
    console.log('[PaywallScreen] 📦 Products loading:', productsLoading);
    console.log('[PaywallScreen] 📦 Subscription error:', subscriptionError);
  }, [products, productsLoading, subscriptionError]);

  // Get pricing info
  const monthlyPrice = products.find(p => p.type === 'monthly')?.priceAmount || IAP_CONFIG.PRICING.monthly.usd;
  const yearlyPrice = products.find(p => p.type === 'yearly')?.priceAmount || IAP_CONFIG.PRICING.yearly.usd;

  // Calculate promo price if applied (Android only)
  const finalYearlyPrice = (promoApplied && isPromoCodeEnabled)
    ? calculatePromoPrice(yearlyPrice, promoCode, 'yearly')
    : yearlyPrice;

  /**
   * Handle promo code application
   */
  const handleApplyPromo = () => {
    setPromoError('');

    const validation = validatePromoCode(promoCode, selectedPlan);

    if (!validation.isValid) {
      setPromoError(validation.message);
      return;
    }

    setPromoApplied(true);
    Alert.alert('✅ Promo Applied!', validation.message);
  };

  /**
   * Handle purchase
   */
  const handlePurchase = async () => {
    console.log('[PaywallScreen] 💳 Initiating purchase:', selectedPlan);

    // DEBUG: Show products info before purchase
    if (products.length === 0) {
      Alert.alert(
        '⚠️ Debug Info',
        `No products available!\n\nProducts count: ${products.length}\nProducts loading: ${productsLoading}\nError: ${subscriptionError || 'None'}\n\nThis means products weren't fetched from App Store. Check console logs.`,
        [
          {
            text: 'Try Anyway',
            onPress: () => {}, // Continue with purchase attempt
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }

    try {
      // Only pass promo code on Android (iOS doesn't allow custom promo codes)
      const success = await purchaseSubscription(
        selectedPlan,
        (promoApplied && isPromoCodeEnabled) ? promoCode : undefined
      );

      if (success) {
        Alert.alert(
          '🎉 Success!',
          'Your subscription is now active. Enjoy WhatsCard Premium!',
          [
            {
              text: 'Get Started',
              onPress: () => onSuccess?.(),
            },
          ]
        );
      } else {
        // Show detailed error from the subscription hook
        const errorMessage = subscriptionError || 'Unknown error - no details available';

        // Log for debugging
        console.error('[PaywallScreen] ❌ Purchase failed with error:', errorMessage);
        console.error('[PaywallScreen] ❌ Subscription error state:', subscriptionError);

        Alert.alert(
          '❌ Purchase Failed',
          `Error Details:\n\n${errorMessage}\n\n⚠️ Since console logs aren't accessible on iOS, please take a screenshot of this message.\n\nIf this persists, contact support with this screenshot.`,
          [
            {
              text: 'Retry',
              onPress: () => handlePurchase(),
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('[PaywallScreen] ❌ Purchase error:', error);
      console.error('[PaywallScreen] ❌ Error details:', JSON.stringify(error, null, 2));

      // Show detailed error in Alert since console isn't accessible on iOS
      const errorDetails = [
        `Message: ${error?.message || 'Unknown error'}`,
        `Code: ${error?.code || 'N/A'}`,
        error?.localizedDescription ? `Description: ${error.localizedDescription}` : null,
        error?.userInfo ? `UserInfo: ${JSON.stringify(error.userInfo)}` : null,
        error?.debugMessage ? `Debug: ${error.debugMessage}` : null,
      ].filter(Boolean).join('\n\n');

      Alert.alert(
        '❌ Purchase Error',
        errorDetails,
        [
          {
            text: 'Copy Error',
            onPress: () => {
              // Copy error to clipboard would require expo-clipboard
              console.log('[PaywallScreen] Full error for debugging:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    }
  };

  /**
   * Handle restore purchases
   */
  const handleRestore = async () => {
    console.log('[PaywallScreen] 🔄 Restoring purchases...');

    const success = await restorePurchases();

    if (success) {
      Alert.alert(
        '✅ Restored!',
        'Your previous purchase has been restored.',
        [
          {
            text: 'Continue',
            onPress: () => onSuccess?.(),
          },
        ]
      );
    } else {
      Alert.alert(
        'ℹ️ No Purchases Found',
        'We couldn\'t find any previous purchases to restore.'
      );
    }
  };

  /**
   * Handle plan change - clear promo if switching to monthly
   */
  const handlePlanChange = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);

    // Clear promo if switching to monthly (promo only for yearly)
    if (plan === 'monthly' && promoApplied) {
      setPromoApplied(false);
      setPromoCode('');
      setPromoError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4A7A5C', '#3B6B4E', '#2D5A40']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
            <Text style={styles.headerTitle}>Go Premium</Text>
          </View>
          <View style={styles.headerRight}>
            {showSkipButton && onSkip && (
              <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Try First</Text>
              </TouchableOpacity>
            )}
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Value Proposition */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Unlock Premium Features</Text>
            <Text style={styles.heroSubtitle}>
              Take your networking to the next level
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {IAP_CONFIG.FEATURES.slice(0, 6).map((feature) => (
              <View key={feature.id} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#4A7A5C" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            {productsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A7A5C" />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : (
              <>
                <PricingCard
                  plan="yearly"
                  price={finalYearlyPrice}
                  originalPrice={promoApplied ? yearlyPrice : undefined}
                  title="Yearly Premium"
                  description="Best value - Save 20%"
                  isSelected={selectedPlan === 'yearly'}
                  onSelect={() => handlePlanChange('yearly')}
                  disabled={isPurchasing || isRestoring}
                />

                <PricingCard
                  plan="monthly"
                  price={monthlyPrice}
                  title="Monthly Premium"
                  description="Perfect for trying out"
                  isSelected={selectedPlan === 'monthly'}
                  onSelect={() => handlePlanChange('monthly')}
                  disabled={isPurchasing || isRestoring}
                />
              </>
            )}
          </View>

          {/* Promo Code Section - Android Only (Apple Guideline 3.1.1) */}
          {isPromoCodeEnabled && selectedPlan === 'yearly' && !promoApplied && (
            <View style={styles.promoSection}>
              <Text style={styles.promoLabel}>Have a promo code?</Text>
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter code (e.g., WHATSBNI)"
                  placeholderTextColor="#9CA3AF"
                  value={promoCode}
                  onChangeText={(text) => {
                    setPromoCode(text.toUpperCase());
                    setPromoError('');
                  }}
                  autoCapitalize="characters"
                  editable={!isPurchasing && !isRestoring}
                />
                <TouchableOpacity
                  style={[styles.promoButton, !promoCode && styles.promoButtonDisabled]}
                  onPress={handleApplyPromo}
                  disabled={!promoCode || isPurchasing || isRestoring}
                >
                  <Text style={styles.promoButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {promoError ? (
                <Text style={styles.promoErrorText}>{promoError}</Text>
              ) : null}
            </View>
          )}

          {/* No Payment Due Now - Cal AI Style */}
          {selectedPlan === 'yearly' && (
            <View style={styles.noPaymentContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.noPaymentText}>No Payment Due Now</Text>
            </View>
          )}

          {/* Purchase Button - Cal AI Style */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (isPurchasing || isRestoring || productsLoading) && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring || productsLoading}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Price Details Below Button - Cal AI Style */}
          <View style={styles.priceDetailsContainer}>
            <Text style={styles.priceDetailsMain}>
              {selectedPlan === 'yearly'
                ? promoApplied
                  ? `Just ${formatPrice(finalYearlyPrice)}/year (${formatPrice(finalYearlyPrice / 12)}/mo)`
                  : `Just ${formatPrice(finalYearlyPrice)}/year`
                : `${formatPrice(monthlyPrice)}/month, billed monthly`}
            </Text>
          </View>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#4A7A5C" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Terms & Privacy - REQUIRED by Apple Guideline 3.1.2 */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://whatscard.netlify.app/terms-of-service')}
              >
                Terms of Use (EULA)
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://whatscard.netlify.app/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
            <Text style={styles.subscriptionDetailsText}>
              • {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} subscription: {selectedPlan === 'yearly' ? formatPrice(finalYearlyPrice) + '/year' : formatPrice(monthlyPrice) + '/month'}
            </Text>
            <Text style={styles.autoRenewText}>
              • Subscription automatically renews unless canceled 24 hours before the end of the current period.
            </Text>
            <Text style={styles.autoRenewText}>
              • Payment will be charged to your Apple ID/Google Play account at confirmation of purchase.
            </Text>
            <Text style={styles.autoRenewText}>
              • Manage or cancel your subscription in your App Store/Play Store account settings.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A7A5C',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  pricingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  promoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  promoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  promoInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.5,
  },
  promoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A7A5C',
  },
  promoErrorText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginTop: 8,
  },
  promoHint: {
    color: '#D1FAE5',
    fontSize: 14,
    marginTop: 8,
  },
  noPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  noPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  purchaseButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  priceDetailsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  priceDetailsMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1FAE5',
    textAlign: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  legalSection: {
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#D1FAE5',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  autoRenewText: {
    fontSize: 11,
    color: '#A7F3D0',
    textAlign: 'center',
    lineHeight: 16,
  },
  subscriptionDetailsText: {
    fontSize: 12,
    color: '#D1FAE5',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
    lineHeight: 18,
  },
});

console.log('[PaywallScreen] ✅ Screen component defined');
