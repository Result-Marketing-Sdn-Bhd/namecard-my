# WhatsCard Legal Documents - Netlify Deployment Guide

## 📁 Files to Deploy

You have 4 HTML files ready to deploy:
- `index.html` - Landing page with links
- `privacy-policy.html` - Privacy Policy (GDPR/CCPA compliant)
- `terms-of-service.html` - Terms of Service
- `support.html` - Support page with FAQ

---

## 🚀 OPTION 1: Netlify Drag & Drop (Easiest - 3 minutes)

### Step 1: Go to Netlify
Open your browser and visit: **https://app.netlify.com/drop**

### Step 2: Drag & Drop
1. Open File Explorer
2. Navigate to: `C:\Users\Siow\Desktop\namecard-my\`
3. Select these 4 files:
   - `index.html`
   - `privacy-policy.html`
   - `terms-of-service.html`
   - `support.html`
4. Drag and drop them into the Netlify Drop zone

### Step 3: Wait for Deployment
- Netlify will upload and deploy automatically (30 seconds)
- You'll get a random URL like: `https://random-name-123456.netlify.app`

### Step 4: Test Your URLs
Your legal documents are now live at:
- Homepage: `https://random-name-123456.netlify.app/`
- Privacy: `https://random-name-123456.netlify.app/privacy-policy.html`
- Terms: `https://random-name-123456.netlify.app/terms-of-service.html`
- Support: `https://random-name-123456.netlify.app/support.html`

### Step 5: (Optional) Custom Domain
1. Click "Domain settings" in Netlify
2. Add custom domain: `whatscard.my` or `legal.whatscard.my`
3. Update DNS records (Netlify provides instructions)

---

## 🚀 OPTION 2: Netlify CLI (Advanced)

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Deploy
```bash
cd C:\Users\Siow\Desktop\namecard-my
netlify deploy --prod
```

### Step 4: Select Files
- Choose the current directory
- Site will be deployed automatically

---

## 🚀 OPTION 3: Netlify + GitHub (Best for Updates)

### Step 1: Create GitHub Repo
1. Go to: https://github.com/new
2. Name: `whatscard-legal`
3. Make it public or private
4. Don't add README

### Step 2: Push Files to GitHub
```bash
cd C:\Users\Siow\Desktop\namecard-my
git init
git add index.html privacy-policy.html terms-of-service.html support.html
git commit -m "Add legal documents"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/whatscard-legal.git
git push -u origin main
```

### Step 3: Connect to Netlify
1. Go to: https://app.netlify.com
2. Click "New site from Git"
3. Choose GitHub
4. Select `whatscard-legal` repository
5. Click "Deploy site"

**Benefit:** Every time you update files in GitHub, Netlify auto-deploys!

---

## 📝 AFTER DEPLOYMENT

### Update App Store Listings

Once deployed, update these URLs in your app store submissions:

**Apple App Store:**
- Privacy Policy URL: `https://your-site.netlify.app/privacy-policy.html`
- Terms of Service URL: `https://your-site.netlify.app/terms-of-service.html`
- Support URL: `https://your-site.netlify.app/support.html`

**Google Play Store:**
- Privacy Policy URL: `https://your-site.netlify.app/privacy-policy.html`
- Website URL: `https://your-site.netlify.app`

### Update app.json
```json
{
  "expo": {
    "privacyPolicy": "https://your-site.netlify.app/privacy-policy.html"
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:
- [ ] All 4 pages load correctly
- [ ] Links between pages work
- [ ] Mobile responsive (test on phone)
- [ ] Contact email works: info@whatscard.app
- [ ] No broken links or images
- [ ] SSL certificate active (https://)

---

## 🔧 TROUBLESHOOTING

**Issue: 404 Not Found**
- Solution: Make sure file names match exactly (case-sensitive)
- Check: `privacy-policy.html` not `Privacy-Policy.html`

**Issue: Contact form doesn't work**
- Solution: Setup Formspree (see support.html line 218)
- Or remove form and use email only

**Issue: Slow loading**
- Solution: Netlify has global CDN, should be fast
- Check: Browser cache (hard refresh: Ctrl+F5)

---

## 💡 RECOMMENDED SETUP

**For App Store Publishing:**
1. Use Netlify drag & drop (simplest)
2. Get the URL: `https://random-name.netlify.app`
3. Use this URL for App Store submissions
4. Later: Add custom domain `whatscard.my`

**Cost:** FREE (Netlify free tier includes):
- Unlimited bandwidth
- Automatic SSL certificate
- Global CDN
- 100 GB bandwidth/month

---

## 📧 NEXT STEPS AFTER DEPLOYMENT

1. ✅ Copy your Netlify URL
2. ✅ Add to app.json
3. ✅ Test all links work
4. ✅ Verify on mobile
5. ✅ Use URLs in App Store submissions

---

**Questions?** Contact: info@whatscard.app

**Last Updated:** January 2025
