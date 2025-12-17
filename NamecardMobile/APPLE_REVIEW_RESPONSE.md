# Response to Apple Review - Guideline 5.1.2

## Issue Raised by Apple

> **Guideline 5.1.2 - Legal - Privacy - Data Use and Sharing**
>
> The app accesses user data from the device but does not have the required precautions in place. Specifically, the app uploads the user's Contact to a server, but the app does not inform the user and request their consent first.

## ✅ RESOLVED - Changes Made

We have implemented a comprehensive **Data Consent Screen** that fully complies with Apple's Guideline 5.1.2.

### What We Fixed:

1. **✅ Explicit Consent Request**
   - Users now see a detailed consent screen **before** any contact data is accessed or uploaded
   - The screen appears immediately after the splash screen on first launch
   - Users must explicitly tap "I Agree" to proceed

2. **✅ Clear Data Collection Disclosure**
   - **What we collect**: Contact names, phone numbers, emails, company info, business card images
   - **Where it goes**: Securely stored on Supabase server (encrypted)
   - **Why we need it**: Sync across devices, backup, contact management
   - **What we do with it**: Store contacts, enable search, provide backup - NEVER sell or share

3. **✅ User Rights Explained**
   - Users can delete their data anytime
   - Users can export their data
   - Users can revoke consent in Settings
   - Users can use the app offline (data stays on device only)

4. **✅ Privacy Policy & Terms Links**
   - Links to full Privacy Policy included
   - Links to Terms of Service included

5. **✅ User Choice Respected**
   - Users can decline consent and still use basic features
   - If declined, app operates in offline-only mode
   - Clear explanation of limited functionality when declined

