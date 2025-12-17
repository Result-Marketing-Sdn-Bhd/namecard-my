# Subscription Management Guide

## 🔄 Restore Purchases Button

### What It Does
Allows users to recover their subscription after:
- Reinstalling the app
- Switching devices
- Clearing app data
- Upgrading their phone

### Implementation Example

```typescript
import { iapService } from './services/iapService';

// In your Settings or Profile screen
const handleRestorePurchases = async () => {
  setLoading(true);
  try {
    const result = await iapService.restorePurchases();

    if (result.success) {
      Alert.alert(
        '✅ Purchases Restored',
        'Your subscription has been restored successfully!'
      );
      // Refresh UI to show premium features
      await checkSubscriptionStatus();
    } else {
      Alert.alert(
        'No Purchases Found',
        'We could not find any active subscriptions for this account.'
      );
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Failed to restore purchases. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

// Button in UI
<TouchableOpacity onPress={handleRestorePurchases}>
  <Text>Restore Purchases</Text>
</TouchableOpacity>
```

---

## 🚫 Cancel Subscription (PROHIBITED)

### ❌ What You CANNOT Do

```typescript
// ❌ THIS IS PROHIBITED - App will be REJECTED
<Button
  title="Cancel Subscription"
  onPress={cancelSubscription}  // FORBIDDEN!
/>
```

**Why?**
- **Apple App Store** - Automatic rejection
- **Google Play Store** - Policy violation, possible suspension
- **Consumer Protection** - Prevents dark patterns

---

## ✅ Manage Subscription (COMPLIANT)

### What You SHOULD Do Instead

Redirect users to the official subscription management page:

```typescript
import { iapService } from './services/iapService';
import { Platform, Alert, Linking } from 'react-native';

// Compliant implementation
const handleManageSubscription = async () => {
  try {
    await iapService.openSubscriptionManagement();
  } catch (error) {
    // Fallback: Show manual instructions
    const instructions = Platform.OS === 'ios'
      ? 'Go to Settings → [Your Name] → Subscriptions → WhatsCard Premium'
      : 'Go to Google Play Store → Subscriptions → WhatsCard Premium';

    Alert.alert(
      'Manage Subscription',
      instructions,
      [
        { text: 'OK' },
        Platform.OS === 'android' && {
          text: 'Open Play Store',
          onPress: () => Linking.openURL('https://play.google.com/store/account/subscriptions')
        }
      ].filter(Boolean)
    );
  }
};

// Button in UI
<TouchableOpacity onPress={handleManageSubscription}>
  <Text>Manage Subscription</Text>
</TouchableOpacity>
```

---

## 📱 Complete UI Example

### Settings Screen with Subscription Management

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { iapService } from '../services/iapService';

export function SubscriptionSettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const sub = await iapService.getSubscriptionStatus();
    setSubscription(sub);
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await iapService.restorePurchases();

      if (result.success) {
        Alert.alert('Success', 'Your subscription has been restored!');
        await loadSubscription();
      } else {
        Alert.alert('No Purchases Found', result.error || 'No active subscriptions found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await iapService.openSubscriptionManagement();
    } catch (error) {
      Alert.alert(
        'Manage Subscription',
        Platform.OS === 'ios'
          ? 'Open Settings → [Your Name] → Subscriptions'
          : 'Open Google Play Store → Subscriptions'
      );
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Subscription Status */}
      {subscription ? (
        <View style={{ marginBottom: 20 }}>
          <Text>Status: {subscription.status}</Text>
          <Text>Plan: {subscription.plan}</Text>
          <Text>Expires: {new Date(subscription.expiryDate).toLocaleDateString()}</Text>
        </View>
      ) : (
        <Text>No active subscription</Text>
      )}

      {/* Restore Purchases Button */}
      <TouchableOpacity
        onPress={handleRestorePurchases}
        disabled={loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Restore Purchases
          </Text>
        )}
      </TouchableOpacity>

      {/* Manage Subscription Button (Only if subscribed) */}
      {subscription?.status === 'active' && (
        <TouchableOpacity
          onPress={handleManageSubscription}
          style={{
            backgroundColor: '#34C759',
            padding: 15,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Manage Subscription
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

## 🎯 Where to Show These Buttons

### Recommended Placement

1. **Settings Screen** ✅
   - Most common location
   - Users expect subscription management here

2. **Profile Screen** ✅
   - Good secondary location
   - Shows subscription status prominently

3. **Paywall Screen** ⚠️
   - Show "Restore Purchases" only
   - Helps users who already purchased

4. **Subscription Details Screen** ✅
   - Dedicated screen for subscription info
   - Both buttons make sense here

### ❌ Where NOT to Show

- Login/Signup screens (confusing)
- Middle of purchase flow (interrupts conversion)
- Random places throughout app (poor UX)

---

## 📊 Button Labeling Best Practices

### ✅ Good Labels

| Button | Label |
|--------|-------|
| Restore | "Restore Purchases" |
| Manage | "Manage Subscription" |
| Manage | "Cancel or Change Plan" |
| Manage | "Subscription Settings" |

### ❌ Bad Labels (Prohibited)

| Button | Label | Why Bad |
|--------|-------|---------|
| ❌ | "Cancel Subscription" | Violates policy |
| ❌ | "Unsubscribe" | Misleading |
| ❌ | "End Plan" | Implies in-app cancellation |

---

## 🔒 Platform Policies

### Apple App Store Review Guidelines

> **3.1.2** - Apps should allow a user to get what they've paid for without performing additional tasks, such as posting on social media, uploading contacts, checking in to the app a certain number of times, etc.

> **Apps must not include buttons or external links that provide customers with mechanisms to purchase content, functionality, or services outside of the app's in-app purchase system.**

### Google Play Developer Program Policies

> **Subscriptions**: Apps must use Google Play's billing system to sell in-app subscriptions. Apps must not mislead users about any subscription services or content offered within the app.

> **Subscription management**: Users must be able to access information about their subscriptions and cancel them directly from Google Play.

---

## 🧪 Testing Checklist

### Test Restore Purchases

- [ ] Reinstall app → Tap Restore → Premium unlocked
- [ ] Clear app data → Tap Restore → Premium unlocked
- [ ] No active subscription → Tap Restore → Show "Not found" message
- [ ] Expired subscription → Tap Restore → Show expired status

### Test Manage Subscription

**iOS:**
- [ ] Tap button → Opens Settings app
- [ ] Navigate to Subscriptions section
- [ ] Find WhatsCard Premium listed
- [ ] Can view/cancel/modify subscription

**Android:**
- [ ] Tap button → Opens Google Play Store
- [ ] Navigate to Subscriptions section
- [ ] Find WhatsCard Premium listed
- [ ] Can view/cancel/modify subscription

---

## 📝 Summary

| Feature | Purpose | Implementation |
|---------|---------|----------------|
| **Restore Purchases** | Recover subscription after reinstall | `iapService.restorePurchases()` |
| **Manage Subscription** | Let users cancel/modify plan | `iapService.openSubscriptionManagement()` |
| **Cancel Button** | ❌ PROHIBITED | Use "Manage" instead |

---

## 🚨 Common Mistakes to Avoid

1. ❌ Adding "Cancel Subscription" button → App rejection
2. ❌ Hiding restore button → Users can't recover purchases
3. ❌ Not testing restore flow → Angry users after reinstall
4. ❌ Confusing button labels → Poor UX
5. ❌ Requiring login to restore → Should work without auth

---

## ✅ Final Checklist

Before submitting to App Store / Play Store:

- [ ] "Restore Purchases" button visible and working
- [ ] "Manage Subscription" button opens correct page
- [ ] NO "Cancel" or "Unsubscribe" buttons anywhere
- [ ] Tested restore flow on fresh install
- [ ] Tested manage flow on both platforms
- [ ] Button labels are clear and compliant
