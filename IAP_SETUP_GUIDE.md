# WhatsCard - In-App Purchase Setup Guide

**Date:** 2025-01-09
**Issue:** App Store rejection - IAP products not registered
**Status:** In Progress

---

## 🔴 Problem

App was rejected by Apple because the in-app purchase product IDs referenced in the code were not registered in App Store Connect.

---

## ✅ Solution Summary

### Step 1: Updated Product IDs in Code

**File Updated:** `NamecardMobile/config/iap-config.ts`

**Old Product IDs (already taken):**
- `monthly_premium_subscription`
- `yearly_premium_subscription`

**NEW Product IDs (unique):**
- `whatscard_premium_monthly`
- `whatscard_premium_yearly`

**Code Change (Line 47-56):**
```typescript
PRODUCTS: {
  ios: {
    monthly: 'whatscard_premium_monthly',  // NEW: Unique monthly subscription
    yearly: 'whatscard_premium_yearly',    // NEW: Unique yearly subscription
  },
  android: {
    monthly: 'whatscard_premium_monthly',  // Product ID from Google Play
    yearly: 'whatscard_premium_yearly',    // Product ID from Google Play
  },
},
```

---

## 📋 App Store Connect Setup

### Subscription Group
- **Name:** Premium Access
- **Reference Name:** premium_access

### Monthly Subscription

| Field | Value |
|-------|-------|
| **Product ID** | `whatscard_premium_monthly` |
| **Reference Name** | WhatsCard Monthly Premium |
| **Duration** | 1 Month |
| **Price (USD)** | $9.99 |
| **Display Name** | WhatsCard Premium Monthly |
| **Description** | Unlimited scans, AI OCR, WhatsApp & cloud sync |

**Review Notes:**
```
Test Subscription Information:

This app uses react-native-iap for in-app purchases.

Product IDs:
- Monthly: whatscard_premium_monthly ($9.99/month)
- Yearly: whatscard_premium_yearly ($117.99/year)

To test:
1. Tap "Upgrade to Premium" on the home screen
2. Select a subscription plan
3. Complete purchase with sandbox account
4. Premium features will unlock (unlimited scans, AI OCR, cloud sync)

Note: We are using Apple's sandbox environment for testing.
```

---

### Yearly Subscription

| Field | Value |
|-------|-------|
| **Product ID** | `whatscard_premium_yearly` |
| **Reference Name** | WhatsCard Yearly Premium |
| **Duration** | 1 Year |
| **Price (USD)** | $117.99 |
| **Display Name** | WhatsCard Premium Yearly |
| **Description** | Best value - Save 20% with all premium features |

**Review Notes:** (Same as monthly - paste the same text above)

---

## 🎯 Next Steps

### In App Store Connect:

- [ ] Create Monthly subscription with product ID `whatscard_premium_monthly`
- [ ] Create Yearly subscription with product ID `whatscard_premium_yearly`
- [ ] Submit both subscriptions for review
- [ ] Go to app submission page
- [ ] Add both products to "In-App Purchases" section
- [ ] Reply to Apple's rejection message
- [ ] Resubmit app for review

### Reply to Apple Rejection:

```
Dear App Review Team,

Thank you for your feedback. I have now registered the following in-app purchase products in App Store Connect:

1. whatscard_premium_monthly - WhatsCard Monthly Premium ($9.95/month)
2. whatscard_premium_yearly - WhatsCard Yearly Premium ($117.99/year)

Both products are now available and submitted for review in the Premium Access subscription group. Please re-evaluate the app.

Best regards
```

---

## 📱 App Configuration

**Bundle ID:** com.alittlebetter.alittlebetter
**App ID:** 6754809694
**Subscription Group:** Premium Access (21821977)

**Package:** react-native-iap v14.4.38
**Mock Mode:** false (production mode)

---

## 🔧 Technical Details

### Files Modified:
1. `NamecardMobile/config/iap-config.ts` - Updated product IDs

### Pricing Configuration:
- **Monthly:** $9.99 USD per month
- **Yearly:** $117.99 USD per year (18% savings)
- **Promo Code WHATSBNI:** 70% off yearly = $35.40

### Premium Features:
- Unlimited card scans
- AI-powered OCR (Gemini API)
- WhatsApp quick connect
- Voice notes & reminders
- Export to Excel
- Cloud sync (Supabase)
- Priority support
- Ad-free experience

---

## ⚠️ Important Notes

1. **Product IDs MUST match exactly** between code and App Store Connect
2. **Both subscriptions must be submitted for review** before resubmitting app
3. **Tax Category:** Set to "Match to parent app"
4. **Screenshots and Images:** Optional, can be added later
5. **After approval:** Products will appear in production within 24 hours

---

## 🚀 Testing After Setup

### Using Sandbox Tester:
1. Create sandbox tester account in App Store Connect
2. Sign out of real Apple ID on device
3. Build and install app on test device
4. Attempt to purchase subscription
5. Sign in with sandbox tester when prompted
6. Verify subscription activates premium features

---

## 📞 Support

If issues persist:
- Check App Store Connect for product status
- Verify product IDs match exactly
- Ensure subscriptions are "Ready to Submit" or "In Review"
- Check app's "In-App Purchases" section includes both products

---

**Last Updated:** 2025-01-09
**Next Review:** After Apple re-evaluation
