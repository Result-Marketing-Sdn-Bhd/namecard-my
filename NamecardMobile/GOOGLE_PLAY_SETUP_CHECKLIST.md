# ✅ Google Play Console Setup Checklist

**Critical checklist for WhatsCard Android IAP to work in Internal Testing**

---

## 🎯 Step 1: Verify Subscription Products

### Navigate to:
**Monetization > Products > Subscriptions**

### Check:
- [ ] `monthly_premium_subscription` exists
- [ ] `yearly_premium_subscription` exists
- [ ] Both products have status: **Active** (NOT Draft)

### If products are missing:
1. Click **"Create subscription"**
2. Product ID: `monthly_premium_subscription`
3. Name: "WhatsCard Premium Monthly"
4. Description: "Premium features for WhatsCard"
5. Click **"Create"**

---

## 🎯 Step 2: Activate Base Plans

### For EACH subscription product:

1. Click on the subscription product
2. Navigate to **"Base plans"** tab
3. **CRITICAL**: Click **"Activate"** on at least ONE base plan

### Base Plan Configuration:
- **Billing Period**: Monthly (for monthly) / 1 Year (for yearly)
- **Price**: Set pricing for at least one country
  - US: $9.99 (monthly) / $117.99 (yearly)
- **Auto-renewal**: Enabled
- **Grace period**: 3 days (recommended)
- **Status**: Must be **"Active"**

### ⚠️ **Common Mistake**:
If base plans are in "Draft" status, purchases will fail with:
```
"Item not available for purchase"
```

**Fix**: Click the **"Activate"** button!

---

## 🎯 Step 3: Set Pricing

### For EACH base plan:

1. Click **"Set pricing"**
2. Select countries (or "All countries")
3. Set prices:
   - **Monthly**: $9.99 USD
   - **Yearly**: $117.99 USD
4. Click **"Apply prices"**
5. Click **"Save"**

---

## 🎯 Step 4: Verify Package Name

### Navigate to:
**App information > App details**

### Verify:
- [ ] Package name: `com.resultmarketing.whatscard`

### Match with code:
Check `app.json`:
```json
"android": {
  "package": "com.resultmarketing.whatscard"
}
```

**Must be EXACTLY the same!**

---

## 🎯 Step 5: Publish to Internal Testing

### Navigate to:
**Release > Testing > Internal testing**

### Check:
- [ ] Latest build uploaded (versionCode 15)
- [ ] Status: **"Available to internal testers"**
- [ ] At least ONE tester added

### If no build is published:
1. Click **"Create new release"**
2. Upload AAB file
3. Add release notes
4. Click **"Review release"**
5. Click **"Start rollout to Internal testing"**

---

## 🎯 Step 6: Add Test Accounts

### Navigate to:
**Setup > License testing**

### Add Internal Testers:
1. Click **"Internal testing"** tab
2. Click **"Create email list"** (if not exists)
3. Add test Gmail accounts (one per line)
4. Click **"Save changes"**

### Test Account Requirements:
- ✅ Must be a real Gmail account
- ✅ Must accept the Internal Testing invite email
- ✅ Must download app from Internal Testing link (NOT via adb)

---

## 🎯 Step 7: Configure License Testing (Optional)

### Navigate to:
**Setup > License testing > License testers**

### Add Test Accounts:
1. Add the same Gmail accounts as license testers
2. Set license response: **"RESPOND_NORMALLY"**
3. Click **"Save changes"**

**Why**: This allows you to test purchases without being charged.

---

## 🧪 Testing Checklist

### Before Testing:
- [ ] Uninstall old app from device
- [ ] Clear Google Play Store cache
- [ ] Download app from Internal Testing link
- [ ] Sign in with test account on device

### During Testing:
1. Open WhatsCard app
2. Navigate to Subscription/Paywall screen
3. Tap "Subscribe to Premium"
4. Select Monthly or Yearly plan
5. **Expected**: Google Play purchase dialog appears
6. Complete purchase
7. **Expected**: "Purchase successful" message

### If purchase fails:
- Check device logs: `adb logcat | grep -i billing`
- Verify base plans are **Active** (not Draft)
- Verify test account is added to Internal Testers
- Verify app was downloaded from Play Store (not adb)

---

## 🔍 Common Errors & Solutions

### Error: "Item not available for purchase"
**Cause**: Base plan not activated
**Solution**: Go to subscription product > Base plans > Click "Activate"

### Error: "This item is not available in your country"
**Cause**: No pricing set for test device's country
**Solution**: Add pricing for "All countries" or specific country

### Error: "Developer error"
**Cause**: App signature mismatch
**Solution**: Ensure app is downloaded from Play Store Internal Testing, NOT installed via `adb install`

### Error: "Authentication is required"
**Cause**: Not signed into test account
**Solution**: Sign out and sign in with test Gmail account on device

### Error: "This version of the app is not configured for billing"
**Cause**: App uploaded to wrong track
**Solution**: Upload AAB to Internal Testing track specifically

---

## 🎯 Step 8: Verify IAP Configuration

### In Google Play Console:

1. Go to **App information > App content**
2. Scroll to **"In-app purchases"**
3. Check: "Does your app contain in-app purchases?" → **YES**

---

## 🚀 Quick Verification Script

Use this to verify everything is set up:

### 1. Check Products:
- Go to: Monetization > Products > Subscriptions
- Verify: 2 products, both Active

### 2. Check Base Plans:
- Click each product
- Verify: At least 1 base plan with status "Active"

### 3. Check Pricing:
- Click each base plan
- Verify: Pricing set for at least one country

### 4. Check Internal Testing:
- Go to: Release > Testing > Internal testing
- Verify: Latest build published

### 5. Check Testers:
- Go to: Setup > License testing
- Verify: Test Gmail accounts added

---

## 📊 Final Checklist

Before testing purchases:

- [ ] ✅ Subscription products created (2 products)
- [ ] ✅ Base plans activated (status: Active)
- [ ] ✅ Pricing set for US (and other countries)
- [ ] ✅ Package name matches: `com.resultmarketing.whatscard`
- [ ] ✅ Build uploaded to Internal Testing
- [ ] ✅ Test Gmail accounts added to Internal Testers
- [ ] ✅ App downloaded from Play Store Internal Testing link
- [ ] ✅ Device signed in with test Gmail account
- [ ] ✅ Play Store cache cleared
- [ ] ✅ Old app uninstalled

**If ALL items are checked ✅, purchases should work!** 🎉

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check device logs**:
   ```bash
   adb logcat | grep -i "IAP Service\|Billing\|Purchase"
   ```

2. **Verify base plan activation**:
   - Most common issue: Base plans in "Draft" status
   - Solution: Click "Activate" button

3. **Verify test account**:
   - Sign out of device
   - Sign in with test Gmail account
   - Download app fresh from Internal Testing link

4. **Verify product IDs**:
   - In `iap-config.ts`, check:
   ```typescript
   android: {
     monthly: 'monthly_premium_subscription',
     yearly: 'yearly_premium_subscription',
   }
   ```
   - Must match EXACTLY with Google Play Console product IDs

5. **Rebuild app**:
   ```bash
   eas build --platform android --profile production
   ```
   - Upload new build to Internal Testing

---

**Good luck! The purchase flow should now work perfectly! 🚀**
