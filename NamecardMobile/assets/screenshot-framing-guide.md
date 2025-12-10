# 📸 WhatsCard - Screenshot Framing Guide

## Required Screenshots for Google Play Store

### Minimum Requirements
- **Quantity**: 2-8 screenshots
- **Dimensions**: 1080 x 2340 px (recommended)
- **Format**: PNG or JPEG
- **Aspect ratio**: 16:9 to 9:16

---

## Recommended Screenshot List

### 1. **Welcome/Onboarding Screen**
**Purpose**: First impression - show what the app does
**Screen to capture**: `AuthScreen.tsx` or initial welcome screen
**Key elements to show**:
- WhatsCard logo
- Main value proposition
- Login/signup buttons

---

### 2. **Business Card Scanning** ⭐ HERO SHOT
**Purpose**: Showcase the core AI scanning feature
**Screen to capture**: `CameraScreen.tsx` with camera active
**Key elements to show**:
- Camera viewfinder
- Business card in frame
- Scan button or scanning indicator
**Note**: This is your KILLER feature - make it screenshot #1 or #2!

---

### 3. **Contact List Screen**
**Purpose**: Show saved contacts and clean UI
**Screen to capture**: `ContactList.tsx` with populated contacts
**Key elements to show**:
- Multiple contact cards
- Search functionality
- WhatsApp icons visible
- Clean, organized layout

---

### 4. **Contact Detail View**
**Purpose**: Show individual contact information
**Screen to capture**: `ContactDetailModal.tsx` opened
**Key elements to show**:
- Complete contact info
- Business card image
- WhatsApp quick action button
- Edit/Delete options

---

### 5. **Edit Contact Screen**
**Purpose**: Show contact management capabilities
**Screen to capture**: `ContactForm.tsx` in edit mode
**Key elements to show**:
- All input fields (name, email, phone, company, etc.)
- Save button
- Clean form design

---

### 6. **WhatsApp Integration** (Optional but RECOMMENDED)
**Purpose**: Highlight the WhatsApp networking feature
**Screen to capture**: Contact list with WhatsApp actions visible
**Alternative**: Screenshot showing WhatsApp dialog/integration
**Key elements to show**:
- WhatsApp green color prominent
- "Message on WhatsApp" action
- Easy networking capability

---

### 7. **Premium Features** (Optional)
**Purpose**: Showcase Pro/Enterprise tier features
**Screen to capture**: Settings or premium features screen
**Key elements to show**:
- Voice notes
- Reminders
- Analytics
- Subscription tiers

---

### 8. **Profile/Settings** (Optional)
**Purpose**: Show app customization and account management
**Screen to capture**: `ProfileScreen.tsx` or `SettingsScreen.tsx`
**Key elements to show**:
- User profile
- Settings options
- Subscription status
- Logout/account options

---

## 🎨 Making Screenshots Look Professional

### Option A: Plain Screenshots (Quick)
Just take clean screenshots from the emulator/device.

### Option B: Add Device Frames (Professional)
Use online tools to add phone frames:

**Recommended Tools**:
1. **Mockuphone** - https://mockuphone.com/
   - Upload screenshots
   - Choose Android device frame
   - Download framed images

2. **Screely** - https://screely.com/
   - Clean browser mockups
   - Custom backgrounds
   - Free to use

3. **AppMockUp** - https://app-mockup.com/
   - Specifically for app store screenshots
   - Multiple device frames
   - Add text overlays

### Option C: Add Text Overlays (Advanced)
Add descriptive text to screenshots:
- "Scan Business Cards with AI"
- "Save & Organize Contacts"
- "Connect on WhatsApp Instantly"
- "Offline-First & Cloud Sync"

**Tools for text overlays**:
- Canva (free)
- Figma (free)
- Adobe Express (free tier)

---

## 📏 Screenshot Dimensions Guide

### For 1080 x 2340 (Standard Android)

**Taking screenshots**:
1. Open Android emulator
2. Set device to: **Pixel 5** or **Pixel 6** (these have 1080x2340 resolution)
3. Take screenshots with `Ctrl+S`

**If screenshots are wrong size**:
- Use online resizer: https://www.simpleimageresizer.com/
- Resize to: **1080 x 2340 pixels**
- Keep aspect ratio

---

## ✅ Screenshot Checklist

Before uploading to Play Console:

- [ ] Minimum 2 screenshots captured
- [ ] Screenshots show real app content (not mockups)
- [ ] No lorem ipsum or placeholder text
- [ ] All screenshots are same dimensions
- [ ] Resolution is 1080 x 2340 px (recommended)
- [ ] File format is PNG or JPEG
- [ ] File size under 8MB per screenshot
- [ ] Screenshots showcase key features
- [ ] WhatsApp integration is visible
- [ ] No personal/sensitive data visible
- [ ] Screenshots are in logical order (best first)

---

## 📋 Recommended Screenshot Order for Play Store

**Order matters!** Users see screenshots in order, so put your best first:

1. **Camera/Scanning** - Your hero feature
2. **Contact List** - Show the value
3. **Contact Detail** - Depth of features
4. **WhatsApp Integration** - Key differentiator
5. **Edit Contact** - Functionality
6. **Premium Features** - Upsell
7. **Settings/Profile** - Complete picture
8. **Welcome Screen** - Branding

---

## 🚀 Quick Steps to Get Started

1. **Run the app in Android emulator**:
   ```bash
   cd NamecardMobile
   npm run start:clear
   # Press 'a' for Android
   ```

2. **Navigate to each screen and press `Ctrl+S`** to capture

3. **Verify screenshot dimensions** (right-click → Properties → Details)

4. **Upload to Google Play Console**:
   - Store presence → Main store listing
   - Scroll to "Phone screenshots"
   - Upload 2-8 screenshots

---

## 💡 Pro Tips

- **Use real data**: Add sample contacts with realistic names/companies
- **Show features in action**: Not just empty screens
- **Highlight WhatsApp**: Your key selling point
- **Keep it clean**: No debug info, no status bar clutter
- **Consistent style**: All screenshots should match in quality
- **Test on device**: Make sure colors look good

---

## Need Help?

If screenshots don't look right or are wrong dimensions, ask Claude Code to:
1. Help resize images
2. Create framing templates
3. Add text overlays
4. Optimize image quality
