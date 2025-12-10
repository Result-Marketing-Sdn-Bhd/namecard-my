# Setup EAS Secret - Manual Steps

**Status:** You're already logged in as `jacobai` ✅

**Time Required:** 2 minutes

---

## 🚀 RUN THESE COMMANDS

Open your terminal (Command Prompt or PowerShell) and run:

### Step 1: Navigate to Project

```bash
cd C:\Users\Siow\Desktop\namecard-my\NamecardMobile
```

### Step 2: Create Environment Variable

```bash
eas env:create
```

**You'll be prompted with questions. Answer like this:**

```
? Select environment:
  → Select "production" (use arrow keys, press Enter)

? Enter the name of the variable:
  → Type: GEMINI_API_KEY

? Enter the value of GEMINI_API_KEY:
  → Paste: AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I

? Select visibility:
  → Select "Secret" (not "Public")

? Link variable to build profile(s)?
  → Select "production" (and "preview" if you want)
```

**Expected Success Message:**
```
✔ Created a new variable GEMINI_API_KEY on project @jacobai/namecard-my
```

---

## ✅ ALTERNATIVE: Quick One-Liner (If Supported)

Try this command (might work if your EAS CLI is updated):

```bash
cd C:\Users\Siow\Desktop\namecard-my\NamecardMobile
eas env:create --name GEMINI_API_KEY --value AIzaSyABNioMSGgsqGRym6djn4jp9WzL3eypA9I --environment production --visibility secret
```

If it asks for confirmation, type `y` and press Enter.

---

## 📋 VERIFY IT WORKED

After creating the variable, verify it exists:

```bash
eas env:list
```

**You should see:**
```
Environment variables for production:
┌──────────────────┬────────────┬────────────┐
│ Name             │ Value      │ Visibility │
├──────────────────┼────────────┼────────────┤
│ GEMINI_API_KEY   │ **hidden** │ Secret     │
└──────────────────┴────────────┴────────────┘
```

---

## 🎯 AFTER THIS IS DONE

Once you see the success message, you're ready to build!

### Build for iOS:

```bash
eas build --platform ios --profile production
```

### Build for Android:

```bash
eas build --platform android --profile production
```

---

## 🐛 TROUBLESHOOTING

### "Command not found: eas"

Install EAS CLI globally:
```bash
npm install -g eas-cli
```

### "Not authenticated"

Login again:
```bash
eas login
```

### "Variable already exists"

Delete and recreate:
```bash
eas env:delete GEMINI_API_KEY
eas env:create
```

### "Project not found"

Make sure you're in the correct directory:
```bash
cd C:\Users\Siow\Desktop\namecard-my\NamecardMobile
eas whoami
```

---

## ✅ SUCCESS INDICATORS

**Variable Created:**
```
✔ Created a new variable GEMINI_API_KEY
```

**Variable Listed:**
```
eas env:list
Shows: GEMINI_API_KEY | **hidden** | Secret
```

**Ready to Build:**
```
eas build --platform ios --profile production
Build should start without errors
```

---

## 📞 NEED HELP?

If you get stuck, copy the error message and let me know!

**Current Status:**
- ✅ Logged in as: jacobai
- ✅ Project: namecard-my
- ⏳ Need to run: `eas env:create`

