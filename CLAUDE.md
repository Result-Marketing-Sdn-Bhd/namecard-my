# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Immutable App Identifiers

**⚠️ THESE IDENTIFIERS ARE PERMANENTLY LOCKED - NEVER CHANGE THEM! ⚠️**

### **1. Subscription Product IDs**

#### **Google Play (Android) - Package: com.whatscard.app**
```typescript
// ❌ IMMUTABLE - Cannot be changed without new app submission
PRODUCTS: {
  android: {
    monthly: 'monthly_premium_subscription',
    yearly: 'yearly_premium_subscription',
  }
}
```

#### **App Store (iOS) - Bundle: com.whatscard.app**
```typescript
// ❌ IMMUTABLE - Cannot be changed without new app submission
PRODUCTS: {
  ios: {
    monthly: 'monthly_premium_subscription',
    yearly: 'yearly_premium_subscription',
  }
}
```

**Why These Product IDs Are IMMUTABLE:**
1. **Google Play/App Store**: Once created, Product IDs CANNOT be deleted or renamed
2. **User Purchases**: Existing subscribers are linked to these IDs forever
3. **Code References**: Changing IDs requires updating code + new AAB/IPA upload
4. **Revenue Tracking**: Historical revenue data is tied to these IDs

**What You CAN Change (Without Code Changes):**
- ✅ Subscription prices (RM 199 → RM 149)
- ✅ Free trial duration (3 days → 7 days)
- ✅ Offer terms and conditions
- ✅ Localized names and descriptions
- ✅ Availability (countries/territories)

**What REQUIRES Code Changes + Re-upload:**
- ❌ Product IDs (monthly_premium_subscription → monthly_v2)
- ❌ Adding new tiers (adding 'lifetime' subscription)
- ❌ Package/Bundle ID changes

**File Locations Using These IDs:**
```
NamecardMobile/
├── config/iap-config.ts         ← Product IDs defined here
├── config/iap-android.ts         ← Android config
├── config/iap-ios.ts             ← iOS config
├── services/iapService.ts        ← Purchase logic
└── hooks/useSubscription.ts      ← Subscription hook
```

---

### **2. Package Names & Bundle Identifiers**

#### **Android Package Name (IMMUTABLE)**
```
Package: com.whatscard.app
```
**This CANNOT be changed after first Google Play upload!**

#### **iOS Bundle Identifier (IMMUTABLE)**
```
Bundle ID: com.whatscard.app
App ID: 6754809694
```
**This CANNOT be changed after first App Store upload!**

---

### **3. Android Keystore (IMMUTABLE)**

```
SHA-1: BD:10:12:2C:87:05:7A:45:3F:6E:F1:2F:51:EB:FB:84:28:0B:77:5F
Key Alias: c90c9e3fc4759b4ccac8f5f02db96e87
Package: com.whatscard.app
Location: Expo Dashboard → com.whatscard.app package
Backup: C:\Users\walte\Documents\WhatsCard\Keystores\whatscard-production.jks
```

**This keystore MUST be used for ALL Android builds forever!**

**Keystore Location:**
```
Expo Dashboard: https://expo.dev/accounts/jacobai/projects/namecard-my/credentials
Application: com.whatscard.app ✅ CORRECT PACKAGE
Backup: C:\Users\walte\Documents\WhatsCard\Keystores\whatscard-production.jks
```

---

### **Why These Identifiers Are IMMUTABLE:**

1. **Google Play Lock**: First upload locks package name AND keystore fingerprint forever
2. **App Store Lock**: First upload locks bundle identifier forever
3. **Cannot Change**: Changing any requires publishing a COMPLETELY NEW APP
4. **User Impact**: Existing users cannot update if identifiers change
5. **Revenue Loss**: Lose all reviews, downloads, subscriptions, revenue history

### **How to Ensure Consistency:**

1. ✅ **ALWAYS verify** package name in app.json = `com.whatscard.app`
2. ✅ **ALWAYS check** Expo dashboard uses keystore SHA-1: `BD:10:12...`
3. ✅ **BACKUP keystore** to: `C:\Users\walte\Documents\WhatsCard\Keystores\`
4. ✅ **NEVER delete** keystore from Expo dashboard
5. ✅ **NEVER change** package/bundle IDs in app.json

**🔒 CHANGING ANY OF THESE IDENTIFIERS = APP BREAKS FOR ALL EXISTING USERS! 🔒**
**🔒 LOSING THE KEYSTORE = LOSING ACCESS TO GOOGLE PLAY APP FOREVER! 🔒**

---

## 🎟️ PROMO CODES: STORE-ONLY APPROACH (NO APP UPDATES NEEDED)

**IMPLEMENTATION: Store Console Only - Promo codes managed in App Store Connect & Google Play Console**

### **How It Works:**

WhatsCard uses a **Store-Only** promo code approach, meaning:
- ✅ Users enter promo codes **during checkout** in the App Store or Play Store
- ✅ **No app code changes** needed when you add/modify promo codes
- ✅ **No app updates** required to activate new promotional offers
- ✅ **Unlimited promo codes** can be created without developer involvement

### **User Experience:**

1. User opens PaywallScreen and sees subscription plans
2. User sees instruction: "Have a promo code? Enter it at checkout in the App Store or Play Store to get your discount!"
3. User taps "Start Free Trial" or "Subscribe Now"
4. App Store/Play Store checkout opens
5. User enters promo code in the store's checkout UI
6. Store applies discount automatically
7. User completes purchase with discounted price

### **App Implementation:**

**Files Modified (v1.0.1+):**
- `PaywallScreen.tsx` - Removed promo code input field, added store instruction
- `iapService.ts` - Removed `promoCode` parameter from `purchaseSubscription()`
- `useSubscription.ts` - Removed `promoCode` parameter from hook interface
- `subscription-utils.ts` - Removed `promoCode` from `simulatePurchase()`

**What the App Does:**
- Shows pricing plans (monthly/yearly)
- Calls `iapService.purchaseSubscription(plan)` with NO promo code parameter
- react-native-iap opens the native store checkout
- Store handles promo code entry and discount calculation
- App receives purchase confirmation with final price paid

**What the App Does NOT Do:**
- ❌ Does not validate promo codes in app
- ❌ Does not show discounted prices before checkout
- ❌ Does not apply discounts in app logic
- ❌ Does not need to be updated when new promo codes are added

### **How to Add New Promo Codes:**

#### **iOS (App Store Connect):**

1. Go to App Store Connect → My Apps → WhatsCard
2. Navigate to Features → Subscriptions → Subscription Group
3. Select the subscription product (monthly or yearly)
4. Click "Subscription Prices" → "Create Promotional Offer"
5. Enter:
   - **Offer Code**: e.g., "SUMMER2025" (user-facing code)
   - **Discount Type**: Percentage or Fixed Price
   - **Discount Amount**: e.g., 70% off
   - **Duration**: e.g., "Ongoing" or "Limited Time"
   - **Eligibility**: New subscribers, lapsed subscribers, or all users
6. Click "Save" → Offer is live immediately (no app update!)

#### **Android (Google Play Console):**

1. Go to Play Console → WhatsCard → Monetize → Subscriptions
2. Select the subscription product
3. Click "Manage Offers" → "Create Offer"
4. Enter:
   - **Offer ID**: e.g., "SUMMER2025"
   - **Promo Code**: e.g., "SUMMER2025"
   - **Discount Type**: Percentage or Fixed Price
   - **Discount Amount**: e.g., 70% off
   - **Duration**: e.g., "Forever" or "First X months"
   - **Eligibility**: New subscribers or eligible users
5. Click "Save" → Offer is live immediately (no app update!)

### **Example Promo Codes (Documented in Config Files):**

**WHATSBNI:**
- **Discount**: 70% off
- **Applies To**: Yearly Premium subscription only
- **Final Price**: $36.00/year (was $119.99)
- **Setup**: Created in both App Store Connect and Google Play Console
- **Status**: Active

**Note:** Config files (`iap-config.ts`, `iap-android.ts`, `iap-ios.ts`) document promo codes for reference only. They do NOT affect app functionality.

### **Benefits of Store-Only Approach:**

1. **🚀 Instant Activation**: Create promo codes and they work immediately
2. **💰 No App Updates**: Save time and money on development/testing/deployment
3. **🎯 Flexible Marketing**: Create limited-time offers without code changes
4. **📊 Store Analytics**: Track promo code usage directly in store dashboards
5. **🔒 Store-Managed Security**: Apple/Google handle validation and fraud prevention
6. **♾️ Unlimited Codes**: Create as many promo codes as you need

### **Legacy Code (Deprecated):**

**Previous Implementation (v1.0.0 and earlier):**
- PaywallScreen had promo code input field
- `purchaseSubscription(plan, promoCode)` accepted promo code parameter
- Android used `offerToken` parameter (incorrect implementation)
- iOS promotional offers not implemented

**Migration Notes:**
- All app-level promo code handling has been removed in v1.0.1+
- Promo code validation functions remain in `subscription-utils.ts` for documentation purposes but are not used
- The `PROMO_CODES` object in `iap-config.ts` is kept for documentation only

### **Testing Promo Codes:**

**iOS (App Store Sandbox):**
1. Create a sandbox test account in App Store Connect
2. Sign out of App Store on test device
3. Open app and go to PaywallScreen
4. Tap subscribe button → App Store checkout opens
5. Sign in with sandbox account
6. Enter promo code in checkout UI
7. Verify discount is applied before completing purchase

**Android (Google Play Billing Test):**
1. Add test account email to Play Console → Setup → License Testing
2. Ensure device is signed in with test account
3. Open app and go to PaywallScreen
4. Tap subscribe button → Play Store checkout opens
5. Enter promo code in checkout UI
6. Verify discount is applied before completing purchase

**Mock Mode Testing:**
- Set `IAP_CONFIG.MOCK_MODE = true` in `iap-config.ts`
- Promo codes not tested in mock mode (store-managed)
- Mock mode useful for UI/flow testing only

---

## 🚨 CRITICAL: GOOGLE PLAY PHOTO/VIDEO PERMISSIONS POLICY (2024-2025)

**⚠️ REQUIRED: Declare Photo/Video Permission Usage**

When uploading to Google Play Console, you MUST justify these permissions:
- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO`

### **What to Write in Google Play Console:**

**For READ_MEDIA_IMAGES:**
```
WhatsCard's core functionality requires frequent access to camera and photo library for business card scanning. Users scan business cards multiple times per session, and the app immediately processes images with AI-powered OCR to extract contact information. The Android Photo Picker cannot be used because our app requires real-time camera access and immediate image processing for the scanning workflow. Images are stored in the user's device and cloud storage for contact management.
```

**For READ_MEDIA_VIDEO:**
```
This permission is required by the expo-camera library for full camera functionality. While WhatsCard primarily scans photos (business cards), the camera module requires video capability for optimal image capture and focus control. Video permission ensures camera hardware operates correctly across all Android devices.
```

### **Why These Permissions Exist:**
1. `expo-camera` plugin automatically adds READ_MEDIA_IMAGES
2. `expo-media-library` plugin adds READ_MEDIA_VIDEO
3. Core feature = business card scanning = frequent photo access
4. Cannot use Android Photo Picker (requires real-time camera)

**Google Play will approve this because scanning is your PRIMARY feature!**

---

## Project Overview

WhatsCard 1.0 is a React Native/TypeScript smart networking app focused on business card scanning and contact management with WhatsApp integration. Built with offline-first architecture and Supabase backend.

## ⚠️ CRITICAL: Version Locking for Expo SDK 53 (2025+)

**MANDATORY - NEVER DEVIATE FROM THESE VERSIONS:**

```json
{
  "expo": "~53.0.0",              // LOCKED - Do not upgrade
  "react": "19.0.0",              // LOCKED - Expo SDK 53 requires React 19
  "react-native": "0.79.6",       // LOCKED - Expo SDK 53 requires RN 0.79

  // ❌ NEVER USE expo-in-app-purchases (DEPRECATED in SDK 53!)
  // ✅ USE react-native-iap instead (free, no fees!)
  "react-native-iap": "12.15.4",  // LOCKED - Works with SDK 53, free, no RevenueCat fees

  // Gradle (Android Build)
  "gradle": "8.10.2",             // LOCKED - Compatible with Java 17-21 (NOT 9.0, NOT 8.13)
}
```

**WHY THESE VERSIONS:**

1. **expo-in-app-purchases**: REMOVED from Expo SDK 53 (causes build failures!)
2. **react-native-iap**: Official replacement, uses Google Play Billing v6 & StoreKit, FREE
3. **Gradle 8.10.2**: Works with Java 17-21, NOT compatible with Java 24
4. **Gradle 9.0**: Causes build errors with Android Gradle Plugin (avoid!)

**WHEN CLAUDE CODE SUGGESTS PACKAGE CHANGES:**
- ❌ DO NOT install any package not explicitly listed in package.json
- ❌ DO NOT upgrade Expo SDK without full regression testing
- ✅ ONLY use `npx expo install [package]` (auto-selects compatible versions)

**CRITICAL: react-native-iap Configuration (android/app/build.gradle):**
```gradle
// REQUIRED for react-native-iap to work (solves variant ambiguity)
defaultConfig {
    // ... other config
    missingDimensionStrategy 'store', 'play'  // Use Google Play variant
}

flavorDimensions "store"
productFlavors {
    play {
        dimension "store"
        // Google Play Store variant (required)
    }
}
```

**WHY:** react-native-iap provides both Amazon & Google Play variants. Without this config, Gradle build fails with "variant ambiguity" error.

---

## Architecture

### Current State (v1.0.0)
- **Platform**: React Native + Expo SDK 53
- **Backend**: Supabase (authentication, database, cloud storage)
- **Database**: Supabase PostgreSQL with RLS policies
- **State Management**: Custom hooks with offline-first LocalStorage
- **OCR**: Google Gemini AI for business card scanning
- **Voice**: OpenAI Whisper for voice notes
- **Storage**: Supabase Storage for card images
- **Styling**: Custom React Native components
- **Data**: LocalStorage with Supabase sync (offline-first)
- **IAP**: react-native-iap 12.15.4 (FREE - no RevenueCat fees!)

## Code Structure

### NamecardMobile/ (React Native App)
```
NamecardMobile/
├── App.tsx                    # Main app component with navigation
├── index.ts                   # App entry point
├── app.json                   # Expo static configuration
├── app.config.js              # Expo dynamic config with env vars
├── metro.config.js            # Metro bundler configuration (optimized)
├── jest.config.js             # Jest testing configuration
├── jest.setup.js              # Test setup and mocks
├── tsconfig.json              # TypeScript configuration
│
├── components/                # UI Components (reorganized)
│   ├── screens/              # Main screen components
│   │   ├── AuthScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── ContactList.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── APITestScreen.tsx
│   │   ├── SplashScreen.tsx
│   │   └── index.ts          # Screen exports
│   ├── business/             # Business logic components
│   │   ├── ContactDetailModal.tsx
│   │   ├── ContactForm.tsx
│   │   ├── FloatingActionButton.tsx
│   │   └── index.ts          # Business component exports
│   ├── common/               # Reusable UI components
│   │   ├── .tsx
│   │   ├── TopLoader.tsx
│   │   └── index.ts          # Common component exports
│   └── navigation/           # Navigation components
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts           # Authentication hook
│   ├── useContacts.ts       # Contact management with offline sync
│   ├── useCamera.ts         # Camera permissions and capture
│   └── index.ts             # Hook exports
│
├── services/                # External service integrations
│   ├── supabase.ts          # Supabase client configuration
│   ├── contactService.ts    # Contact CRUD operations
│   ├── geminiOCR.ts         # Gemini AI for OCR
│   ├── googleVision.ts      # Google Vision API (deprecated)
│   ├── openai.ts            # OpenAI for voice transcription
│   └── localStorage.ts      # AsyncStorage wrapper
│
├── config/                  # App configuration
│   └── environment.ts       # Environment variable management
│
├── utils/                   # Utility functions
│   ├── helpers/            # Helper functions
│   └── constants/          # App constants
│
├── types/                   # TypeScript type definitions
│   └── index.d.ts
│
├── __tests__/              # Test files
│   ├── test-utils.tsx      # Testing utilities and mocks
│   ├── hooks/              # Hook tests
│   │   ├── useAuth.test.ts
│   │   └── useContacts.test.ts
│   ├── components/         # Component tests
│   │   └── ContactCard.test.tsx
│   └── auth/               # Authentication tests
│
├── __mocks__/              # Jest mocks
│   └── svgMock.js
│
├── assets/                 # Static assets
│   ├── icon/
│   ├── splash/
│   └── fonts/
│
├── .env.development        # Development environment vars
├── .env.staging            # Staging environment vars
├── .env.production         # Production environment vars
└── .env.example            # Environment variables template
```

## Key Features

### Core Functionality (Free Tier)
- Business card OCR scanning
- Contact management (add, edit, delete, search)
- WhatsApp integration for networking
- Excel export functionality

### Premium Features (Pro/Enterprise Tiers)
- Follow-up reminders with smart filtering
- Voice notes with AI transcription
- Advanced analytics and reporting
- Team collaboration features

## Development Commands

**All commands should be run from the `NamecardMobile/` directory**

```bash
# Development
npm start              # Start Expo development server
npm run start:clear    # Start with cache clear (recommended)
npm run web            # Run in web browser

# Cleaning & Maintenance
npm run clean          # Clear Metro bundler cache
npm run clean:all      # Complete cleanup and reinstall
npm run doctor         # Check environment health
npm run deps:check     # Check for outdated dependencies
npm run deps:update    # Update all dependencies

# Testing
npm test               # Run Jest unit tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate test coverage report
npm run test:debug     # Debug tests with Node inspector

# Code Quality
npm run lint           # ESLint code checking
npm run lint:fix       # Auto-fix linting issues
npm run type:check     # TypeScript type checking
npm run format         # Prettier code formatting
npm run format:check   # Check code formatting

# Building
npm run prebuild       # Generate native code
npm run prebuild:clean # Clean and regenerate native code

# Shortcuts
npm run dev            # Alias for start:clear
```

### Quick Start Workflow

```bash
# First time setup
cd NamecardMobile
npm install
npm run doctor          # Verify environment

# Daily development
npm run start:clear     # Start dev server (press 'a' for Android or 'i' for iOS)

# Before committing
npm run type:check
npm run lint:fix
npm test
```

## Business Model

### Subscription Tiers
- **Free** ($0): Basic OCR and contact management
- **Pro** (RM199/year): + reminders, voice notes, AI features
- **Enterprise** (RM599/year): + analytics, team features, priority support

### Distributor Network
- Global distributor system with commission tracking
- 50% discount codes generate distributor profits
- Automated payout and withdrawal management

## Development Approach

### Testing Strategy (TDD)
- **Unit Tests** (70%): Individual functions and components
- **Integration Tests** (20%): Component interactions and API integrations  
- **End-to-End Tests** (10%): Complete user workflows
- Target: 90%+ test coverage

### Database Schema
Uses Supabase PostgreSQL with 5 main tables:
- `users` (authentication + profile + subscription)
- `contacts` (business cards + networking data)
- `distributors` (partner network)
- `transactions` (all financial records)
- `pricing` (dynamic pricing control)

## Key Implementation Notes

- **Contact State**: All contact data stored in React state (`contacts` array in App.tsx)
- **Screen Navigation**: Simple string-based routing in main App component
- **Premium Features**: Gated behind `isPremiumUser` state flag
- **Mock Data**: Currently uses hardcoded sample contacts for prototyping
- **Component Pattern**: Props-based communication between parent App and child components

## Development Priorities

1. **Phase 1** (Weeks 1-3): Core scanning app
2. **Phase 2** (Weeks 4-5): Contact management
3. **Phase 3** (Week 6): WhatsApp integration
4. **Phase 4** (Week 7): Testing & polish
5. **Phase 5** (Week 8): App store launch
6. **Phase 6** (Weeks 9-11): Premium features
7. **Phase 7** (Weeks 12-14): Distributor system

## Important Considerations

- This is currently a static prototype - no backend integration exists
- Real implementation will require migration to React Native + Expo
- OCR functionality is mocked - needs Google Vision API integration
- Database operations are simulated - needs Supabase implementation
- Payment processing is conceptual - needs Stripe/RevenueCat integration

## 🎯 Quality Assurance & Testing

**CRITICAL RULE**: After EVERY code change, fix, or development task, Claude Code MUST validate code quality and functionality using multiple testing layers.

---

### **1. Mandatory Post-Development Validation**

After every code change, run these checks in order:

#### **Step 1: TypeScript Type Check**
```bash
cd NamecardMobile && npm run type:check
```
- If errors found → Fix them immediately
- Re-run until no errors

#### **Step 2: Unit Tests**
```bash
cd NamecardMobile && npm test
```
- If tests fail → Fix them immediately
- Re-run until all tests pass

#### **Step 3: End-to-End Testing (When Applicable)**
- Use Playwright MCP for runtime validation
- Test user interactions and workflows
- Verify visual correctness with screenshots
- Confirm no console errors

#### **Step 4: Manual Testing (Optional)**
- Test in emulator by pressing 'a' (Android) or 'i' (iOS)
- Check for runtime errors
- Verify the specific feature/fix works

**DO NOT** consider a task complete until:
- ✅ TypeScript compiles without errors
- ✅ All tests pass
- ✅ Playwright E2E verification (when applicable)

**Validation Checklist Template:**

After every change, Claude Code should report:
```
✅ TypeScript: No errors
✅ Tests: X/X passing
✅ Playwright E2E: All interactions verified (if applicable)
```

**Example Validation Session:**
```
User: "Add a new contact button to the header"

Claude Code should:
1. Add the button component
2. Run: npm run type:check → Fix any type errors
3. Run: npm test → Fix any test failures
4. (If applicable) Use Playwright to verify button works
5. Report: "✅ Button added, all checks pass"
```

---

### **2. Debugging & Error Fixing Workflow**

**IMPORTANT**: When errors occur during development, testing, or runtime, ALWAYS use Claude Code to debug and fix them immediately.

#### **Standard Debugging Workflow**

1. **Capture the Error**
   - Copy the full error message from terminal/console
   - Include stack traces and line numbers
   - Note the context (what you were doing when it happened)

2. **Ask Claude Code to Debug**
   ```
   "I'm getting this error: [paste error]. Please debug and fix it."
   ```

3. **Claude Code Will**:
   - Read the relevant files
   - Identify the root cause
   - Fix the code
   - Test the fix
   - Explain what was wrong

### Common Error Scenarios

#### Build/Bundling Errors
```bash
# Error: "Unable to resolve module"
# Solution: Ask Claude Code to check import paths and fix them

# Error: "Metro bundler failed"
# Solution: Ask Claude Code to clear cache and restart
cd NamecardMobile && npm run start:clear
```

#### Runtime Errors in Emulator
```bash
# When you see red screen errors in the emulator:
1. Take a screenshot or copy the error text
2. Send to Claude Code: "Fix this error: [error message]"
3. Claude Code will update the code with hot reload
```

#### Test Failures
```bash
# When tests fail:
npm test -- [test-name]
# Copy the failure output
# Ask: "These tests are failing: [paste output]. Fix them."
```

#### Type Errors
```bash
# Run type check
npm run type:check

# If errors appear, ask Claude Code:
"Fix these TypeScript errors: [paste errors]"
```

### Proactive Error Prevention

**Before Running Commands**, ask Claude Code to:
- Validate configuration files
- Check for missing dependencies
- Verify environment variables
- Test critical paths

### Real-Time Debugging During Development

#### Scenario 1: Component Not Rendering
```
"The CameraScreen isn't showing up. Debug and fix."
```
Claude Code will:
1. Check component imports
2. Verify navigation setup
3. Check for runtime errors
4. Fix the issue

#### Scenario 2: API Not Working
```
"Supabase authentication isn't working. Debug this."
```
Claude Code will:
1. Check API configuration
2. Verify environment variables
3. Test the connection
4. Fix authentication flow

#### Scenario 3: Hot Reload Not Working
```
"Hot reload stopped working. Fix it."
```
Claude Code will:
1. Check Metro bundler status
2. Clear cache if needed
3. Restart development server
4. Verify watchman configuration

### Testing & Validation Commands

```bash
# Always run these before committing:
npm run type:check          # Check TypeScript
npm test                    # Run all tests
npm run lint               # Check code quality

# If any fail, ask Claude Code to fix them immediately
```

### Emergency Debug Commands

```bash
# Complete reset (when nothing works):
npm run clean:all          # Clean everything
npm install                # Reinstall dependencies
npm run start:clear        # Start fresh

# Android-specific issues:
adb devices               # Check device connection
adb logcat                # View Android logs
```

### Best Practices for Working with Claude Code

1. **Always Share Context**
   - What were you trying to do?
   - What command did you run?
   - What did you expect to happen?
   - What actually happened?

2. **Provide Complete Error Messages**
   - Don't truncate error messages
   - Include file paths and line numbers
   - Share stack traces

3. **Test Immediately After Fixes**
   - Verify the fix works
   - Report back to Claude Code if issues persist
   - Claude Code will iterate until it's fixed

4. **Document Recurring Issues**
   - If the same error happens multiple times
   - Ask Claude Code to add preventive measures
   - Update configuration to avoid future occurrence

### Example Debug Sessions

#### Example 1: Import Error
```
User: "Getting error: Cannot find module './components/CameraScreen'"

Claude Code will:
1. Read App.tsx to check imports
2. Check actual file location
3. Update import path
4. Hot reload will show the fix immediately
```

#### Example 2: Build Failure
```
User: "Build failing with SDK version mismatch"

Claude Code will:
1. Run expo-doctor to diagnose
2. Check package.json versions
3. Update mismatched packages
4. Restart build successfully
```

#### Example 3: Test Failure
```
User: "useAuth tests are failing"

Claude Code will:
1. Read the test file
2. Check the hook implementation
3. Identify the mock setup issue
4. Fix the test
5. Run tests to confirm they pass
```

### Integration with Development Flow

```
Write Code → Error Occurs → Ask Claude Code → Fix Applied → Continue
     ↑                                                            ↓
     ←←←←←←←←←←←←←←← Test Passes ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### Quick Reference Commands

```bash
# Check health
npm run doctor

# Clear and restart
npm run clean && npm start

# Test everything
npm test -- --coverage

# Fix linting
npm run lint:fix

# Check types
npm run type:check

# View emulator logs
adb logcat | grep -i "error"
```

**Remember**: Claude Code is your pair programmer. Don't struggle with errors alone - ask immediately and get instant fixes!

---

### **3. Automated QA with Playwright MCP**

**CRITICAL INSTRUCTION**: When ANY error occurs (user reports error OR system detects error), Claude Code MUST automatically act as a QA agent using Playwright MCP to diagnose and fix the error.

#### **Playwright MCP Server Configuration**

The Playwright MCP server is configured in your project settings at `C:\Users\walte\.claude.json`.

**Configuration:**
```json
{
  "playwright": {
    "command": "cmd",
    "args": [
      "/c",
      "npx",
      "-y",
      "@playwright/mcp@latest",
      "--browser",
      "chrome",
      "--viewport-size",
      "1280x720"
    ]
  }
}
```

#### **When to Use Playwright MCP (AUTOMATICALLY)**

Claude Code MUST use Playwright MCP for:

1. **Runtime Errors in Browser/App**
   - UI components not rendering
   - JavaScript errors in console
   - API request failures
   - Navigation issues
   - Form submission errors

2. **Visual/Layout Issues**
   - Broken layouts
   - Missing styles
   - Responsive design problems
   - Component alignment issues

3. **User Interaction Errors**
   - Buttons not working
   - Forms not submitting
   - Navigation broken
   - Click handlers failing

4. **Integration Testing**
   - End-to-end workflow testing
   - Multi-step user flows
   - Cross-component interactions

#### **Automated QA Error Handling Workflow**

When user says: "I'm getting an error" or "This isn't working" or you detect an error:

```
STEP 1: ACKNOWLEDGE & PREPARE
├─ "I'll use Playwright MCP to diagnose and fix this error"
├─ Create todo list for systematic QA testing
└─ Identify the error type and affected component

STEP 2: AUTOMATED TESTING WITH PLAYWRIGHT
├─ Use browser_goto to navigate to the affected page
├─ Use browser_snapshot to get accessibility tree
├─ Use browser_console_messages to check for errors
├─ Use browser_screenshot to capture visual state
└─ Use browser_click/browser_fill to reproduce the issue

STEP 3: DIAGNOSE THE ROOT CAUSE
├─ Analyze console errors
├─ Check network requests
├─ Inspect DOM structure
├─ Identify broken code/logic
└─ Document findings

STEP 4: FIX THE ERROR
├─ Read the relevant source files
├─ Apply the fix using Edit tool
├─ Update tests if needed
└─ Run type:check and npm test

STEP 5: VERIFY THE FIX WITH PLAYWRIGHT
├─ Use browser_goto to navigate again
├─ Use browser_click/browser_fill to test the fix
├─ Use browser_console_messages to verify no errors
├─ Use browser_screenshot to confirm visual correctness
└─ Mark todo as completed

STEP 6: REPORT SUCCESS
└─ "✅ Error fixed and verified with Playwright testing!"
```

#### **Available Playwright MCP Tools**

**Navigation & Inspection:**
- `browser_goto(url)` - Navigate to a URL
- `browser_snapshot()` - Get structured accessibility tree
- `browser_console_messages()` - Retrieve console logs/errors
- `browser_screenshot()` - Capture visual state

**User Interaction:**
- `browser_click(selector)` - Click elements
- `browser_fill(selector, text)` - Fill form fields
- `browser_scroll(direction)` - Scroll page content
- `browser_drag(from, to)` - Drag and drop

**Management:**
- `browser_close()` - Close current page

#### **Error Detection Triggers**

Claude Code should AUTOMATICALLY activate Playwright QA mode when:

1. **User explicitly reports an error**
   - "This isn't working"
   - "I'm getting an error"
   - "The button is broken"
   - "Nothing happens when I click"

2. **User asks to debug/check something**
   - "Check if the form works"
   - "Test the login flow"
   - "Verify the UI loads correctly"

3. **After implementing new features**
   - "I just added authentication, make sure it works"
   - "Test the new contact form"

4. **When TypeScript or tests fail**
   - After fixing code errors, verify with Playwright that the UI works

#### **Playwright Testing Best Practices**

1. **Always start with browser_goto** - Navigate to the specific page/route
2. **Use browser_snapshot for structure** - Get accessibility tree to understand UI
3. **Check console messages** - Always run browser_console_messages() to catch errors
4. **Take screenshots for visual verification** - Capture state before and after actions
5. **Test complete user flows** - Test entire workflows (login → navigate → action → result)
6. **Clean up after testing** - Use browser_close() when done

#### **Mandatory QA Checklist**

After EVERY fix, Claude Code MUST verify:
```
✅ Code fixed in source files
✅ TypeScript type:check passes
✅ Unit tests pass
✅ Playwright navigation successful
✅ No console errors
✅ User interactions work
✅ Visual state correct
✅ Screenshot confirms fix
```

**DO NOT** consider an error "fixed" until ALL checklist items pass, including Playwright verification.

#### **The Golden Rule of Error Handling**

```
WHEN ERROR OCCURS:
  1. Don't just fix the code
  2. USE PLAYWRIGHT MCP to:
     - Reproduce the error
     - Diagnose the root cause
     - Verify the fix works
     - Confirm no new errors introduced
  3. Report success with evidence

NEVER say "I've fixed it" without Playwright verification!
```

**Remember**: Playwright MCP is your QA automation tool. Use it religiously for every error, every fix, every new feature.

---

## 🔧 Supabase MCP Server - MANDATORY USAGE

**CRITICAL INSTRUCTION FOR CLAUDE CODE**:

**ALWAYS use the Supabase MCP server for ALL database operations, schema changes, queries, and data management tasks.**

### MCP Server Configuration Location

The Supabase MCP server is configured at:
```
.mcp.json
```

This configuration file contains:
- **SUPABASE_URL**: Your project's Supabase URL
- **SUPABASE_SERVICE_ROLE_KEY**: Admin access key for database operations

### When to Use MCP Server (AUTOMATICALLY)

Claude Code MUST use the MCP server for:

1. **Database Schema Changes**
   - Creating/altering tables
   - Adding/removing columns
   - Creating indexes and constraints
   - Running migration scripts

2. **Database Queries**
   - Reading data from tables
   - Inspecting table structures
   - Checking foreign key relationships
   - Verifying data integrity

3. **Data Management**
   - Creating test data
   - Updating records
   - Deleting test records
   - Bulk operations

4. **RLS Policy Management**
   - Creating/updating Row Level Security policies
   - Checking policy configurations
   - Testing access controls

5. **Storage Operations**
   - Creating storage buckets
   - Managing file permissions
   - Uploading test files

6. **Authentication**
   - Creating test users
   - Managing user roles
   - Checking auth configurations

### How to Use the MCP Server

**DO NOT manually write SQL files or ask the user to run them in Supabase Dashboard.**

Instead, Claude Code should:

```bash
# Example workflow for fixing database issues:

1. User reports: "Foreign key constraint error on contacts table"

2. Claude Code automatically:
   - Uses MCP to inspect the contacts table schema
   - Uses MCP to check the foreign key constraint
   - Uses MCP to run the fix SQL directly on the database
   - Verifies the fix with another MCP query
   - Reports success to the user

3. User does NOTHING manually - everything is automatic
```

### MCP Server Configuration File

**WINDOWS USERS**: The Supabase MCP server configuration uses the `--project-ref` method with `SUPABASE_ACCESS_TOKEN` instead of environment variables.

The configuration file should be located at:
```
C:\Users\[YourUsername]\AppData\Roaming\Claude\.mcp.json
```

Configuration format for Windows:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=wvahortlayplumgrcmvi"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_6f5a2585aa0f39c561582a2d1933a80eae5d3d13"
      }
    }
  }
}
```

**CRITICAL for Windows**:
- Must use `"command": "cmd"` with `"/c"` in args array
- This wrapper is required for Windows to execute `npx` properly
- Without it, you'll get "Connection closed" errors
- Use `--project-ref` flag instead of `SUPABASE_URL` environment variable
- Use `SUPABASE_ACCESS_TOKEN` instead of `SUPABASE_SERVICE_ROLE_KEY`

**File Location**:
- The `.mcp.json` file MUST be in `C:\Users\[YourUsername]\AppData\Roaming\Claude\`
- NOT in the project directory
- NOT in `C:\ProgramData\ClaudeCode\` (that's for enterprise managed configs only)

**IMPORTANT**:
- This configuration gives Claude Code full access to your Supabase project
- Keep this configuration secure and never commit it to public repositories
- The MCP server will be automatically available in all Claude Code sessions once properly configured

### How Claude Code Uses the MCP Server

When the MCP server is properly configured, Claude Code can:

**Database Operations:**
- Execute SQL queries directly on your Supabase database
- Inspect table schemas and relationships
- Create, read, update, and delete records
- Run migrations and schema changes

**Authentication Management:**
- List and manage users
- Create test accounts
- Reset passwords
- View authentication logs

**Storage Operations:**
- Upload and manage files in Supabase Storage
- List buckets and files
- Generate signed URLs
- Manage file permissions

**Real-time Features:**
- Subscribe to database changes
- Monitor real-time events
- Test webhook configurations

### Automatic MCP Usage Examples

When you ask Claude Code to perform Supabase operations, it will automatically use the MCP server:

**User Request:**
```
"Fix the foreign key constraint error on the contacts table"
```

**Claude Code Automatic Actions:**
1. Uses MCP to inspect the `contacts` table schema
2. Uses MCP to check the foreign key constraints
3. Uses MCP to run the fix SQL (e.g., create trigger, update RLS policies)
4. Uses MCP to verify the fix worked
5. Reports: "✅ Fixed! Foreign key constraint resolved."

**User Request:**
```
"Show me all contacts in the database"
```

**Claude Code Automatic Actions:**
1. Uses MCP to query: `SELECT * FROM contacts LIMIT 10;`
2. Displays the results in a formatted table

**User Request:**
```
"Create the storage bucket for contact images"
```

**Claude Code Automatic Actions:**
1. Uses MCP to run storage bucket creation SQL
2. Uses MCP to set up RLS policies for the bucket
3. Uses MCP to verify the bucket was created
4. Reports: "✅ Storage bucket 'contact-images' created successfully!"

### Security Notes

- **Service Role Key**: Has full admin access to your Supabase project
- **Secure Storage**: Configuration file is stored in `.mcp.json` in the root directory
- **Never commit**: Add `.mcp.json` to `.gitignore`
- **Local only**: This configuration is for local development only

---