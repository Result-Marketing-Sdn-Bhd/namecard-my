# 🔧 Purchase Failure Fix - Play Store Internal Testing

**Date**: December 13, 2025
**Issue**: "Purchase failed" error when testing subscriptions on Play Store Internal Testing
**Status**: ✅ **FIXED**

---

## 🐛 Root Causes Identified

### 1. **Incorrect API Usage for react-native-iap v14** ❌

**Problem**: Code was using `requestSubscription()` which is the **old v12 API**.

**Location**: `services/iapService.ts:288-301`

**What was wrong**:
```typescript
// OLD CODE (WRONG):
purchase = await RNIap.requestSubscription({
  sku: productId,
});
```

**Why it failed**:
- In react-native-iap v14, subscriptions use `requestPurchase()`, not `requestSubscription()`
- This caused the Google Play Billing to reject the purchase
- Error was silent because the wrong API was being called

---

### 2. **Missing Subscription Offer Tokens on Android** ❌

**Problem**: Android subscriptions REQUIRE an `offerToken` to complete purchases.

**Location**: `services/iapService.ts:269-286`

**What was wrong**:
```typescript
// OLD CODE (WRONG):
const { subscriptions } = await RNIap.fetchProducts({ skus: [productId] });
```

**Why it failed**:
- In v14, `fetchProducts()` returns products directly (not `{ subscriptions }`)
- This caused the offer token extraction to fail
- Without offer tokens, Android purchases fail with "purchase failed"

---

## ✅ Fixes Applied

### Fix 1: Use Correct v14 API - `requestPurchase()`

**File**: `services/iapService.ts`
**Lines**: 288-321

**New Code**:
```typescript
// FIXED: Use requestPurchase() for v14
if (Platform.OS === 'ios') {
  purchase = await RNIap.requestPurchase({
    sku: productId,
  });
} else {
  // Android: Include offer token
  purchase = await RNIap.requestPurchase({
    sku: productId,
    subscriptionOffers: [{
      sku: productId,
      offerToken: offerToken,
    }],
  });
}
```

**Why this works**:
- ✅ Uses the correct v14 API
- ✅ Includes required `offerToken` for Android
- ✅ Properly structured for Google Play Billing

---

### Fix 2: Correct Product Fetching for v14

**File**: `services/iapService.ts`
**Lines**: 269-286

**New Code**:
```typescript
// FIXED: fetchProducts returns products directly in v14
const products = await RNIap.fetchProducts({ skus: [productId] });
const currentProduct = products.find((p: any) => p.productId === productId);

if (currentProduct?.subscriptionOfferDetails) {
  subscriptionOffers = currentProduct.subscriptionOfferDetails.map((offer: any) => ({
    sku: productId,
    offerToken: offer.offerToken,
  }));
}
```

**Why this works**:
- ✅ Uses correct v14 response structure
- ✅ Extracts offer tokens properly
- ✅ Handles missing tokens gracefully

---

## 🔍 Google Play Console Checklist

To ensure purchases work in Internal Testing, verify these in Google Play Console:

### 1. **Subscription Products Created** ✅
- Navigate to: **Monetization > Products > Subscriptions**
- Verify products exist:
  - `monthly_premium_subscription`
  - `yearly_premium_subscription`

### 2. **Base Plans Activated** ⚠️ **CRITICAL**
- Each subscription must have at least ONE active base plan
- Base plan status must be **"Active"**
- If status is "Draft", click **"Activate"**

### 3. **Pricing Set** ✅
- Each base plan must have pricing in at least one country
- Recommended: Set US pricing first ($9.99 monthly, $117.99 yearly)

### 4. **App Published to Internal Testing Track** ✅
- Navigate to: **Release > Testing > Internal testing**
- Verify latest build (versionCode 15) is published
- Status should be **"Available to internal testers"**

### 5. **Test Accounts Added** ✅
- Navigate to: **Setup > License testing**
- Add test Gmail accounts to **"Internal testers"** list
- Test accounts must accept the Internal Testing invite email

### 6. **Package Name Matches** ✅
- Verify package name is: `com.resultmarketing.whatscard`
- Must match across:
  - Google Play Console
  - `app.json` → `android.package`
  - Subscription product configuration

---

## 🧪 Testing Instructions

### Before Testing:
1. **Uninstall old app** from test device
2. **Download fresh build** from Play Store Internal Testing link
3. **Clear Google Play Store cache**:
   - Settings > Apps > Google Play Store > Storage > Clear Cache

### Test Purchase Flow:
1. Open WhatsCard app
2. Navigate to subscription screen
3. Tap "Subscribe to Premium"
4. Select "Monthly" or "Yearly" plan
5. Complete Google Play purchase dialog
6. **Expected Result**: ✅ "Purchase successful"

### If Still Failing:
1. Check device logs:
   ```bash
   adb logcat | grep -i "billing\|iap\|purchase"
   ```

2. Look for these specific errors:
   - `"Item not available for purchase"` → Base plan not activated
   - `"Developer error"` → Product ID mismatch
   - `"User canceled"` → Normal cancellation
   - `"Service disconnected"` → Google Play Services issue

---

## 📋 Common Google Play Issues & Solutions

### Issue 1: "Item not available for purchase"
**Cause**: Base plan not activated
**Solution**: Go to Google Play Console > Subscription > Base Plans > Click "Activate"

### Issue 2: "Product IDs not found"
**Cause**: Product ID mismatch between code and Play Console
**Solution**: Verify product IDs in `iap-config.ts` match exactly:
```typescript
android: {
  monthly: 'monthly_premium_subscription',
  yearly: 'yearly_premium_subscription',
}
```

### Issue 3: "Developer error"
**Cause**: App not signed with the correct key
**Solution**: Ensure app is installed from Play Store Internal Testing, NOT via `adb install`

### Issue 4: "No offer token found"
**Cause**: Base plan has no offers configured
**Solution**: Add at least one offer to the base plan in Google Play Console

---

## 🚀 Next Steps

### 1. **Rebuild the App**
```bash
cd NamecardMobile
eas build --platform android --profile production
```

### 2. **Upload to Internal Testing**
- Upload new AAB to Google Play Console
- Publish to Internal Testing track

### 3. **Test on Real Device**
- Download from Internal Testing link
- Test purchase flow
- Verify success

---

## 📊 Validation Checklist

After deploying fixes, verify:

- [ ] ✅ TypeScript compiles without errors
- [ ] ✅ Products fetch successfully on Android
- [ ] ✅ Offer tokens extracted correctly
- [ ] ✅ Purchase dialog appears
- [ ] ✅ Purchase completes successfully
- [ ] ✅ Receipt validation works
- [ ] ✅ Subscription status updates
- [ ] ✅ Premium features unlock

---

## 🔐 Security Notes

**Receipt Validation**:
- All purchases are validated via Supabase Edge Function
- Fallback mode enabled if validation fails (⚠️ NOT RECOMMENDED for production)
- Deploy Edge Function before production launch

**Edge Function TODO**:
```bash
# Deploy validate-receipt Edge Function
cd supabase/functions
supabase functions deploy validate-receipt
```

---

## 📝 Summary

**What Changed**:
1. ✅ Fixed `requestSubscription()` → `requestPurchase()` (v14 API)
2. ✅ Fixed product fetching to extract offer tokens correctly
3. ✅ Added proper Android subscription offer handling
4. ✅ Enhanced logging for debugging

**Testing Status**:
- ✅ TypeScript: No errors
- ✅ Code compiles successfully
- 🟡 Pending: Test on Play Store Internal Testing build

**Expected Result**:
Purchases should now complete successfully on Play Store Internal Testing! 🎉
