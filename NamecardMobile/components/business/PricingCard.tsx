/**
 * PricingCard Component for WhatsCard Paywall
 *
 * Displays a subscription plan with pricing, features, and selection state
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionPlan } from '../../config/iap-config';
import { formatPrice, getValueProposition, getBestValueBadge } from '../../utils/subscription-utils';

interface PricingCardProps {
  plan: SubscriptionPlan;
  price: number;
  originalPrice?: number; // For showing promo discount
  title: string;
  description: string;
  features?: string[];
  isSelected: boolean;
  onSelect: () => void;
  badge?: string | null;
  disabled?: boolean;
  isCurrent?: boolean; // Whether this is the user's current active plan
  style?: ViewStyle;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  price,
  originalPrice,
  title,
  description,
  features = [],
  isSelected,
  onSelect,
  badge,
  disabled = false,
  isCurrent = false,
  style,
}) => {
  const hasPromo = originalPrice && originalPrice > price;
  const badgeText = isCurrent ? 'CURRENT PLAN' : (badge || getBestValueBadge(plan));

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        disabled && styles.cardDisabled,
        isCurrent && styles.cardCurrent,
        style,
      ]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Badge (e.g., "BEST VALUE" or "CURRENT PLAN") */}
      {badgeText && (
        <View style={[styles.badge, isCurrent && styles.badgeCurrent]}>
          <Ionicons name={isCurrent ? "checkmark-circle" : "star"} size={14} color="#FFFFFF" style={styles.badgeIcon} />
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}

      {/* Selection Indicator */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isSelected && styles.titleSelected]}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.pricingContainer}>
        {hasPromo && (
          <View style={styles.originalPriceContainer}>
            <Text style={styles.originalPrice}>{formatPrice(originalPrice!)}</Text>
            <View style={styles.strikethrough} />
          </View>
        )}

        <View style={styles.currentPriceContainer}>
          <Text style={[styles.price, isSelected && styles.priceSelected]}>
            {formatPrice(price)}
          </Text>
          <Text style={styles.period}>
            {plan === 'monthly' ? '/month' : '/year'}
          </Text>
        </View>

        {/* Monthly equivalent for yearly plans */}
        {plan === 'yearly' && (
          <Text style={styles.monthlyEquivalent}>
            ({formatPrice(price / 12)}/month)
          </Text>
        )}

        {plan === 'yearly' && !hasPromo && (
          <Text style={styles.savings}>
            {getValueProposition(plan, price)}
          </Text>
        )}

        {hasPromo && (
          <View style={styles.promoTag}>
            <Ionicons name="pricetag" size={14} color="#10B981" />
            <Text style={styles.promoText}>
              Promo Applied - {Math.round(((originalPrice! - price) / originalPrice!) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>

      {/* Features (optional) */}
      {features.length > 0 && (
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isSelected ? '#4A7A5C' : '#6B7280'}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#4A7A5C',
    backgroundColor: '#F0FDF4',
    shadowColor: '#4A7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#4A7A5C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeCurrent: {
    backgroundColor: '#10B981',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  titleSelected: {
    color: '#4A7A5C',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#4A7A5C',
    borderColor: '#4A7A5C',
  },
  pricingContainer: {
    marginBottom: 12,
  },
  originalPriceContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF4444',
  },
  currentPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  priceSelected: {
    color: '#4A7A5C',
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  monthlyEquivalent: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  savings: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 6,
  },
  featuresContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
});

console.log('[PricingCard] ✅ Component defined');
