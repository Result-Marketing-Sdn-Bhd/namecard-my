# 🚀 WhatsCard Publishing Roadmap - Complete Guide

**Project:** WhatsCard - Business Card Scanner
**Version:** 1.0.1
**Target Platforms:** iOS App Store & Google Play Store
**Timeline:** 5-7 days
**Last Updated:** January 2025

---

## 📊 CURRENT STATUS (80% Ready)

### ✅ COMPLETED
- [x] App configured with Expo SDK 53
- [x] App name: WhatsCard - Business Card Scanner
- [x] Version: 1.0.1
- [x] Bundle IDs configured:
  - iOS: `com.alittlebetter.better`
  - Android: `com.resultmarketing.whatscard`
- [x] EAS Project ID: `66d97936-e847-4b80-a6c7-bf90ea4a0d80`
- [x] Icons and splash screens present
- [x] Permissions configured (Camera, Storage, Microphone, Contacts)
- [x] In-App Purchase plugin configured (react-native-iap)
- [x] Privacy policy URLs set up
- [x] Store listing content prepared

### ⚠️ TODO (20% Remaining)
- [ ] Create eas.json build configuration
- [ ] Set up production environment variables
- [ ] Fix bundle ID inconsistency (recommend: com.whatscard.app)
- [ ] Take app screenshots (8 per platform)
- [ ] Register developer accounts ($25 + $99)
- [ ] Generate production builds (.aab + .ipa)
- [ ] Submit to both stores

---

## 💰 FINANCIAL INVESTMENT

### Required Costs
| Item | Cost | Frequency | Total Year 1 |
|------|------|-----------|--------------|
| Google Play Developer | $25 | One-time | $25 |
| Apple Developer Program | $99 | Annual | $99 |
| **TOTAL** | | | **$124** |

### Optional Costs
- Professional app icon design: $50-200
- Screenshot mockup templates: $20-50
- App preview video: $100-500
- Marketing assets: $100-300

---

## ⏱️ TIME INVESTMENT

### Development Time
- Account setup: 2 hours
- Screenshot creation: 2 hours
- Build generation: 1 hour (automated)
- Store submission: 1 hour
- Review monitoring: 1 hour/day × 7 days
- **Total: ~10 hours over 1 week**

---

## 📅 DAY-BY-DAY ROADMAP

---

## DAY 1: SETUP & PREPARATION (2-3 hours)

### Morning: Developer Accounts Setup

#### Google Play Console Registration
**URL:** https://play.google.com/console/signup

**Steps:**
1. Go to Google Play Console signup
2. Pay $25 registration fee (credit card)
3. Accept Developer Distribution Agreement
4. Complete identity verification
5. Set up payment profile
6. Add tax information (W-8BEN or W-9)

**Required Documents:**
- Valid government ID
- Credit card for registration fee
- Tax ID number

**Wait Time:** 24-48 hours for verification

---

#### Apple Developer Program Registration
**URL:** https://developer.apple.com/programs/enroll/

**Steps:**
1. Go to Apple Developer enrollment
2. Choose Individual ($99/year) or Organization ($99/year)
3. Pay $99 annual fee
4. Verify identity
5. Accept Apple Developer Program License Agreement
6. Enable two-factor authentication (REQUIRED)
7. Wait for account activation

**Required:**
- Apple ID
- Credit card or bank account
- Valid ID (passport/driver's license)
- Two-factor authentication enabled
- D-U-N-S number (for organizations only)

**Wait Time:** 24-48 hours for activation

---

#### Expo Account Setup
**URL:** https://expo.dev/signup

**Steps:**
1. Create Expo account (free)
2. Verify email
3. Note your username for EAS CLI login

**Wait Time:** Immediate

---

### Afternoon: Project Configuration (Claude Code Automated)

#### 1. Create eas.json Configuration
**What Claude Code will create:**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

**Location:** `NamecardMobile/eas.json`

---

#### 2. Create Production Environment Variables
**What Claude Code will create:**

File: `NamecardMobile/.env.production`

```bash
# Supabase Configuration
SUPABASE_URL=https://wvahortlayplumgrcmvi.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key

# Google Gemini AI (OCR)
GEMINI_API_KEY=your_production_gemini_key

# OpenAI (Voice Notes)
OPENAI_API_KEY=your_production_openai_key

# App Environment
APP_ENV=production
DEBUG_MODE=false

# iOS In-App Purchase
IOS_APP_STORE_SHARED_SECRET=your_ios_shared_secret

# Analytics (Optional)
ANALYTICS_ENABLED=true
```

**⚠️ ACTION REQUIRED:** You must provide these production API keys

---

#### 3. Fix Bundle ID Inconsistency
**Current:**
- iOS: `com.alittlebetter.better` ❌
- Android: `com.resultmarketing.whatscard` ❌

**Recommended:**
- iOS: `com.whatscard.app` ✅
- Android: `com.whatscard.app` ✅

**Why:** Consistency, easier management, professional appearance

**Claude Code will update:**
- `NamecardMobile/app.json`
- `NamecardMobile/app.config.js`

---

#### 4. Run Pre-Build Checks

**Commands Claude Code will run:**

```bash
cd NamecardMobile

# Install dependencies
npm install

# TypeScript type check
npm run type:check

# Run linter
npm run lint

# Run tests
npm test

# Verify environment
npm run doctor
```

**Expected Output:**
```
✅ TypeScript: No errors
✅ Tests: All passing
✅ Expo Doctor: All checks passed
✅ Ready for build
```

---

## DAY 2: BUILD GENERATION (45 minutes automated)

### Prerequisites Checklist
Before building, ensure:
- [ ] Developer accounts created (can still be pending)
- [ ] eas.json created
- [ ] .env.production configured with real API keys
- [ ] Bundle IDs fixed and consistent
- [ ] All TypeScript/lint checks passing

---

### Build Process (Fully Automated by Claude Code)

#### Step 1: EAS CLI Login

```bash
cd NamecardMobile
npx eas login
# Enter your Expo credentials
```

---

#### Step 2: Configure Build Credentials

**For Android:**
```bash
npx eas credentials

# EAS will automatically:
# 1. Generate Android keystore
# 2. Store securely in EAS
# 3. Configure signing
# 4. No manual action needed!
```

**For iOS:**
```bash
npx eas credentials

# EAS will automatically:
# 1. Generate iOS certificates
# 2. Create provisioning profiles
# 3. Configure App Store Connect API key (you'll need Apple ID)
# 4. Request 2FA code (you provide)
```

---

#### Step 3: Build Android App Bundle

```bash
# Android build (generates .aab for Play Store)
npx eas build --platform android --profile production

# Build process:
# - Uploads code to EAS servers
# - Installs dependencies
# - Runs prebuild (generates native code)
# - Compiles Android app
# - Signs with keystore
# - Generates .aab file

# Time: 15-20 minutes
```

**Expected Output:**
```
✔ Build finished
📦 Android App Bundle:
   https://expo.dev/artifacts/eas/xxxxx.aab

✅ Download: eas build:download --platform android --profile production
```

---

#### Step 4: Build iOS Archive

```bash
# iOS build (generates .ipa for App Store)
npx eas build --platform ios --profile production

# Build process:
# - Uploads code to EAS servers
# - Installs dependencies
# - Runs prebuild (generates native code)
# - Compiles iOS app
# - Signs with certificates
# - Generates .ipa file

# Time: 20-25 minutes
```

**Expected Output:**
```
✔ Build finished
📱 iOS Archive:
   https://expo.dev/artifacts/eas/xxxxx.ipa

✅ Download: eas build:download --platform ios --profile production
```

---

### Build Artifacts

After successful builds, you'll have:

1. **Android App Bundle (.aab)**
   - File: `whatscard-1.0.1.aab`
   - Size: ~30-50 MB
   - Format: Android App Bundle (universal)
   - Ready for: Google Play Store upload

2. **iOS Archive (.ipa)**
   - File: `whatscard-1.0.1.ipa`
   - Size: ~40-60 MB
   - Format: iOS App Archive
   - Ready for: App Store Connect upload

---

### Build Verification

**Commands to verify builds:**

```bash
# Check build status
npx eas build:list

# Download builds
npx eas build:download --platform android --profile production
npx eas build:download --platform ios --profile production

# View build logs
npx eas build:view --platform android
npx eas build:view --platform ios
```

---

## DAY 3: SCREENSHOTS & ASSETS (2-3 hours)

### Screenshot Requirements

#### Android (Google Play Store)
- **Quantity:** 2-8 screenshots (recommend 8)
- **Size:** 1080×1920 pixels (portrait) or 1920×1080 (landscape)
- **Format:** PNG or JPEG
- **Max File Size:** 8 MB per screenshot

#### iOS (App Store)
- **Quantity:** 1-10 screenshots per device size (recommend 8)
- **Device Sizes Required:**
  - **6.7" Display** (iPhone 14 Pro Max): 1290×2796 pixels
  - **5.5" Display** (iPhone 8 Plus): 1242×2208 pixels
  - **iPad Pro 12.9"** (optional): 2048×2732 pixels
- **Format:** PNG or JPEG
- **Max File Size:** 8 MB per screenshot

---

### Recommended Screenshot Sequence

**Screenshot 1: Home/Contact List**
- Shows: Main contact list with search bar
- Highlights: Clean UI, contact organization
- Text overlay: "Manage All Your Contacts in One Place"

**Screenshot 2: Camera Scanning**
- Shows: Camera actively scanning business card
- Highlights: OCR in action
- Text overlay: "Scan Business Cards Instantly with AI"

**Screenshot 3: Contact Detail View**
- Shows: Contact profile with all extracted information
- Highlights: WhatsApp button, call button, email
- Text overlay: "Connect on WhatsApp with One Tap"

**Screenshot 4: OCR Results**
- Shows: Contact form with auto-filled information
- Highlights: Accurate data extraction
- Text overlay: "AI-Powered Text Recognition"

**Screenshot 5: Excel Export**
- Shows: Export options and preview
- Highlights: Professional data management
- Text overlay: "Export Contacts to Excel/CSV"

**Screenshot 6: Search & Filter**
- Shows: Search bar with results
- Highlights: Fast search functionality
- Text overlay: "Find Contacts Instantly"

**Screenshot 7: Dark Mode (Optional)**
- Shows: App in dark mode
- Highlights: Eye-friendly design
- Text overlay: "Dark Mode Support"

**Screenshot 8: Pro Features**
- Shows: Voice notes or reminders feature
- Highlights: Premium capabilities
- Text overlay: "Upgrade to Pro for Advanced Features"

---

### How to Take Screenshots

#### Option A: Android Emulator (Recommended)

```bash
# Start Android emulator from Android Studio
# Or use Expo:
cd NamecardMobile
npm run android

# Take screenshots:
# Method 1: Emulator toolbar → Camera icon
# Method 2: Ctrl+Shift+S (Windows) / Cmd+Shift+S (Mac)

# Screenshots saved to:
# Windows: C:\Users\YourName\Pictures\Screenshots\
# Mac: ~/Desktop/
```

**Emulator Setup:**
1. Open Android Studio
2. AVD Manager → Create Virtual Device
3. Choose Pixel 6 Pro (1440×3120 resolution)
4. Download system image (Android 13)
5. Start emulator

---

#### Option B: iOS Simulator (Mac Only)

```bash
# Start iOS simulator
cd NamecardMobile
npm run ios

# Take screenshots:
# Method 1: Cmd+S
# Method 2: File → Save Screen

# Screenshots saved to: ~/Desktop/
```

**Simulator Setup:**
1. Open Xcode
2. Xcode → Open Developer Tool → Simulator
3. Choose iPhone 14 Pro Max
4. Run app: npm run ios

---

#### Option C: Physical Device

**Android:**
1. Enable Developer Mode
2. Connect via USB
3. Run: `npm run android`
4. Take screenshots with Power+VolDown

**iOS:**
1. Connect iPhone via USB
2. Trust computer
3. Run: `npm run ios`
4. Take screenshots with Power+VolUp

---

### Screenshot Editing Tools

**Free Options:**
- **Figma** (Web-based): Add text overlays, annotations
- **Canva** (Web-based): Templates for app screenshots
- **GIMP** (Desktop): Free Photoshop alternative

**Paid Options:**
- **Photoshop**: Professional editing
- **Sketch** (Mac): UI/UX design
- **Affinity Photo**: One-time purchase alternative

**Screenshot Mockup Tools:**
- **App Screenshot Generator** (appmockup.com): Free mockups
- **Previewed** (previewed.app): Device frames
- **Shotsnapp** (shotsnapp.com): Free device mockups

---

### App Icon Requirements

#### Android (Google Play)
- **512×512 PNG** (Store listing)
- **Adaptive Icon:** 512×512 PNG (foreground + background)
- Must not have alpha channel
- Must be exactly 512×512 pixels

**Current Icon:** `NamecardMobile/assets/splash-icon.png`
**Status:** ⚠️ Needs verification and optimization

---

#### iOS (App Store)
- **1024×1024 PNG** (Store listing)
- Must be exactly 1024×1024 pixels
- No alpha channel
- No rounded corners (iOS handles this automatically)

**Current Icon:** `NamecardMobile/assets/splash-icon.png`
**Status:** ⚠️ Needs verification and optimization

---

### Feature Graphic (Android Only)

**Size:** 1024×500 pixels
**Format:** PNG or JPEG
**Purpose:** Displayed at top of Play Store listing

**Content Suggestions:**
- App name: "WhatsCard"
- Tagline: "Smart Business Card Scanner"
- Key visual: Business card + phone mockup
- Colors: Match app branding (#4A7A5C green)

---

## DAY 4: GOOGLE PLAY STORE SUBMISSION (45 min)

### Prerequisites
- [x] Google Play Developer account active
- [x] Android .aab file downloaded
- [x] 8 screenshots ready
- [x] App icon ready (512×512)
- [x] Feature graphic ready (1024×500)

---

### Step-by-Step Submission Process

#### 1. Create App in Play Console

**URL:** https://play.google.com/console

1. Sign in to Google Play Console
2. Click **"Create app"**
3. Fill in details:
   - **App name:** WhatsCard - Business Card Scanner
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept **Developer Program Policies**
5. Accept **US export laws**
6. Click **"Create app"**

---

#### 2. Complete Store Listing

**Navigate:** Dashboard → Store presence → Main store listing

**App name** (30 characters max):
```
WhatsCard - Card Scanner
```

**Short description** (80 characters max):
```
Smart business card scanner with instant WhatsApp networking
```

**Full description** (4000 characters max):
```
Transform Paper Cards into Digital Connections

WhatsCard is your smart networking companion that digitizes business cards instantly and helps you build meaningful professional relationships. Scan, save, and connect with anyone on WhatsApp in seconds.

🚀 KEY FEATURES

Smart OCR Technology
• Scan business cards with AI-powered accuracy
• Automatic contact information extraction
• Support for multiple languages and card formats
• Works offline - no internet required for scanning

Seamless Contact Management
• Auto-organize contacts by industry, location, or custom tags
• Advanced search and filtering
• Quick access to contact history and notes
• One-tap WhatsApp messaging

WhatsApp Integration
• Instant connection via WhatsApp
• Send personalized follow-up messages
• Share your digital business card
• Network smarter, not harder

Professional Features
• Export contacts to Excel/CSV
• Bulk contact operations
• Dark mode support
• Offline-first architecture - works anywhere

Security & Privacy
• Your data stays secure with encryption
• Optional cloud backup via Supabase
• GDPR compliant
• No ads, no tracking

💼 PERFECT FOR
• Business professionals
• Sales representatives
• Event attendees
• Entrepreneurs
• Recruiters
• Real estate agents
• Anyone who networks!

📊 SUBSCRIPTION TIERS

Free Plan
• Unlimited card scanning
• Basic contact management
• WhatsApp integration
• Excel export

Pro Plan (RM199/year)
• All Free features
• Follow-up reminders
• Voice notes with AI transcription
• Advanced analytics
• Priority support

🌟 WHY WHATSCARD?

Join thousands of professionals who have ditched the shoebox of business cards and embraced digital networking. WhatsCard helps you:

✓ Never lose a valuable connection
✓ Follow up faster than your competition
✓ Build lasting professional relationships
✓ Stay organized effortlessly
✓ Network with confidence

Download WhatsCard today and turn every introduction into an opportunity!

💬 CONTACT & SUPPORT
• Email: support@whatscard.my
• Website: https://whatscard.my
• Privacy Policy: https://whatscard.my/privacy

Note: WhatsApp integration requires WhatsApp to be installed on your device.
```

---

**Upload Assets:**

1. **App icon** (512×512 PNG)
   - Click "Upload" → Select `icon-512.png`

2. **Feature graphic** (1024×500 PNG)
   - Click "Upload" → Select `feature-graphic.png`

3. **Phone screenshots** (1080×1920, minimum 2, maximum 8)
   - Click "Add screenshots" → Select all 8 screenshots
   - Drag to reorder if needed

4. **7-inch tablet screenshots** (optional but recommended)
   - Same screenshots resized to 1024×1280

5. **10-inch tablet screenshots** (optional)
   - Same screenshots resized to 1280×1920

---

**App categorization:**

- **App category:** Business
- **Tags:** business, productivity, tools
- **Contact email:** support@whatscard.my
- **External marketing website:** https://whatscard.my
- **Privacy policy URL:** https://whatscard.my/privacy

**Click "Save"**

---

#### 3. Complete Content Rating

**Navigate:** Dashboard → Policy → App content → Content rating

1. Click **"Start questionnaire"**
2. Enter **email:** support@whatscard.my
3. Select **category:** Utility, Productivity, Communication, or Social

**Answer questions:**
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- Gambling: None
- User interaction features: Yes (users can share contact info)
- Data sharing: Yes (users can share contacts via WhatsApp)
- Location: No
- Personal data: Yes (contact information, photos)

**Expected Rating:** Everyone / PEGI 3

4. Click **"Submit questionnaire"**
5. Click **"Apply rating"**

---

#### 4. Target Audience & Content

**Navigate:** Dashboard → Policy → App content → Target audience

1. **Target age groups:**
   - Select: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
   - (App is for working professionals)

2. **Store presence:**
   - Select: **Available** (not teacher approved)

3. **Click "Save"**

---

#### 5. Ads & In-App Purchases

**Navigate:** Dashboard → Policy → App content → Ads

1. **Contains ads:** No
2. Click "Save"

**Navigate:** Dashboard → Policy → App content → In-app purchases

1. **Contains in-app purchases:** Yes
2. Price range: RM199-599 (approximately $2-$5 USD equivalent)
3. Click "Save"

---

#### 6. Data Safety

**Navigate:** Dashboard → Policy → App content → Data safety

**Data collection:**

1. **Location data:** No
2. **Personal info collected:**
   - Name: Yes
   - Email: Yes (optional)
   - Phone: Yes
   - Photos: Yes (business cards)
   - Purpose: App functionality
   - Optional: Yes (users can skip some fields)

3. **Data sharing:**
   - Sharing with third parties: No
   - Users can share via WhatsApp: Yes (user-initiated)

4. **Data security:**
   - Data encrypted in transit: Yes
   - Data encrypted at rest: Yes
   - Users can request deletion: Yes

5. Click **"Submit"**

---

#### 7. Create Production Release

**Navigate:** Dashboard → Release → Production

1. Click **"Create new release"**
2. **Release name:** 1.0.1
3. **Release notes:**

```
🚀 WhatsCard 1.0 - Your Smart Networking Companion!

✨ Features:
• AI-powered business card scanning
• Instant WhatsApp integration
• Smart contact management
• Excel export
• Offline-first design
• Dark mode support

Thank you for downloading WhatsCard! 🎉

Questions? support@whatscard.my
```

4. **Upload app bundle:**
   - Click "Upload" → Select `whatscard-1.0.1.aab`
   - Wait for processing (5-10 minutes)

5. **Release rollout:**
   - Select: **100%** (full rollout)
   - Or: **Staged rollout** (start at 10%, increase gradually)

6. Click **"Save"**

---

#### 8. Review & Submit

1. Click **"Review release"**
2. Verify all information is correct
3. Check for any warnings or errors
4. Click **"Start rollout to Production"**

**Status:** Submitted for review ✅

**Expected review time:** 1-3 days

---

## DAY 4: APPLE APP STORE SUBMISSION (60 min)

### Prerequisites
- [x] Apple Developer account active
- [x] iOS .ipa file downloaded
- [x] 8 screenshots per device size ready
- [x] App icon ready (1024×1024)

---

### Step-by-Step Submission Process

#### 1. Create App in App Store Connect

**URL:** https://appstoreconnect.apple.com

1. Sign in with Apple ID
2. Click **"My Apps"**
3. Click **"+"** → **"New App"**
4. Fill in details:
   - **Platform:** iOS
   - **App name:** WhatsCard - Business Card Scanner
   - **Primary language:** English (U.S.)
   - **Bundle ID:** Select `com.whatscard.app` (from dropdown)
   - **SKU:** WHATSCARD-001
   - **User access:** Full Access
5. Click **"Create"**

---

#### 2. Complete App Information

**Navigate:** My Apps → WhatsCard → App Information

**Localization (English - U.S.):**

1. **Name:** WhatsCard - Business Card Scanner
2. **Subtitle** (30 characters):
   ```
   Smart Business Card Scanner
   ```
3. **Privacy Policy URL:**
   ```
   https://whatscard.my/privacy
   ```
4. **Category:**
   - Primary: **Business**
   - Secondary: **Productivity**

5. **Copyright:** 2025 WhatsCard
6. **Age Rating:** 4+

**Click "Save"**

---

#### 3. Pricing & Availability

**Navigate:** My Apps → WhatsCard → Pricing and Availability

1. **Price:** Free
2. **Availability:** All territories
3. **Pre-order:** No
4. **App Distribution:** Public

**Click "Save"**

---

#### 4. Create In-App Purchases

**Navigate:** My Apps → WhatsCard → In-App Purchases

#### Create Pro Subscription

1. Click **"+"** → **"Auto-Renewable Subscription"**
2. **Reference name:** WhatsCard Pro Yearly
3. **Product ID:** `com.whatscard.app.pro.yearly`
4. **Subscription group:** WhatsCard Subscriptions (create new)
5. **Duration:** 1 year
6. **Price:** Select **Tier 5** (approximately $49.99 USD / RM199)
7. **Localization (English - U.S.):**
   - **Display name:** WhatsCard Pro
   - **Description:**
     ```
     Unlock premium features:
     • Follow-up reminders
     • Voice notes with AI transcription
     • Advanced analytics
     • Priority support

     Subscription auto-renews yearly.
     Cancel anytime in Settings.
     ```
8. **Review notes:**
   ```
   Pro subscription unlocks reminder and voice note features.
   Can be tested in sandbox environment.
   ```

**Click "Save"**

---

#### Create Enterprise Subscription

1. Click **"+"** → **"Auto-Renewable Subscription"**
2. **Reference name:** WhatsCard Enterprise Yearly
3. **Product ID:** `com.whatscard.app.enterprise.yearly`
4. **Subscription group:** WhatsCard Subscriptions (same as above)
5. **Duration:** 1 year
6. **Price:** Select **Tier 15** (approximately $149.99 USD / RM599)
7. **Localization:**
   - **Display name:** WhatsCard Enterprise
   - **Description:**
     ```
     All Pro features plus:
     • Team collaboration
     • Custom integrations
     • Dedicated account manager
     • White-label options

     Perfect for businesses.
     Subscription auto-renews yearly.
     ```

**Click "Save"**

---

#### 5. Prepare for Upload - Version 1.0.1

**Navigate:** My Apps → WhatsCard → iOS App → 1.0 Prepare for Submission

---

**App Information:**

1. **Name:** WhatsCard - Business Card Scanner
2. **Subtitle:** Smart Business Card Scanner

---

**Description** (4000 characters max):
```
Transform Paper Cards into Digital Connections

WhatsCard is your smart networking companion that digitizes business cards instantly and helps you build meaningful professional relationships. Scan, save, and connect with anyone on WhatsApp in seconds.

🚀 KEY FEATURES

Smart OCR Technology
• Scan business cards with AI-powered accuracy
• Automatic contact information extraction
• Support for multiple languages and card formats
• Works offline - no internet required for scanning

Seamless Contact Management
• Auto-organize contacts by industry, location, or custom tags
• Advanced search and filtering
• Quick access to contact history and notes
• One-tap WhatsApp messaging

WhatsApp Integration
• Instant connection via WhatsApp
• Send personalized follow-up messages
• Share your digital business card
• Network smarter, not harder

Professional Features
• Export contacts to Excel/CSV
• Bulk contact operations
• Dark mode support
• Offline-first architecture - works anywhere

Security & Privacy
• Your data stays secure with encryption
• Optional cloud backup via Supabase
• GDPR compliant
• No ads, no tracking

💼 PERFECT FOR
• Business professionals
• Sales representatives
• Event attendees
• Entrepreneurs
• Recruiters
• Real estate agents
• Anyone who networks!

📊 SUBSCRIPTION TIERS

Free Plan
• Unlimited card scanning
• Basic contact management
• WhatsApp integration
• Excel export

Pro Plan (RM199/year)
• All Free features
• Follow-up reminders
• Voice notes with AI transcription
• Advanced analytics
• Priority support

Enterprise Plan (RM599/year)
• All Pro features
• Team collaboration
• Custom integrations
• Dedicated account manager

🌟 WHY WHATSCARD?

Join thousands of professionals who have ditched the shoebox of business cards and embraced digital networking. WhatsCard helps you:

✓ Never lose a valuable connection
✓ Follow up faster than your competition
✓ Build lasting professional relationships
✓ Stay organized effortlessly
✓ Network with confidence

Download WhatsCard today and turn every introduction into an opportunity!

💬 CONTACT & SUPPORT
• Email: support@whatscard.my
• Website: https://whatscard.my
• Privacy Policy: https://whatscard.my/privacy

Note: WhatsApp integration requires WhatsApp to be installed on your device.
```

---

**Keywords** (100 characters max):
```
business card,scanner,OCR,contact,WhatsApp,networking,CRM,business,professional,sales
```

---

**Promotional Text** (170 characters max):
```
🚀 NEW: Voice notes with AI transcription! Record follow-up notes instantly. Upgrade to Pro and never forget an important detail!
```

---

**Support URL:**
```
https://whatscard.my/support
```

**Marketing URL:**
```
https://whatscard.my
```

**Click "Save"**

---

#### 6. Upload Screenshots

**Navigate:** Media Manager → 6.7" Display (iPhone 14 Pro Max)

**Requirements:**
- Size: 1290×2796 pixels
- Format: PNG or JPEG
- Minimum: 1 screenshot
- Maximum: 10 screenshots
- Recommended: 8 screenshots

**Upload Process:**
1. Click **"Add Screenshots"**
2. Select all 8 screenshots for iPhone 14 Pro Max
3. Drag to reorder if needed
4. Click **"Done"**

**Repeat for 5.5" Display (iPhone 8 Plus):**
- Size: 1242×2208 pixels
- Upload same 8 screenshots (resized)

**Optional: iPad Pro 12.9" Display:**
- Size: 2048×2732 pixels
- Upload iPad-optimized screenshots

**Click "Save"**

---

#### 7. Upload Build via EAS Submit

**Option A: Automated Submission (Recommended)**

```bash
cd NamecardMobile

# Submit iOS build to App Store Connect
npx eas submit --platform ios --profile production

# EAS will:
# 1. Prompt for Apple ID credentials
# 2. Request 2FA code
# 3. Upload .ipa to App Store Connect
# 4. Process build (15-30 minutes)

# Watch for: "Build processed successfully"
```

---

**Option B: Manual Upload**

```bash
# Download .ipa from EAS
npx eas build:download --platform ios --profile production

# Install Apple Transporter app
# macOS: App Store → Download "Transporter"
# Windows: Not supported (use Option A)

# Open Transporter:
# 1. Sign in with Apple ID
# 2. Click "+" to add app
# 3. Select whatscard-1.0.1.ipa
# 4. Click "Deliver"
# 5. Wait for upload (10-20 minutes)
```

---

#### 8. Select Build in App Store Connect

**After build processing completes:**

1. Refresh App Store Connect page
2. **Navigate:** 1.0.1 Prepare for Submission → Build
3. Click **"Add Build"** or **"+"**
4. Select **whatscard-1.0.1** from list
5. Click **"Done"**

**Build appears in "Build" section** ✅

---

#### 9. App Review Information

**Navigate:** General → App Review Information

**Contact Information:**
- **First name:** [Your first name]
- **Last name:** [Your last name]
- **Phone number:** [Your phone with country code]
- **Email address:** support@whatscard.my

---

**Demo Account (for App Review):**

**⚠️ CRITICAL:** Create a test account for Apple reviewers

1. Create test user in Supabase:
   - Email: `demo@whatscard.my`
   - Password: `Demo123!@#`
   - Pre-populate with 5 sample contacts

2. **Enter demo credentials:**
   - **Username:** demo@whatscard.my
   - **Password:** Demo123!@#

**Sign-in required:** Yes

---

**Notes for Reviewers:**
```
WhatsCard is a business card scanner with WhatsApp integration.

HOW TO TEST:
1. Login with demo account: demo@whatscard.my / Demo123!@#
2. Grant camera permission when prompted
3. Use "Camera" tab to scan a business card
   - Sample business card images attached in "Attachments"
4. View extracted contact information in form
5. Save contact and view in "Contacts" tab
6. Tap WhatsApp button to test integration (requires WhatsApp installed)
7. Test export feature: Select contacts → Export to Excel

PRO FEATURES (In-App Purchase):
- Test in sandbox environment with sandbox Apple ID
- Voice notes and reminders require Pro subscription
- Subscription products: com.whatscard.app.pro.yearly

PERMISSIONS REQUIRED:
- Camera: For scanning business cards
- Photo Library: For saving/selecting card images
- Microphone: For voice notes (Pro feature)
- Contacts: Optional - for exporting to device contacts

The app works offline for core scanning features.
All data is stored securely with encryption.

SAMPLE BUSINESS CARDS:
Please see attached images for testing scanning functionality.

Contact support@whatscard.my for any questions during review.
```

---

**Attachments (Optional but Recommended):**
- Upload 2-3 sample business card images for reviewers to test with

---

#### 10. App Privacy

**Navigate:** General → App Privacy

**Data Collection:**

1. **Contact Info:**
   - Name: Collected, Used for app functionality, Not shared
   - Email: Collected, Used for app functionality, Not shared
   - Phone: Collected, Used for app functionality, Not shared

2. **Photos:**
   - Business card images: Collected, Used for app functionality, Not shared

3. **Usage Data:**
   - Analytics: Not collected

4. **Data Linked to User:**
   - Contact information
   - Photos

5. **Data Not Linked to User:**
   - None

6. **Tracking:**
   - No tracking

**Click "Save"**

---

#### 11. Version Release

**Navigate:** 1.0.1 Prepare for Submission → Version Release

**Options:**
1. **Manually release this version** ✅ (Recommended)
   - You control exact release time
   - Release after approval

2. **Automatically release after approval**
   - Goes live immediately after approval

**Select:** Manually release this version

**Click "Save"**

---

#### 12. Submit for Review

**Final Checklist:**
- [ ] All app information completed
- [ ] Description, keywords, screenshots uploaded
- [ ] Build selected and processed
- [ ] Demo account provided
- [ ] App privacy configured
- [ ] In-app purchases created
- [ ] Review notes added

---

**Submit:**
1. Scroll to top of page
2. Click **"Add for Review"** (top right)
3. Review all sections - ensure no warnings
4. Click **"Submit to App Review"**
5. Confirm submission

**Status:** Waiting for Review ✅

**Expected review time:** 3-5 days (can be 1-7 days)

---

## DAY 5-7: REVIEW MONITORING & LAUNCH

### Review Status Tracking

#### Check Review Status

**Google Play Console:**
- URL: https://play.google.com/console
- Navigate: Dashboard → Production → Releases
- Statuses:
  - **In review**: Being reviewed by Google
  - **Approved**: Ready to publish
  - **Rejected**: Needs fixes (check email for details)

**App Store Connect:**
- URL: https://appstoreconnect.apple.com
- Navigate: My Apps → WhatsCard → App Store
- Statuses:
  - **Waiting for Review**: In queue
  - **In Review**: Being reviewed by Apple
  - **Pending Developer Release**: Approved, waiting for manual release
  - **Ready for Sale**: Live on App Store
  - **Rejected**: Needs fixes (check Resolution Center)

---

### Common Review Times

**Google Play:**
- **Normal:** 1-3 days
- **Busy periods:** 3-7 days
- **Policy violations:** Immediate rejection
- **Request expedited review:** Not available for initial releases

**App Store:**
- **Normal:** 24-48 hours (recently improved!)
- **Busy periods:** 3-5 days
- **Complex apps:** 5-7 days
- **Request expedited review:** Available for critical bugs only

---

### Handling Rejections

#### Google Play Common Rejections

**1. Privacy Policy Issues**
- **Reason:** Missing or incomplete privacy policy
- **Fix:**
  - Ensure https://whatscard.my/privacy is accessible
  - Must mention data collection (contacts, photos)
  - Must explain how data is used
  - Must explain user rights (deletion, export)
- **Resubmit:** Update URL, resubmit within 24 hours

---

**2. Content Rating Issues**
- **Reason:** Inaccurate content rating responses
- **Fix:**
  - Re-do content rating questionnaire
  - Be accurate about user interaction features
  - Mention WhatsApp sharing capability
- **Resubmit:** New rating, resubmit immediately

---

**3. Misleading Content**
- **Reason:** Screenshots/description don't match app
- **Fix:**
  - Update screenshots to show actual app
  - Remove any misleading claims in description
  - Ensure all features mentioned actually exist
- **Resubmit:** Update store listing, resubmit

---

**4. Icon Mismatch**
- **Reason:** App icon doesn't meet guidelines
- **Fix:**
  - Must be 512×512 exactly
  - No alpha/transparency
  - High quality PNG
- **Resubmit:** Upload new icon, resubmit

---

#### App Store Common Rejections

**1. Guideline 2.1 - App Completeness**
- **Reason:** App crashes or features don't work
- **Fix:**
  - Test app thoroughly before resubmitting
  - Ensure demo account works
  - Fix all crashes (check Crash logs in App Store Connect)
  - Add clearer instructions for reviewers
- **Resubmit:** Fix bugs, update build, resubmit (new 1.0.2 build)

---

**2. Guideline 4.2 - Minimum Functionality**
- **Reason:** App too basic or just web wrapper
- **Fix:**
  - Emphasize OCR functionality (native feature)
  - Highlight offline capabilities
  - Explain AI processing
  - Not just a web view
- **Response:** Reply via Resolution Center explaining native features

---

**3. Guideline 5.1.1 - Privacy**
- **Reason:** Privacy policy missing or incomplete
- **Fix:**
  - Ensure https://whatscard.my/privacy is complete
  - Add "App Privacy" section in App Store Connect
  - Must explain data collection clearly
  - Must explain data sharing (WhatsApp integration)
- **Resubmit:** Update privacy policy, update App Privacy section

---

**4. Guideline 3.1.1 - In-App Purchase**
- **Reason:** IAP not implemented correctly
- **Fix:**
  - Ensure react-native-iap properly configured
  - Test subscription in sandbox
  - Can't link to external payment
  - Can't mention prices outside App Store
- **Resubmit:** Fix IAP implementation, new build

---

**5. Guideline 2.3.10 - Accurate Metadata**
- **Reason:** Screenshots misleading or low quality
- **Fix:**
  - Ensure screenshots show actual app
  - No misleading "fake" functionality
  - High resolution images
  - Accurate description
- **Resubmit:** Update screenshots, resubmit (no new build needed)

---

**6. Demo Account Issues**
- **Reason:** Reviewers can't login with demo account
- **Fix:**
  - Test demo account: demo@whatscard.my / Demo123!@#
  - Ensure account has sample data
  - Check Supabase auth is working
  - Add more detailed instructions
- **Response:** Reply via Resolution Center with working credentials

---

### Responding to Rejections

**Google Play:**
1. Check email for rejection reason
2. Read policy violation details carefully
3. Fix all issues mentioned
4. Update app if needed (new build)
5. Update store listing if needed
6. Click "Submit update" or "Appeal" if wrongly rejected

**App Store:**
1. Check Resolution Center in App Store Connect
2. Read rejection message carefully
3. Fix all issues mentioned
4. If code changes needed: Build new version (1.0.2)
5. If only metadata: Update and resubmit without new build
6. Reply via Resolution Center if you need clarification
7. Click "Submit for Review" again

---

### Expedited Review Requests

**Google Play:**
- Not available for initial submissions
- Only for existing apps with critical updates

**App Store:**
- Available but use sparingly
- Only for: Critical bugs, time-sensitive events
- **Process:**
  1. Go to App Store Connect
  2. Click on app version
  3. Request Expedited Review
  4. Provide justification (must be valid reason)
- **Approval:** Not guaranteed, reviewed by Apple

---

### Launch Day! 🚀

#### When Approved by Google Play

**Automatic Process:**
1. **Status changes:** Approved → Published
2. **Availability:** 2-4 hours globally
3. **Search visibility:** 24-48 hours for full indexing
4. **Store listing:** Live immediately after publishing

**Your Actions:**
1. Verify app appears on Play Store
   - Search: "WhatsCard"
   - Or direct link: https://play.google.com/store/apps/details?id=com.resultmarketing.whatscard
2. Test installation on Android device
3. Check all store listing elements display correctly
4. Monitor initial reviews

---

#### When Approved by App Store

**If "Manually Release" was selected:**

1. **Status:** Pending Developer Release
2. **Your Action Required:**
   - Go to App Store Connect
   - Navigate to: My Apps → WhatsCard → iOS App
   - Click: **"Release this version"**
   - Confirm release
3. **Processing time:** 15-30 minutes
4. **Availability:** 24 hours globally

**If "Automatic Release" was selected:**
- App goes live immediately after approval
- No action needed

**Your Actions:**
1. Verify app appears on App Store
   - Search: "WhatsCard"
   - Or direct link: Check App Store Connect for URL
2. Test installation on iPhone
3. Check all store listing elements display correctly
4. Monitor initial reviews
5. **Share App Store link:**
   - Format: https://apps.apple.com/app/id[APP_ID]
   - Get from App Store Connect → App Information

---

### Launch Checklist

**Immediately After Approval:**

- [ ] **Test Download (Both Stores)**
  - Install on fresh device
  - Test all core features
  - Verify no crashes on launch
  - Test OCR scanning
  - Test WhatsApp integration
  - Test in-app purchases (Pro subscription)

- [ ] **Monitor Real-Time**
  - Check crash reports (EAS + Store consoles)
  - Monitor first reviews
  - Check error logs in Supabase
  - Watch download numbers

- [ ] **Update Website**
  - Add App Store badge: [Download on App Store]
  - Add Play Store badge: [Get it on Google Play]
  - Update homepage with download links
  - Add "Download Now" CTAs

- [ ] **Social Media Announcement**
  - Prepare launch posts
  - Include app screenshots
  - Link to both stores
  - Use hashtags: #WhatsCard #BusinessNetworking #LaunchDay

- [ ] **Email Campaign**
  - Send to existing users/beta testers
  - "WhatsCard is now live!"
  - Include download links
  - Ask for reviews

- [ ] **Press Release** (Optional)
  - Send to tech blogs
  - Local business publications
  - Networking groups

---

### Week 1 Monitoring

**Daily Tasks:**

1. **Check Crash Reports**
   - EAS Dashboard: https://expo.dev/accounts/jacobai/projects/namecard-my
   - Google Play Console → Quality → Crashes
   - App Store Connect → TestFlight & App Analytics → Crashes

2. **Respond to Reviews**
   - Reply to all reviews within 24 hours
   - Thank positive reviews
   - Address negative reviews professionally
   - Offer support email for issues

3. **Monitor Analytics**
   - Downloads per day
   - Active users
   - Session duration
   - Feature usage
   - Conversion rate (Free → Pro)

4. **Support Tickets**
   - Check support@whatscard.my
   - Respond within 24 hours
   - Create FAQ for common issues

5. **Performance Tracking**
   - App load time
   - OCR accuracy
   - Crash-free rate (target: 99.5%+)
   - User retention (Day 1, Day 7, Day 30)

---

### Week 1 KPIs (Key Performance Indicators)

**Target Metrics:**

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Downloads Day 1 | 100+ | 500+ | 1,000+ |
| App Store Rating | 4.0+ | 4.5+ | 4.8+ |
| Crash-Free Rate | 98%+ | 99%+ | 99.9%+ |
| Conversion Rate (Free→Pro) | 1% | 3% | 5%+ |
| User Retention (Day 7) | 20% | 40% | 60%+ |
| Average Session Time | 3 min | 5 min | 10 min+ |

---

## TROUBLESHOOTING GUIDE

### Build Failures

#### Android Build Failed

**Error:** "Signing configuration error"

**Solution:**
```bash
cd NamecardMobile

# Clear credentials
npx eas credentials:delete

# Rebuild with fresh credentials
npx eas build --platform android --profile production --clear-credentials
```

---

**Error:** "Gradle build failed"

**Solution:**
```bash
# Check build logs
npx eas build:view --platform android

# Common fixes:
# 1. Update dependencies
npm install

# 2. Clear cache
npm run clean

# 3. Rebuild
npx eas build --platform android --profile production
```

---

#### iOS Build Failed

**Error:** "Provisioning profile error"

**Solution:**
```bash
cd NamecardMobile

# Clear credentials
npx eas credentials:delete

# Rebuild with fresh credentials
npx eas build --platform ios --profile production --clear-credentials

# Make sure:
# - Apple Developer account is active ($99 paid)
# - Correct Apple ID used for signing
# - 2FA enabled
```

---

**Error:** "Code signing failed"

**Solution:**
```bash
# Verify Apple ID
npx eas credentials

# Select: iOS → Manage credentials
# Verify: Certificates and Provisioning Profiles exist

# If missing, EAS will generate automatically
# You'll need to provide:
# - Apple ID
# - 2FA code
# - App-specific password (if using 2FA)
```

---

### Environment Variable Issues

**Error:** "Missing API key: SUPABASE_URL"

**Solution:**
```bash
# Check .env.production exists
cd NamecardMobile
cat .env.production

# If missing, create it:
cp .env.example .env.production

# Add production values:
SUPABASE_URL=https://wvahortlayplumgrcmvi.supabase.co
SUPABASE_ANON_KEY=your_key_here
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Rebuild
npx eas build --platform all --profile production
```

---

### Store Submission Issues

**Error:** "Bundle ID mismatch"

**Solution:**
1. Check app.json:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.whatscard.app"
       },
       "android": {
         "package": "com.whatscard.app"
       }
     }
   }
   ```

2. Ensure it matches:
   - Google Play Console → App Information → Package name
   - App Store Connect → App Information → Bundle ID

3. If mismatch:
   - For new app: Update app.json and rebuild
   - For existing app: Cannot change (create new app listing)

---

**Error:** "Build already exists with this version number"

**Solution:**
```bash
# Update version in app.json
# Change: "version": "1.0.1" → "1.0.2"

# Update iOS build number (optional)
# Change: "buildNumber": "1" → "2"

# Update Android versionCode (optional)
# Add to android section in app.json:
"versionCode": 2

# Rebuild
npx eas build --platform all --profile production
```

---

### App Crashes After Installation

**Error:** "App crashes on launch"

**Debug Steps:**
1. Check crash logs:
   - EAS: https://expo.dev
   - Google Play: Console → Quality → Crashes
   - App Store: Connect → Analytics → Crashes

2. Common causes:
   - Missing environment variables
   - Supabase connection error
   - Missing permissions
   - Native module configuration

3. Test locally:
   ```bash
   cd NamecardMobile
   npm run android  # Test on Android
   npm run ios      # Test on iOS
   ```

4. If local works but production crashes:
   - Check .env.production has correct values
   - Verify Supabase URL/keys are production keys
   - Rebuild with correct environment

---

**Error:** "Camera not working"

**Fix:**
1. Verify permissions in app.json:
   ```json
   {
     "ios": {
       "infoPlist": {
         "NSCameraUsageDescription": "This app needs camera access to scan business cards."
       }
     },
     "android": {
       "permissions": ["CAMERA"]
     }
   }
   ```

2. Check expo-camera plugin configured:
   ```json
   {
     "plugins": ["expo-camera"]
   }
   ```

3. Rebuild app

---

### In-App Purchase Not Working

**Error:** "Unable to fetch products"

**Debug:**
1. Verify product IDs match:
   - Code: `com.whatscard.app.pro.yearly`
   - Play Console: In-app products
   - App Store Connect: Subscriptions

2. Check IAP configuration:
   ```typescript
   // In iapService.ts
   const subscriptionSkus = [
     'com.whatscard.app.pro.yearly',
     'com.whatscard.app.enterprise.yearly'
   ];
   ```

3. Test in sandbox:
   - Android: Use test account
   - iOS: Use sandbox Apple ID

4. Verify products are "Active" in store consoles

---

## MARKETING & GROWTH (Post-Launch)

### App Store Optimization (ASO)

**Optimize Keywords:**
- Monitor keyword rankings weekly
- Test different keyword combinations
- Update keywords every 2-4 weeks (iOS only)
- Use ASO tools: Sensor Tower, App Annie, Mobile Action

**Optimize Screenshots:**
- A/B test different screenshots
- Update for seasonal campaigns
- Highlight new features
- Add text overlays for clarity

**Optimize Description:**
- Update with user testimonials
- Highlight popular features
- Add "As seen in..." if featured
- Update promotional text monthly (iOS)

---

### User Acquisition Strategies

**Organic:**
1. **App Store SEO:**
   - Optimize title and description
   - Encourage reviews (in-app prompts)
   - Respond to all reviews
   - Update app regularly

2. **Content Marketing:**
   - Blog posts about networking tips
   - Video tutorials on YouTube
   - LinkedIn articles for professionals
   - Guest posts on business blogs

3. **Social Media:**
   - Regular posts showcasing features
   - User testimonials and success stories
   - Behind-the-scenes development
   - Tips and tricks videos

4. **PR & Media:**
   - Press releases for major updates
   - Reach out to tech blogs
   - Business publications
   - Podcast interviews

---

**Paid:**
1. **Apple Search Ads:**
   - Target keywords: business card scanner, networking app
   - Budget: $10-50/day to start
   - Optimize for conversions
   - Target specific countries

2. **Google Ads (Play Store):**
   - App install campaigns
   - Target business professionals
   - Focus on high-intent keywords
   - Budget: $10-50/day

3. **Social Media Ads:**
   - Facebook/Instagram: Business professionals 25-50
   - LinkedIn: Premium placement for B2B
   - TikTok: Short demo videos
   - Budget: $20-100/day per platform

4. **Influencer Marketing:**
   - Partner with business influencers
   - LinkedIn influencers
   - Networking event organizers
   - Budget: $100-500 per post

---

### Growth Hacks

**Referral Program:**
- Reward users for referring friends
- Give 1 month Pro free for each referral
- Track referrals via unique codes

**WhatsApp Virality:**
- Add "Sent via WhatsCard" to messages
- Encourage sharing app link
- Create sharable templates

**Events & Partnerships:**
- Partner with networking events
- Offer bulk licenses for conferences
- Sponsor business meetups
- Provide free Pro for event attendees

**Product Hunt Launch:**
- Launch on Product Hunt
- Aim for top 5 of the day
- Engage with comments
- Drive traffic to app stores

---

## MAINTENANCE & UPDATES

### Monthly Tasks

**First Week of Month:**
- [ ] Review previous month's metrics
- [ ] Analyze user feedback
- [ ] Plan next feature update
- [ ] Check for dependency updates
- [ ] Review subscription metrics

**Second Week:**
- [ ] Start development on planned features
- [ ] Fix reported bugs
- [ ] Optimize performance issues
- [ ] Update tests

**Third Week:**
- [ ] Complete feature development
- [ ] Internal testing
- [ ] Beta testing (if applicable)
- [ ] Prepare release notes

**Fourth Week:**
- [ ] Build new version
- [ ] Submit updates to stores
- [ ] Monitor review
- [ ] Launch update

---

### Quarterly Updates

**Every 3 Months:**
- Major feature releases
- UI/UX improvements based on feedback
- Performance optimizations
- Security updates
- Marketing campaigns

---

### Annual Tasks

**Yearly:**
- [ ] Renew Apple Developer Program ($99)
- [ ] Review subscription pricing
- [ ] Major version update (2.0, 3.0)
- [ ] Comprehensive audit of app
- [ ] Review and update privacy policy
- [ ] Security audit
- [ ] User survey for feedback

---

## SUPPORT & RESOURCES

### Official Documentation
- **Expo:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **React Native:** https://reactnative.dev
- **Supabase:** https://supabase.com/docs

### Store Guidelines
- **Google Play:** https://play.google.com/console/about/guides/
- **App Store:** https://developer.apple.com/app-store/review/guidelines/

### Communities
- **Expo Discord:** https://chat.expo.dev
- **React Native Community:** https://www.reactnative.dev/community/overview
- **Supabase Discord:** https://discord.supabase.com

### Tools
- **EAS Dashboard:** https://expo.dev
- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **Supabase Dashboard:** https://app.supabase.com

---

## QUICK REFERENCE COMMANDS

### Build Commands
```bash
# Login to EAS
npx eas login

# Build Android (Production)
npx eas build --platform android --profile production

# Build iOS (Production)
npx eas build --platform ios --profile production

# Build both platforms
npx eas build --platform all --profile production

# Check build status
npx eas build:list

# Download build
npx eas build:download --platform android
npx eas build:download --platform ios

# View build logs
npx eas build:view --platform android
npx eas build:view --platform ios
```

### Submit Commands
```bash
# Submit to Google Play
npx eas submit --platform android --profile production

# Submit to App Store
npx eas submit --platform ios --profile production

# Submit to both
npx eas submit --platform all --profile production
```

### Maintenance Commands
```bash
# Update dependencies
npm run deps:update

# Type check
npm run type:check

# Lint
npm run lint:fix

# Test
npm test

# Clean cache
npm run clean

# Check environment
npm run doctor
```

---

## IMPORTANT CONTACTS

### Support
- **Technical Support:** support@whatscard.my
- **Business Inquiries:** business@whatscard.my

### Developer Accounts
- **Expo:** jacobai (owner)
- **Google Play:** [Your Google account]
- **Apple Developer:** [Your Apple ID]

### Project Links
- **EAS Project:** https://expo.dev/accounts/jacobai/projects/namecard-my
- **Supabase:** https://app.supabase.com/project/wvahortlayplumgrcmvi
- **GitHub:** https://github.com/Jacobngai/namecard-my

---

## CHECKLIST: READY TO PUBLISH?

### Pre-Submission Checklist

**Developer Accounts:**
- [ ] Expo account created
- [ ] Google Play Developer account ($25 paid)
- [ ] Apple Developer Program ($99 paid)
- [ ] Both accounts verified and active

**App Configuration:**
- [ ] app.json configured correctly
- [ ] app.config.js has production settings
- [ ] eas.json created with production profile
- [ ] Bundle IDs consistent (com.whatscard.app)
- [ ] Version number set (1.0.1)

**Environment:**
- [ ] .env.production created
- [ ] Supabase production keys added
- [ ] Gemini API key added
- [ ] OpenAI API key added
- [ ] All API keys tested and working

**Assets:**
- [ ] App icon ready (512×512 for Android, 1024×1024 for iOS)
- [ ] 8 screenshots per platform ready
- [ ] Feature graphic ready (Android only, 1024×500)
- [ ] Privacy policy published at whatscard.my/privacy
- [ ] Terms of service published at whatscard.my/terms

**Testing:**
- [ ] TypeScript type check passes
- [ ] Linter passes
- [ ] All tests pass
- [ ] App tested on physical Android device
- [ ] App tested on physical iOS device
- [ ] Camera scanning tested
- [ ] WhatsApp integration tested
- [ ] Export feature tested
- [ ] Pro subscription tested in sandbox

**Builds:**
- [ ] Android .aab generated successfully
- [ ] iOS .ipa generated successfully
- [ ] Both builds tested and working
- [ ] No crashes on launch
- [ ] All features working in production build

**Store Listings:**
- [ ] App name finalized
- [ ] Description written
- [ ] Keywords selected
- [ ] Content rating completed
- [ ] Privacy policy linked
- [ ] Support email configured
- [ ] Demo account created for reviewers

---

## FINAL NOTES

**Estimated Total Time to Launch:**
- Day 1: Setup (2-3 hours)
- Day 2: Builds (1 hour active, 45 min automated)
- Day 3: Screenshots (2-3 hours)
- Day 4: Submissions (2 hours)
- Day 5-7: Review monitoring (1 hour/day)
- **Total Active Work:** ~10-12 hours
- **Total Calendar Time:** 5-7 days

**Estimated Total Cost (Year 1):**
- Google Play: $25
- Apple Developer: $99
- **Total:** $124

**Success Probability:**
- With proper preparation: 95%+ approval rate
- First-time submissions: May need 1 revision
- Average: 1-2 submissions before approval

---

**Remember:** Publishing is an iterative process. Don't be discouraged by rejections - they're learning opportunities. Most successful apps go through 1-2 revisions before approval.

**Good luck with your launch! 🚀**

---

**Questions? Need help?**
- Email: support@whatscard.my
- This roadmap will be updated as you progress through each stage

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Ready to Execute
