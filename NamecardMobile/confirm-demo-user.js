/**
 * Manually confirm demo@whatscard.app email via admin API
 * This bypasses email verification for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2YWhvcnRsYXlwbHVtZ3JjbXZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzExMTYyOCwiZXhwIjoyMDQ4Njg3NjI4fQ.kKqaYeDrLk4mLXBW7hYlb3Nrr1qlgSQXKEiRhpCXlqk';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmDemoUser() {
  console.log('🔧 Confirming demo@whatscard.app email...\n');

  try {
    // Use admin API to update user
    const { data, error } = await supabase.auth.admin.updateUserById(
      '0a9867fe-8873-41e0-9175-92eb9e736a47',
      {
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo User'
        }
      }
    );

    if (error) {
      console.error('❌ Failed to confirm email:', error.message);
      console.log('\nAlternative: Disable email confirmation in Supabase Dashboard');
      console.log('Authentication → Settings → Disable "Enable email confirmations"\n');
    } else {
      console.log('✅ Email confirmed successfully!');
      console.log('User:', data.user.email);
      console.log('Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('\n📝 You can now log in with:');
      console.log('Email:    demo@whatscard.app');
      console.log('Password: demo1234\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

confirmDemoUser().then(() => {
  console.log('✅ Script complete');
  process.exit(0);
});
