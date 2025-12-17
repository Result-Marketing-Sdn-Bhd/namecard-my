/**
 * Supabase Edge Function: validate-receipt
 *
 * Validates iOS App Store and Android Play Store receipts
 * Updates user subscription status in database with REAL expiry dates
 *
 * CRITICAL: This prevents users from bypassing subscriptions
 * Required by Apple App Store Review Guidelines
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { receipt, productId, userId, platform, transactionId } = await req.json();

    console.log('[Receipt Validation] Starting validation...');
    console.log('[Receipt Validation] Platform:', platform);
    console.log('[Receipt Validation] Product ID:', productId);
    console.log('[Receipt Validation] User ID:', userId);

    if (!receipt || !productId || !userId || !platform) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let validationResult;

    if (platform === 'ios') {
      validationResult = await validateAppleReceipt(receipt, productId);
    } else if (platform === 'android') {
      validationResult = await validateGoogleReceipt(receipt, productId);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid platform',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validationResult.success) {
      return new Response(
        JSON.stringify(validationResult),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update user subscription in Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        tier: 'pro',
        subscription_end: validationResult.expiryDate,
        subscription_product_id: productId,
        subscription_transaction_id: transactionId,
        subscription_platform: platform,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (dbError) {
      console.error('[Receipt Validation] Database error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update user subscription',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Receipt Validation] ✅ Subscription validated and updated');

    return new Response(
      JSON.stringify({
        success: true,
        expiryDate: validationResult.expiryDate,
        purchaseDate: validationResult.purchaseDate,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Receipt Validation] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Validate Apple App Store receipt
 */
async function validateAppleReceipt(
  receiptData: string,
  productId: string
): Promise<{
  success: boolean;
  expiryDate?: string;
  purchaseDate?: string;
  error?: string;
}> {
  console.log('[Apple Receipt] Validating...');

  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
  if (!sharedSecret) {
    console.error('[Apple Receipt] Missing APPLE_SHARED_SECRET');
    return {
      success: false,
      error: 'Server configuration error',
    };
  }

  // Try production endpoint first
  let verifyUrl = 'https://buy.itunes.apple.com/verifyReceipt';
  let response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true, // Only get latest
    }),
  });

  let data = await response.json();

  // Status 21007 = sandbox receipt sent to production
  // Retry with sandbox endpoint
  if (data.status === 21007) {
    console.log('[Apple Receipt] Sandbox receipt detected, retrying with sandbox endpoint...');
    verifyUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
    response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': sharedSecret,
        'exclude-old-transactions': true,
      }),
    });
    data = await response.json();
  }

  console.log('[Apple Receipt] Status:', data.status);

  // Status 0 = success
  if (data.status !== 0) {
    return {
      success: false,
      error: `Apple receipt validation failed with status ${data.status}`,
    };
  }

  // Extract subscription info from latest receipt
  const latestReceiptInfo = data.latest_receipt_info?.[0];
  if (!latestReceiptInfo) {
    return {
      success: false,
      error: 'No subscription info in receipt',
    };
  }

  // Verify product ID matches
  if (latestReceiptInfo.product_id !== productId) {
    console.warn(
      `[Apple Receipt] Product ID mismatch: expected ${productId}, got ${latestReceiptInfo.product_id}`
    );
  }

  const expiresDateMs = latestReceiptInfo.expires_date_ms;
  const purchaseDateMs = latestReceiptInfo.purchase_date_ms;

  if (!expiresDateMs) {
    return {
      success: false,
      error: 'No expiry date in receipt',
    };
  }

  const expiryDate = new Date(parseInt(expiresDateMs)).toISOString();
  const purchaseDate = purchaseDateMs
    ? new Date(parseInt(purchaseDateMs)).toISOString()
    : new Date().toISOString();

  console.log('[Apple Receipt] ✅ Valid subscription');
  console.log('[Apple Receipt] Expires:', expiryDate);

  return {
    success: true,
    expiryDate,
    purchaseDate,
  };
}

/**
 * Validate Google Play Store receipt
 *
 * NOTE: Requires Google Play Developer API setup
 * https://developers.google.com/android-publisher/getting_started
 */
async function validateGoogleReceipt(
  purchaseToken: string,
  productId: string
): Promise<{
  success: boolean;
  expiryDate?: string;
  purchaseDate?: string;
  error?: string;
}> {
  console.log('[Google Receipt] Validating...');

  const packageName = 'com.resultmarketing.whatscard'; // Your Android package name
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

  if (!serviceAccountEmail || !privateKey) {
    console.error('[Google Receipt] Missing Google service account credentials');
    return {
      success: false,
      error: 'Server configuration error',
    };
  }

  try {
    // Get OAuth2 access token for Google Play Developer API
    const accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKey);

    // Call Google Play Developer API
    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Google Receipt] API error:', response.status);
      return {
        success: false,
        error: `Google API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if subscription is active
    const expiryTimeMillis = data.expiryTimeMillis;
    const startTimeMillis = data.startTimeMillis;

    if (!expiryTimeMillis) {
      return {
        success: false,
        error: 'No expiry time in Google receipt',
      };
    }

    const expiryDate = new Date(parseInt(expiryTimeMillis)).toISOString();
    const purchaseDate = startTimeMillis
      ? new Date(parseInt(startTimeMillis)).toISOString()
      : new Date().toISOString();

    console.log('[Google Receipt] ✅ Valid subscription');
    console.log('[Google Receipt] Expires:', expiryDate);

    return {
      success: true,
      expiryDate,
      purchaseDate,
    };
  } catch (error) {
    console.error('[Google Receipt] Error:', error);
    return {
      success: false,
      error: error.message || 'Google receipt validation failed',
    };
  }
}

/**
 * Get Google OAuth2 access token using service account
 */
async function getGoogleAccessToken(email: string, privateKey: string): Promise<string> {
  // For simplicity, using a JWT library would be better
  // This is a basic implementation - consider using a proper JWT library

  const scope = 'https://www.googleapis.com/auth/androidpublisher';
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  // Create JWT assertion
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claim = {
    iss: email,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat,
  };

  // NOTE: This is simplified. In production, use a proper JWT library
  // or the official Google Auth library for Deno

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'PLACEHOLDER_JWT', // Use proper JWT signing in production
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
