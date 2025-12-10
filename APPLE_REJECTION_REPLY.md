# Reply to Apple App Review Rejection

**App Name:** WhatsCard
**Version:** 2.0.4
**Build:** 11
**Date:** December 10, 2025

---

## Message to Apple Review Team

Dear App Review Team,

Thank you for your detailed feedback. I have resolved all three issues identified in your rejection:

### 1. App Tracking Transparency / Privacy Labels ✅

**Issue:** App declared tracking data without implementing ATT framework.

**Resolution:** I have updated the App Privacy information in App Store Connect to accurately reflect that **WhatsCard does NOT track users for advertising purposes**.

The data we collect (contact information, email, business cards, purchase history) is used **solely for app functionality and subscription management**, not for tracking or advertising.

All privacy labels have been corrected to reflect this.

---

### 2. In-App Purchase Products Not Submitted ✅

**Issue:** IAP products were not properly submitted with the app.

**Resolution:** I have now completed the following:
- ✅ Added review screenshots to both subscription products
- ✅ Linked both products (`whatscard_premium_monthly` and `whatscard_premium_yearly`) to this app version (2.0.4)
- ✅ Submitted both subscription products for review

The IAP products are now fully configured and ready for testing with sandbox accounts.

---

### 3. Account Deletion Not Implemented ✅

**Issue:** App allows account creation but didn't provide account deletion option.

**Resolution:** I have **fully implemented** an account deletion feature that is accessible directly within the app.

#### How to Access Account Deletion:

**Path:** Bottom Navigation → **Profile** → Scroll to Bottom → **"Delete Account"** (displayed in red)

**Step-by-Step:**
1. Open WhatsCard app
2. Tap **"Profile"** in the bottom navigation bar
3. Scroll to the bottom of the settings list
4. Locate **"Delete Account"** button (red text with trash icon 🗑️)
5. Tap to initiate deletion
6. **First confirmation dialog** explains what will be deleted
7. **Second confirmation dialog** requires explicit consent
8. Account and **ALL associated data** are permanently deleted
9. User is automatically signed out

#### What Gets Deleted:
- ✅ All contacts and business cards
- ✅ All groups and contact organizations
- ✅ Voice notes and reminders
- ✅ Subscription information
- ✅ Scan limits and usage data
- ✅ User authentication record

**The deletion is immediate, permanent, and irreversible** as required by App Store guidelines.

**Technical Implementation:**
- Frontend: Double confirmation dialog flow
- Backend: Supabase database function with Row Level Security
- Result: Complete data removal + automatic sign-out

---

## Build Information

**New Build Submitted:** Build #11 (Version 2.0.4)

This build includes:
- ✅ Stable IAP implementation (react-native-iap v12.15.3)
- ✅ Complete account deletion feature
- ✅ Updated privacy declarations
- ✅ All IAP products properly configured

---

## Test Instructions

For your convenience, I have prepared detailed testing instructions for the account deletion feature. The feature is easily accessible and fully functional.

If you need any additional information or have questions during testing, please don't hesitate to contact me.

---

Thank you for your patience and thorough review. All issues have been addressed, and the app is now fully compliant with App Store guidelines.

Best regards,
Result Marketing SDN BHD
WhatsCard Development Team

---

**Support Contact:** ngsanzen@gmail.com
