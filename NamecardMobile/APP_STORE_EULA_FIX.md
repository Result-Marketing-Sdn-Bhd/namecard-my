# App Store Connect EULA Fix Guide
## Guideline 3.1.2 - Missing Terms of Use (EULA) Link

Apple reviewer feedback: "The app's metadata is missing a functional link to the Terms of Use (EULA)"

---

## ✅ What We Fixed in the App

### 1. app.json Description (Updated)
Added EULA link to the app description:

```
WhatsCard - Smart Business Card Scanner. Scan, save, and connect with anyone on WhatsApp instantly. Transform paper cards into digital connections with AI-powered OCR technology.

Terms of Use (EULA): https://whatscard.netlify.app/terms-of-service
```

### 2. In-App Links (Already Present)
The PaywallScreen already contains:
- ✅ Clickable Terms of Use (EULA) link
- ✅ Clickable Privacy Policy link
- ✅ Subscription title ("Monthly Premium", "Yearly Premium")
- ✅ Subscription length (monthly/yearly)
- ✅ Subscription price (from App Store)
- ✅ Auto-renewal disclosure

---

## 🔧 Required Actions in App Store Connect

### Step 1: Update App Description

1. Go to **App Store Connect** → **Your App** → **App Information**
2. Under **"Promotional Text"** or **"Description"**, ADD this line at the end:

```
Terms of Use (EULA): https://whatscard.netlify.app/terms-of-service
```

**Full suggested description:**
```
WhatsCard - Smart Business Card Scanner

Transform business cards into digital connections instantly with AI-powered OCR technology.

✨ Key Features:
• AI-Powered OCR: Scan business cards with 99% accuracy
• WhatsApp Quick Connect: Message contacts instantly
• Voice Notes & Reminders: Add memos to any contact
• Export to Excel: Download your contact list anytime
• Cloud Sync: Access contacts from any device
• Offline-First: Works without internet connection

📱 Subscription Plans:
• Monthly Premium: $9.99/month
• Yearly Premium: $117.99/year (Save 18%)

All subscriptions include unlimited card scans, AI-powered OCR, WhatsApp integration, voice notes, Excel export, cloud sync, and priority support.

🔗 Important Links:
Privacy Policy: https://whatscard.netlify.app/privacy-policy
Terms of Use (EULA): https://whatscard.netlify.app/terms-of-service

💳 Subscription Terms:
• Payment charged to Apple ID at confirmation of purchase
• Subscription automatically renews unless canceled 24 hours before period ends
• Manage subscriptions in App Store account settings
• No refunds for unused portions of subscription period

📧 Support: info@whatscard.app
```

### Step 2: Add Custom EULA (Alternative Method)

If you prefer, you can upload a custom EULA instead:

1. Go to **App Store Connect** → **Your App** → **App Information**
2. Scroll to **"License Agreement"** section
3. Click **"Add Custom EULA"**
4. Copy the full text from: https://whatscard.netlify.app/terms-of-service
5. Paste it into the EULA text field
6. Click **"Save"**

**Note:** If you use a custom EULA, you don't need the link in the description.

### Step 3: Verify Privacy Policy Link

1. Confirm **"Privacy Policy URL"** field contains:
   ```
   https://whatscard.netlify.app/privacy-policy
   ```

### Step 4: Submit for Review

1. Save all changes
2. Go to the current version awaiting review
3. Click **"Reply in App Review"** and send this message:

```
Dear App Review Team,

Thank you for your feedback on Guideline 3.1.2.

I have updated the app metadata to include the Terms of Use (EULA) link as requested:

✅ App Description: Now includes "Terms of Use (EULA): https://whatscard.netlify.app/terms-of-service"
✅ Privacy Policy: Already present at https://whatscard.netlify.app/privacy-policy
✅ In-App Links: PaywallScreen contains functional links to both Terms and Privacy Policy
✅ Subscription Info: All required auto-renewal disclosures are present in the app

The app binary (v2.0.9) already contains all required subscription information as per Schedule 2:
• Title of subscription (Monthly Premium / Yearly Premium)
• Length of subscription (monthly / yearly)
• Price of subscription (fetched from App Store)
• Functional links to Terms of Use and Privacy Policy

Please let me know if you need any additional information.

Thank you for your time.
```

5. Click **"Submit"** to resubmit for review

---

## 📋 Verification Checklist

Before resubmitting, verify:

- [ ] App Description includes EULA link OR Custom EULA is uploaded
- [ ] Privacy Policy URL field is filled
- [ ] In-app PaywallScreen shows Terms & Privacy links (already done ✅)
- [ ] In-app subscription details show title, duration, price (already done ✅)
- [ ] Auto-renewal terms are disclosed (already done ✅)
- [ ] Replied to reviewer in App Review section

---

## 🔍 Why This Happened

Apple requires **BOTH**:
1. ✅ Links in the app binary (PaywallScreen) - **We had this**
2. ❌ Links in App Store Connect metadata - **We were missing this**

The reviewer specifically said: "A functional link to the Terms of Use (EULA). If you are using the standard Apple Terms of Use (EULA), include a link to the Terms of Use in the **App Description**."

---

## 📱 Next Steps

1. **Update App Store Connect** as described above (5 minutes)
2. **Reply to reviewer** with the confirmation message (2 minutes)
3. **Resubmit** for review
4. Apple typically reviews within 24-48 hours

---

## 🆘 If Review Fails Again

If Apple still rejects after this fix, it means:

1. **They can't access the URLs** - Check if https://whatscard.netlify.app is accessible from their network
2. **Content is insufficient** - The Terms of Use page needs to be more comprehensive
3. **Wrong location** - They expect the link in a different metadata field

In that case, reply to the reviewer asking:
```
Could you please clarify which specific metadata field should contain the EULA link?
I have added it to the App Description as specified in the rejection notice.
```

---

## ✅ Summary

**What changed:**
- Added EULA link to app.json description

**What you need to do:**
- Update App Description in App Store Connect to include EULA link
- Verify Privacy Policy URL is set
- Reply to reviewer confirming changes
- Resubmit for review

**URLs to use:**
- Terms of Use (EULA): `https://whatscard.netlify.app/terms-of-service`
- Privacy Policy: `https://whatscard.netlify.app/privacy-policy`
