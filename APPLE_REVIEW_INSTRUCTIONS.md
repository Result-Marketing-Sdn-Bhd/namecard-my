# Apple App Review - Account Deletion Instructions

**App Name:** WhatsCard
**Version:** 2.0.4
**Build:** 11
**Date:** December 10, 2025

---

## 📱 How to Access Account Deletion Feature

### Step-by-Step Instructions for Review Team:

1. **Launch WhatsCard app**

2. **Sign in with test account** (credentials provided separately)

3. **Navigate to Profile/Settings:**
   - Tap the **"Profile"** icon in the bottom navigation bar
   - OR tap the **"Settings"** menu option

4. **Scroll to bottom of Profile screen**

5. **Locate "Delete Account" button:**
   - It appears at the bottom of the settings list
   - Displayed in **RED text** with a trash icon 🗑️
   - Labeled: **"Delete Account"**

6. **Test deletion flow:**
   - Tap "Delete Account"
   - **First Warning Dialog** appears showing:
     - What will be deleted (contacts, cards, subscription, etc.)
     - Warning that action cannot be undone
   - Tap "Delete" to proceed
   - **Second Confirmation Dialog** appears
   - Tap "I Understand, Delete My Account" to confirm
   - Account and all data are **permanently deleted**
   - User is **automatically signed out**
   - Success message appears

---

## ✅ What Gets Deleted

When a user deletes their account, the following data is **permanently removed**:

- ✅ All scanned business cards and contacts
- ✅ All groups and contact organizations
- ✅ Voice notes and reminders
- ✅ Subscription information
- ✅ Scan limits and usage data
- ✅ User authentication record

**This deletion is immediate and irreversible.**

---

## 🔐 Technical Implementation

- **Frontend:** `ProfileScreen.tsx` - Delete Account button with double confirmation
- **Backend:** Supabase database function `delete_user_account()`
- **Security:** Uses Row Level Security (RLS) policies
- **Sign Out:** Automatic after successful deletion

---

## 📸 Visual Reference

**Location in App:**
```
Bottom Navigation → Profile → Scroll to Bottom → "Delete Account" (Red)
```

**Button Appearance:**
- Icon: 🗑️ Trash icon
- Text: "Delete Account" in RED (#DC2626)
- Position: Bottom of settings list

---

## 🧪 Test Accounts

Please use the provided test accounts to verify the deletion functionality. Each account can be deleted and will permanently remove all associated data.

---

## 📞 Support Contact

For any questions during review:
- Developer: Result Marketing SDN BHD
- Support Email: ngsanzen@gmail.com

---

**Thank you for reviewing WhatsCard!** 🙏

We have implemented all required features including comprehensive account deletion as per App Store guidelines.
