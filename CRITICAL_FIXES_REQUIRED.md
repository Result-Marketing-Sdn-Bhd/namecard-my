# 🚨 CRITICAL FIXES REQUIRED BEFORE SUBMISSION

**Date:** January 9, 2025
**Priority:** URGENT - Must fix before building for App Store/Play Store

---

## 🔥 Issue #1: Hardcoded API Key in `eas.json` (SECURITY RISK)

### Problem:
Your Gemini API key is hardcoded in `eas.json` and will be embedded in the app binary.

**Location:** `NamecardMobile/eas.json` lines 27 and 47

**Current Code:**
```json
"env": {
  "GEMINI_API_KEY": "AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I"
}
```

### Why This is Critical:
- ❌ Anyone can decompile your app and extract the key
- ❌ Unauthorized usage could cost you money
- ❌ Apple may reject your app for security concerns
- ❌ Violates API security best practices

---

## ✅ HOW TO FIX (5 Minutes)

### Step 1: Add Key to EAS Secrets

Open terminal and run:

```bash
cd NamecardMobile
eas secret:create --scope project --name GEMINI_API_KEY --value AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I
```

Verify it was created:
```bash
eas secret:list
```

### Step 2: Remove from `eas.json`

Edit `NamecardMobile/eas.json` and remove the GEMINI_API_KEY lines:

**BEFORE:**
```json
{
  "build": {
    "preview": {
      "env": {
        "APP_ENV": "production",
        "SUPABASE_URL": "https://wvahortlayplumgrcmvi.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "GEMINI_API_KEY": "AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I",  // ❌ REMOVE
        "DEBUG_MODE": "false"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "SUPABASE_URL": "https://wvahortlayplumgrcmvi.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "GEMINI_API_KEY": "AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I",  // ❌ REMOVE
        "DEBUG_MODE": "false"
      }
    }
  }
}
```

**AFTER:**
```json
{
  "build": {
    "preview": {
      "env": {
        "APP_ENV": "production",
        "SUPABASE_URL": "https://wvahortlayplumgrcmvi.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "DEBUG_MODE": "false"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "SUPABASE_URL": "https://wvahortlayplumgrcmvi.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "DEBUG_MODE": "false"
      }
    }
  }
}
```

### Step 3: Verify Configuration

Your `app.config.js` already reads from `process.env.GEMINI_API_KEY`, so no code changes needed!

The key will be securely injected by EAS during build from the secret you created.

---

## 🔥 Issue #2: Hardcoded API Keys in Test Scripts

### Problem:
Test scripts have fallback API keys that will be committed to Git.

**Location:**
- `NamecardMobile/test-gemini-api.js` line 7
- `NamecardMobile/list-gemini-models.js` line 7

**Current Code:**
```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCjxgRC_QxNyubFnjLmHFxqyKM06xSSyEU';
```

### Fix:

**Option 1: Remove Fallback (Recommended)**
```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.error('Set it in .env file or pass as: GEMINI_API_KEY=xxx node test-gemini-api.js');
  process.exit(1);
}
```

**Option 2: Use .env File**
```javascript
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required in .env file');
}
```

---

## ⚠️ Issue #3: Bundle ID Mismatch (VERIFY)

### Problem:
Documentation and code have different bundle IDs.

**IAP_SETUP_GUIDE.md says:**
```
Bundle ID: com.alittlebetter.better
```

**app.json says:**
```json
"bundleIdentifier": "com.alittlebetter.alittlebetter"
```

### Fix:

**Step 1:** Check App Store Connect
- Go to App Store Connect → Your App → App Information
- Look at the "Bundle ID" field
- Note the exact bundle ID

**Step 2:** Update the Mismatch

If App Store has `com.alittlebetter.better`:
```json
// Update app.json line 22
"bundleIdentifier": "com.alittlebetter.better"
```

If App Store has `com.alittlebetter.alittlebetter`:
```markdown
// Update IAP_SETUP_GUIDE.md line 129
Bundle ID: com.alittlebetter.alittlebetter
```

**IMPORTANT:** The bundle ID MUST match exactly, or IAP products won't work!

---

## ✅ VERIFICATION CHECKLIST

After making fixes, verify:

```bash
# 1. Check eas.json has no hardcoded keys
cat NamecardMobile/eas.json | grep -i "AIza"
# Should return nothing

# 2. Verify EAS secret exists
cd NamecardMobile
eas secret:list
# Should show GEMINI_API_KEY

# 3. Run type check
npm run type:check
# Should pass with no errors

# 4. Test build configuration
eas build --platform ios --profile production --non-interactive
# Should show GEMINI_API_KEY in environment variables
```

---

## 🚀 AFTER FIXES - BUILD COMMANDS

### iOS Build (App Store)
```bash
cd NamecardMobile
eas build --platform ios --profile production
```

### Android Build (Play Store)
```bash
cd NamecardMobile
eas build --platform android --profile production
```

---

## ⏱️ ESTIMATED TIME

| Fix | Time | Priority |
|-----|------|----------|
| Remove API key from eas.json | 5 min | 🔴 CRITICAL |
| Add key to EAS Secrets | 2 min | 🔴 CRITICAL |
| Fix test scripts | 3 min | 🟡 MODERATE |
| Verify bundle ID | 2 min | 🟡 MODERATE |
| **TOTAL** | **12 min** | |

---

## 📞 NEED HELP?

If you encounter issues:

1. **EAS Secrets not working?**
   ```bash
   eas logout
   eas login
   eas secret:create --scope project --name GEMINI_API_KEY --value YOUR_KEY
   ```

2. **Build fails after removing key?**
   - Verify secret exists: `eas secret:list`
   - Check app.config.js reads from `process.env.GEMINI_API_KEY` (line 31)

3. **Bundle ID confusion?**
   - Check App Store Connect for the registered bundle ID
   - Make sure it matches app.json exactly

---

## ✅ ONCE FIXED

After applying these fixes:

1. ✅ Run: `npm run type:check` (should pass)
2. ✅ Commit changes to Git
3. ✅ Build with EAS: `eas build --platform ios --profile production`
4. ✅ Submit to App Store: `eas submit --platform ios --latest`

---

**Status:** Ready to fix - all issues have clear solutions!
**Estimated Total Time:** 15 minutes
**Impact:** Prevents app rejection and security vulnerabilities

