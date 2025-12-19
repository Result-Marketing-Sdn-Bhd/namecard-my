# Deploy Receipt Validation System

This guide shows you how to deploy the server-side receipt validation system for iOS In-App Purchases.

## 📋 Prerequisites

- Supabase project set up
- Supabase CLI installed (`npm install -g supabase`)
- App Store Connect access (for shared secret)

---

## 🚀 Step-by-Step Deployment

### 1. Login to Supabase

```bash
supabase login
```

### 2. Link Your Project

```bash
cd NamecardMobile
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
- Go to https://supabase.com/dashboard
- Select your project
- Project ref is in the URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`

### 3. Run Database Migration

Create the subscriptions table:

```bash
supabase db push
```

This will run the migration file:
- `supabase/migrations/20251219_create_subscriptions_table.sql`

Verify in Supabase Dashboard → Database → Tables → You should see `subscriptions`

### 4. Set Up Apple Shared Secret

Get your App Store Connect Shared Secret:

1. Go to https://appstoreconnect.apple.com
2. Navigate to: **My Apps → [Your App] → App Information**
3. Scroll to **App-Specific Shared Secret**
4. Click **Generate** (or copy existing)

### 5. Add Environment Variables to Supabase

```bash
# Set the Apple Shared Secret
supabase secrets set APPLE_SHARED_SECRET=your_shared_secret_here
```

Verify secrets are set:
```bash
supabase secrets list
```

### 6. Deploy Edge Function

```bash
supabase functions deploy validate-receipt
```

**Expected output:**
```
Deploying function validate-receipt...
Function URL: https://[PROJECT_REF].supabase.co/functions/v1/validate-receipt
✅ Deployed successfully!
```

### 7. Test the Edge Function

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/validate-receipt' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "receipt": "test_receipt_data",
    "productId": "whatscard_premium_monthly",
    "userId": "test-user-id",
    "platform": "ios",
    "transactionId": "test-transaction"
  }'
```

**Expected response:**
```json
{
  "success": false,
  "error": "Apple validation failed with status: 21002"
}
```
(This is expected for test data - real receipts will validate successfully)

---

## 🔧 Configuration Check

Verify your setup:

### Check Environment Variables

```bash
# In your .env file
cat NamecardMobile/.env

# Should contain:
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Check Edge Function URL

The app will call:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/validate-receipt
```

This is automatically constructed in `iapService.ts` from `EXPO_PUBLIC_SUPABASE_URL`

---

## 📱 Testing Receipt Validation

### In iOS Simulator

1. **Make a test purchase** in the app
2. **Check logs** for validation attempt:
   ```
   LOG  [IAP Service] 🔐 Validating receipt on server...
   LOG  [IAP Service] 🔐 Validation URL: https://...
   LOG  [IAP Service] 🔐 Calling Edge Function...
   ```

3. **Expected result for simulator:**
   - Validation may fail (simulator receipts are different)
   - App falls back to local subscription (development mode)
   - This is NORMAL for simulator testing

### On Real Device (TestFlight)

1. **Install via TestFlight**
2. **Make a sandbox purchase**
3. **Check Supabase logs:**
   ```bash
   supabase functions logs validate-receipt
   ```

4. **Verify database:**
   - Go to Supabase Dashboard → Database → `subscriptions` table
   - You should see the subscription record

---

## 🔍 Troubleshooting

### Edge Function Not Found

```bash
# Check deployed functions
supabase functions list

# Redeploy if needed
supabase functions deploy validate-receipt
```

### Apple Validation Fails

**Status 21002**: Invalid receipt data
- Check that receipt is base64 encoded
- Verify using correct Apple endpoint (sandbox vs production)

**Status 21007**: Receipt is from sandbox
- Edge Function auto-retries with sandbox endpoint
- This is normal during testing

**Status 21008**: Receipt is from production
- Change to production Apple endpoint in Edge Function

### Database Error

```bash
# Check if table exists
supabase db diff

# Rerun migration
supabase db push
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Subscriptions table created in Supabase
- [ ] Edge Function deployed
- [ ] Apple Shared Secret configured
- [ ] Test purchase validated successfully on real device
- [ ] Subscription saved to database
- [ ] RLS policies working (users can only see their own)
- [ ] Error handling tested
- [ ] Fallback mode disabled for production builds

---

## 📊 Monitoring

### View Edge Function Logs

```bash
# Real-time logs
supabase functions logs validate-receipt --tail

# Recent logs
supabase functions logs validate-receipt --limit 100
```

### Check Subscriptions Table

```sql
-- In Supabase SQL Editor
SELECT
  id,
  user_id,
  product_id,
  platform,
  purchase_date,
  expiry_date,
  is_active,
  created_at
FROM subscriptions
WHERE is_active = true
ORDER BY created_at DESC;
```

### Check Active Subscriptions Count

```sql
SELECT COUNT(*) as active_subscriptions
FROM subscriptions
WHERE is_active = true
  AND expiry_date > NOW();
```

---

## 🔐 Security Notes

- ✅ Edge Function validates receipts server-side (secure)
- ✅ RLS ensures users can only see their own subscriptions
- ✅ Shared secret stored as environment variable (not in code)
- ✅ Fallback mode logs warnings (alerts you to validation issues)
- ⚠️ Disable fallback in production builds
- ⚠️ Monitor logs for validation failures

---

## 📚 Resources

- [Apple Receipt Validation](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [react-native-iap Receipt Validation](https://react-native-iap.dooboolab.com/docs/guides/receipt-validation)

---

## ✅ Success Criteria

You know it's working when:

1. ✅ Purchase completes in app
2. ✅ Edge Function logs show "✅ Apple receipt validated"
3. ✅ Subscription appears in Supabase `subscriptions` table
4. ✅ App logs show "✅ Receipt validated on server"
5. ✅ No fallback warnings in production

**Your receipt validation system is now deployed!** 🎉
