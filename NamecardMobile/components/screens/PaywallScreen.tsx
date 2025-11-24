/**
 * PaywallScreen for WhatsCard
 *
 * Beautiful subscription paywall with:
 * - Monthly and Yearly pricing options
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
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PricingCard } from '../business/PricingCard';
import { useSubscription } from '../../hooks/useSubscription';
import { IAP_CONFIG, SubscriptionPlan } from '../../config/iap-config';
import { formatPrice } from '../../utils/subscription-utils';

interface PaywallScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
  isTrialExpired?: boolean; // NEW: Track if user's trial has expired
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onClose,
  onSuccess,
  onSkip,
  showSkipButton = false, // DEFAULT: No skip button (non-dismissible paywall)
  isTrialExpired = false
}) => {
  const {
    products,
    productsLoading,
    purchaseSubscription,
    restorePurchases,
    isPurchasing,
    isRestoring,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');

  // Get pricing info from store products
  const monthlyPrice = products.find(p => p.type === 'monthly')?.priceAmount || IAP_CONFIG.PRICING.monthly.usd;
  const yearlyPrice = products.find(p => p.type === 'yearly')?.priceAmount || IAP_CONFIG.PRICING.yearly.usd;

  /**
   * Handle purchase
   */
  const handlePurchase = async () => {
    console.log('[PaywallScreen] 💳 Initiating purchase:', selectedPlan);

    const success = await purchaseSubscription(selectedPlan);

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
      Alert.alert(
        '❌ Purchase Failed',
        'Something went wrong. Please try again or contact support.'
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
   * Handle plan change
   */
  const handlePlanChange = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
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
            {/* ❌ REMOVED: No close button - paywall is non-dismissible */}
            {/* Users MUST subscribe to continue using the app */}
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
                  price={yearlyPrice}
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

          {/* Promo Code Instructions - Removed to comply with App Store/Play Store policies */}

          {/* No Payment Due Now - Cal AI Style */}
          {/* ✅ Show trial messaging ONLY if trial is not expired */}
          {!isTrialExpired && selectedPlan === 'yearly' && (
            <View style={styles.noPaymentContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.noPaymentText}>3-Day Free Trial - No Payment Due Now</Text>
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
              <Text style={styles.purchaseButtonText}>
                {isTrialExpired ? 'Subscribe Now' : 'Start Free Trial'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Price Details Below Button - Cal AI Style */}
          <View style={styles.priceDetailsContainer}>
            <Text style={styles.priceDetailsMain}>
              {selectedPlan === 'yearly'
                ? `Just ${formatPrice(yearlyPrice)}/year (${formatPrice(yearlyPrice / 12)}/mo)`
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

          {/* Terms & Privacy */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://whatscard.app/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://whatscard.app/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
            <Text style={styles.autoRenewText}>
              Subscription automatically renews unless canceled 24 hours before the end of the current period.
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
  promoInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  promoInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFD700',
    lineHeight: 20,
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
});

console.log('[PaywallScreen] ✅ Screen component defined');
