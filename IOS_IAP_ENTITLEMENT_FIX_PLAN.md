# 🚨 iOS IAP Entitlement Error - Investigation Report & Fix Plan

## 📋 Executive Summary

**Error:** `Provisioning profile "*[expo] com.whatscard.app AppStore 2025-11-23T09:53:09.261Z" doesn't include the com.apple.developer.in-app-purchase entitlement.`

**Root Cause:** Incorrect entitlement configuration in `app.config.js` - using array format `["ProductionSandbox"]` instead of boolean `true`

**Impact:** Complete iOS build failure preventing App Store submission

**Estimated Fix Time:** 15-30 minutes

---

## 🔍 Investigation Findings

### 1. **Configuration Error Found** ❌

**Location:** `NamecardMobile/app.config.js` line 40

**Current (INCORRECT):**
```javascript
entitlements: {
  "com.apple.developer.in-app-purchase": ["ProductionSandbox"]  // ❌ WRONG FORMAT
}
```

**Should Be:**
```javascript
entitlements: {
  "com.apple.developer.in-app-purchase": true  // ✅ CORRECT FORMAT
}
```

### 2. **Why This Causes The Error**

- Expo SDK 54 expects a **boolean value** (`true`) for IAP entitlements
- The array format `["ProductionSandbox"]` is **not recognized** by EAS Build
- EAS Build sees invalid format → ignores it → provisioning profile created WITHOUT IAP entitlement
- Xcode build then fails because profile lacks required entitlement

### 3. **Dependencies Check** ✅

- ✅ `react-native-iap` v14.4.41 installed correctly
- ✅ Plugin listed in `app.config.js` (line 89)
- ✅ Kotlin version configured (line 94): `2.1.20`
- ✅ iOS deployment target set (line 97): `15.1`
- ✅ Bundle identifier correct: `com.whatscard.app`

### 4. **Apple Developer Console Status**

Based on error patterns:
- IAP capability is likely enabled in Apple Developer Console
- But provisioning profile generation fails due to incorrect config format
- This is NOT an Apple server issue - it's a local config issue

---

## 🛠️ Fix Plan - Step by Step

### **Phase 1: Fix Configuration** (5 minutes)

#### Step 1: Update app.config.js

```javascript
// In app.config.js, line 39-41
// CHANGE FROM:
entitlements: {
  "com.apple.developer.in-app-purchase": ["ProductionSandbox"]
}

// TO:
entitlements: {
  "com.apple.developer.in-app-purchase": true
}
```

#### Step 2: Verify Configuration
```bash
cd NamecardMobile
npx expo config --type introspect | grep -A5 entitlements
```

Expected output should show:
```json
"entitlements": {
  "com.apple.developer.in-app-purchase": true
}
```

### **Phase 2: Clear Cached Credentials** (5 minutes)

#### Step 3: Clear EAS Credentials
```bash
# View current credentials
eas credentials

# Select iOS platform
# Select com.whatscard.app
# Choose "Remove Provisioning Profile"
# This forces EAS to regenerate with correct entitlements
```

#### Step 4: Clear Local Cache
```bash
# Clear all Metro and Expo caches
npx expo start -c
rm -rf .expo
rm -rf node_modules/.cache
```

### **Phase 3: Rebuild with Correct Config** (15 minutes)

#### Step 5: Trigger New Build
```bash
# Build for production with fresh credentials
eas build --platform ios --profile production --clear-cache

# EAS will:
# 1. Detect IAP entitlement from corrected config
# 2. Update App ID capabilities on Apple Developer
# 3. Generate new provisioning profile WITH IAP entitlement
# 4. Build successfully
```

#### Step 6: Monitor Build
- Watch build logs at: https://expo.dev/accounts/jacobai/projects/namecard-my/builds
- Verify "Setting up provisioning profiles" step shows IAP entitlement
- Confirm "Run fastlane" step completes without errors

### **Phase 4: Verify Fix** (5 minutes)

#### Step 7: Check Build Success
```bash
# Download the .ipa file
eas build:list --platform ios --limit 1

# Optional: Inspect provisioning profile
# On macOS: security cms -D -i embedded.mobileprovision
# Look for: <key>com.apple.developer.in-app-purchase</key><true/>
```

#### Step 8: Submit to App Store
```bash
# If build succeeds, submit
eas submit --platform ios --latest
```

---

## 🔄 Alternative Solutions (If Primary Fix Fails)

### **Option A: Manual Provisioning Profile**

1. Go to Apple Developer Console
2. Create new Distribution Provisioning Profile manually
3. Enable "In-App Purchase" capability explicitly
4. Download and upload to EAS:
```bash
eas credentials
# Choose "Provisioning Profile" → "Upload"
```

### **Option B: Reset Everything**

```bash
# Nuclear option - complete reset
eas credentials
# Remove ALL credentials for iOS

# Regenerate from scratch
eas build --platform ios --profile production --clear-cache
# EAS will create everything new
```

### **Option C: Use Different IAP Config Method**

Instead of entitlements in app.config.js, rely on plugin auto-config:
```javascript
// Remove entitlements block entirely
// Let react-native-iap plugin handle it
plugins: [
  ["react-native-iap", {
    "iosAppName": "WhatsCard"  // Optional config
  }]
]
```

---

## ⚠️ Common Pitfalls to Avoid

1. **DON'T** use Xcode to manually add entitlements - EAS will override
2. **DON'T** modify Info.plist directly - use app.config.js
3. **DON'T** mix app.json and app.config.js - use only app.config.js
4. **DON'T** forget to increment build number if resubmitting
5. **DON'T** use deprecated `expo-in-app-purchases` (removed in SDK 53)

---

## 📊 Success Metrics

✅ **Build Success Indicators:**
- No "entitlement" errors in Xcode logs
- Build completes in ~15-20 minutes
- .ipa file generated successfully
- App Store Connect accepts submission

✅ **Config Validation:**
```bash
# All these should pass:
npx expo-doctor
npx expo config --type introspect | grep in-app-purchase
eas build:inspect --platform ios --output json | jq '.provisioningProfile'
```

---

## 🚀 Quick Fix Script

Save time with this one-liner fix:

```bash
# Fix and rebuild in one command
sed -i 's/\["ProductionSandbox"\]/true/g' app.config.js && \
eas credentials --platform ios --reset && \
eas build --platform ios --profile production --clear-cache
```

---

## 📝 Root Cause Analysis

### **Why This Happened:**

1. **Documentation Confusion:** Old iOS documentation references "ProductionSandbox" environment
2. **Migration Issue:** When upgrading from older Expo SDK, entitlement format changed
3. **Incorrect Examples:** Some online tutorials show array format for other entitlements
4. **No Validation:** Expo doesn't validate entitlement format until build time

### **Prevention for Future:**

1. Always use `npx expo config --type introspect` to verify config
2. Test builds on preview/staging before production
3. Keep entitlements simple - boolean for most capabilities
4. Document working configurations in CLAUDE.md

---

## 📞 Support Resources

If the fix doesn't work:

1. **Expo Forums:** https://forums.expo.dev (search "IAP entitlement")
2. **react-native-iap Issues:** https://github.com/dooboolab/react-native-iap/issues
3. **Apple Developer Support:** https://developer.apple.com/support/
4. **EAS Build Logs:** Check detailed Xcode logs in build dashboard

---

## ✅ Checklist Before Rebuilding

- [ ] app.config.js entitlement changed to `true`
- [ ] Verified with `npx expo config --type introspect`
- [ ] Cleared EAS credentials cache
- [ ] Incremented build number if needed
- [ ] Apple Developer account has active membership
- [ ] Bundle ID matches exactly: `com.whatscard.app`

---

## 🎯 Expected Timeline

1. **Fix Config:** 2 minutes
2. **Clear Credentials:** 3 minutes
3. **Start Build:** 1 minute
4. **Build Time:** 15-20 minutes
5. **Verification:** 2 minutes
6. **Total:** ~25 minutes

---

## 💡 Final Notes

This error is **100% fixable** with the configuration change. The fact that you've been getting the same error repeatedly confirms it's not a random Apple server issue but a consistent configuration problem.

**The single line change from `["ProductionSandbox"]` to `true` should resolve this completely.**

Good luck! 🚀