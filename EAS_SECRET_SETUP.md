# EAS Secret Setup for GEMINI_API_KEY

**Date:** January 9, 2025
**Status:** ✅ Required - API key removed from eas.json for security

---

## 🎯 What Changed

**Before:** Your Gemini API key was hardcoded in `eas.json` (insecure)
```json
"GEMINI_API_KEY": "AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I"  // ❌ Removed for security
```

**After:** The key will be stored securely in EAS Secrets and injected during build
```json
// No GEMINI_API_KEY in eas.json anymore - it's now secure! ✅
```

---

## 🔐 Setup EAS Secret (Required Before Next Build)

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### Step 2: Login to EAS

```bash
eas login
```

Use your Expo account credentials (email: associated with your project).

### Step 3: Navigate to Project Directory

```bash
cd C:\Users\Siow\Desktop\namecard-my\NamecardMobile
```

### Step 4: Create the Secret

```bash
eas secret:create --scope project --name GEMINI_API_KEY --value AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I
```

**Expected Output:**
```
✔ Created a new secret GEMINI_API_KEY on project @jacobai/namecard-my.
```

### Step 5: Verify Secret was Created

```bash
eas secret:list
```

**Expected Output:**
```
Secrets for this project:
┌──────────────────┬─────────────────────┬─────────────┐
│ Name             │ Updated at          │ Scope       │
├──────────────────┼─────────────────────┼─────────────┤
│ GEMINI_API_KEY   │ 2025-01-09 10:30 AM │ project     │
└──────────────────┴─────────────────────┴─────────────┘
```

---

## ✅ How It Works

### During Build:

1. **You run:** `eas build --platform ios --profile production`
2. **EAS automatically:**
   - Fetches `GEMINI_API_KEY` from secrets
   - Injects it into `process.env.GEMINI_API_KEY`
   - Your `app.config.js` reads it from environment variables
3. **Your app receives the key securely** without it being in source code

### In Your Code:

**app.config.js (Line 31)** - Already configured! ✅
```javascript
extra: {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",  // ✅ Reads from EAS secret
  // ... other config
}
```

**services/geminiOCR.ts** - Accesses via Constants:
```typescript
import Constants from 'expo-constants';
const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;
```

---

## 🧪 Testing Locally (Development)

For local development, you still use `.env.production` file:

**NamecardMobile/.env.production:**
```env
GEMINI_API_KEY=AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I
SUPABASE_URL=https://wvahortlayplumgrcmvi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**This file is ignored by Git** (listed in `.gitignore`), so it's safe for local development.

---

## 🚀 Build Commands (After Secret Setup)

### iOS Build (Production)

```bash
cd NamecardMobile
eas build --platform ios --profile production
```

### Android Build (Production)

```bash
cd NamecardMobile
eas build --platform android --profile production
```

### Preview Build (Testing)

```bash
eas build --platform ios --profile preview
```

---

## 🔍 Verify Secret is Being Used

When you run a build, check the build logs for:

```
✔ Using environment variables from EAS Secrets
  • GEMINI_API_KEY
```

This confirms the secret is being injected correctly.

---

## 🛠️ Managing Secrets

### List all secrets:
```bash
eas secret:list
```

### Delete a secret:
```bash
eas secret:delete --name GEMINI_API_KEY
```

### Update a secret:
```bash
eas secret:delete --name GEMINI_API_KEY
eas secret:create --scope project --name GEMINI_API_KEY --value NEW_KEY_HERE
```

---

## ⚠️ Important Notes

1. **Scope:** We used `--scope project` so the secret is available to this project only
2. **Alternative:** You can use account-level secrets with `--scope account` (shared across all projects)
3. **Security:** Secrets are encrypted and never logged in build output
4. **Git:** `.env.production` is in `.gitignore`, so local secrets won't be committed

---

## 🎯 Checklist Before Building

- [x] Remove hardcoded API key from `eas.json` ✅
- [ ] Login to EAS: `eas login`
- [ ] Create secret: `eas secret:create --scope project --name GEMINI_API_KEY --value AIza...`
- [ ] Verify secret: `eas secret:list`
- [ ] Build: `eas build --platform ios --profile production`

---

## 🐛 Troubleshooting

### Issue: "GEMINI_API_KEY is undefined in app"

**Cause:** Secret not created or app.config.js not reading it

**Fix:**
```bash
# 1. Check secret exists
eas secret:list

# 2. If not there, create it
eas secret:create --scope project --name GEMINI_API_KEY --value AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I

# 3. Rebuild
eas build --platform ios --profile production
```

### Issue: "Invalid API key" in production app

**Cause:** Wrong key stored in secret

**Fix:**
```bash
# Delete old secret
eas secret:delete --name GEMINI_API_KEY

# Create with correct key
eas secret:create --scope project --name GEMINI_API_KEY --value CORRECT_KEY_HERE
```

### Issue: "Not authenticated with EAS"

**Cause:** Not logged in

**Fix:**
```bash
eas logout
eas login
```

---

## 📚 More Information

- **EAS Secrets Docs:** https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables
- **Environment Variables:** https://docs.expo.dev/build-reference/variables/
- **Security Best Practices:** https://docs.expo.dev/build-reference/private-data/

---

**Status:** ✅ Ready to setup (takes ~2 minutes)
**Last Updated:** January 9, 2025

