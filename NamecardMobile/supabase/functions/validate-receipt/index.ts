import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Apple Receipt Validation Edge Function
 *
 * Validates iOS App Store receipts and creates/updates subscriptions
 *
 * POST /validate-receipt
 * Body: {
 *   receipt: string (base64 receipt data from iOS)
 *   productId: string
 *   userId: string
 *   platform: 'ios' | 'android'
 *   transactionId: string
 * }
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { receipt, productId, userId, platform, transactionId } = await req.json();

    console.log('[validate-receipt] Validating receipt for:', {
      productId,
      userId,
      platform,
      transactionId: transactionId?.substring(0, 10) + '...',
    });

    // Validate required fields
    if (!receipt || !productId || !userId || !platform) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: receipt, productId, userId, platform',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let validationResult;

    if (platform === 'ios') {
      // iOS Receipt Validation with Apple
      validationResult = await validateAppleReceipt(receipt, productId);
    } else if (platform === 'android') {
      // Android Receipt Validation with Google
      validationResult = await validateGoogleReceipt(receipt, productId);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid platform. Must be "ios" or "android"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validationResult.success) {
      console.error('[validate-receipt] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: validationResult.error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Save subscription to database
    // CRITICAL: Use SERVICE_ROLE_KEY for admin access (bypasses RLS)
    // Edge Functions need admin access to insert into subscriptions table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseClient
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          platform,
          transaction_id: transactionId,
          purchase_date: new Date(validationResult.purchaseDate).toISOString(),
          expiry_date: new Date(validationResult.expiryDate).toISOString(),
          is_active: true,
          receipt_data: receipt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[validate-receipt] Database error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save subscription',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[validate-receipt] ✅ Subscription saved for user:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        purchaseDate: validationResult.purchaseDate,
        expiryDate: validationResult.expiryDate,
        subscription: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[validate-receipt] Error:', error);
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
  receipt: string,
  productId: string
): Promise<{
  success: boolean;
  purchaseDate?: number;
  expiryDate?: number;
  error?: string;
}> {
  try {
    // CRITICAL: Check if this is a JWT token (react-native-iap v14+)
    // JWT tokens start with "eyJ" (base64 encoded {"alg":...)
    const isJWT = receipt.startsWith('eyJ');

    if (isJWT) {
      console.log('[validate-receipt] Detected JWT token format (react-native-iap v14+)');
      console.log('[validate-receipt] ⚠️ JWT validation requires App Store Server API');
      console.log('[validate-receipt] ⚠️ For now, falling back to accepting JWT as valid');

      // TODO: Implement proper JWT validation using App Store Server API
      // See: https://developer.apple.com/documentation/appstoreserverapi
      // For now, we'll decode the JWT and extract transaction info

      try {
        // Decode JWT payload (middle section between dots)
        const parts = receipt.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }

        const payload = JSON.parse(atob(parts[1]));
        console.log('[validate-receipt] JWT payload keys:', Object.keys(payload));

        // JWT contains transaction info - extract dates
        // Note: This is a simplified validation - production should verify signature
        const purchaseDate = payload.purchaseDate || payload.originalPurchaseDate || Date.now();
        const expiryDate = payload.expiresDate || (Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

        console.log('[validate-receipt] ✅ JWT decoded successfully');
        return {
          success: true,
          purchaseDate: typeof purchaseDate === 'number' ? purchaseDate : new Date(purchaseDate).getTime(),
          expiryDate: typeof expiryDate === 'number' ? expiryDate : new Date(expiryDate).getTime(),
        };
      } catch (jwtError) {
        console.error('[validate-receipt] Failed to decode JWT:', jwtError);
        return {
          success: false,
          error: `JWT decode failed: ${jwtError.message}`,
        };
      }
    }

    // Traditional base64 receipt validation
    console.log('[validate-receipt] Using traditional receipt validation');

    // Apple Receipt Validation Endpoint
    // Use sandbox for testing, production for live app
    const isDevelopment = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
    const appleUrl = isDevelopment
      ? 'https://sandbox.itunes.apple.com/verifyReceipt'
      : 'https://buy.itunes.apple.com/verifyReceipt';

    // Get shared secret from environment (from App Store Connect)
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    if (!sharedSecret) {
      console.warn('[validate-receipt] ⚠️ APPLE_SHARED_SECRET not set');
    }

    console.log('[validate-receipt] Calling Apple API:', appleUrl);

    const response = await fetch(appleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': sharedSecret || '',
        'exclude-old-transactions': true,
      }),
    });

    const result = await response.json();

    console.log('[validate-receipt] Apple response status:', result.status);

    // Status codes: https://developer.apple.com/documentation/appstorereceipts/status
    if (result.status === 21007) {
      // Receipt is from sandbox, retry with sandbox endpoint
      console.log('[validate-receipt] Retrying with sandbox endpoint...');
      return await validateAppleReceipt(receipt, productId);
    }

    if (result.status !== 0) {
      return {
        success: false,
        error: `Apple validation failed with status: ${result.status}`,
      };
    }

    // Find the subscription in the receipt
    const latestReceiptInfo = result.latest_receipt_info || [];
    const subscription = latestReceiptInfo.find(
      (item: any) => item.product_id === productId
    );

    if (!subscription) {
      return {
        success: false,
        error: 'Product not found in receipt',
      };
    }

    // Parse dates (Apple returns milliseconds as strings)
    const purchaseDate = parseInt(subscription.purchase_date_ms);
    const expiryDate = parseInt(subscription.expires_date_ms);

    console.log('[validate-receipt] ✅ Apple receipt validated');
    console.log('[validate-receipt] Purchase date:', new Date(purchaseDate).toISOString());
    console.log('[validate-receipt] Expiry date:', new Date(expiryDate).toISOString());

    return {
      success: true,
      purchaseDate,
      expiryDate,
    };
  } catch (error) {
    console.error('[validate-receipt] Apple validation error:', error);
    return {
      success: false,
      error: error.message || 'Apple validation failed',
    };
  }
}

/**
 * Validate Google Play receipt
 */
async function validateGoogleReceipt(
  receipt: string,
  productId: string
): Promise<{
  success: boolean;
  purchaseDate?: number;
  expiryDate?: number;
  error?: string;
}> {
  // TODO: Implement Google Play receipt validation
  // Requires Google Play Developer API credentials
  console.warn('[validate-receipt] Google Play validation not yet implemented');

  return {
    success: false,
    error: 'Google Play validation not implemented yet',
  };
}
