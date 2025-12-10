/**
 * Check if demo@whatscard.app exists in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDemoUser() {
  console.log('🔍 Checking for demo@whatscard.app in database...\n');

  try {
    // Check if user exists in users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at, tier, subscription_end')
      .eq('email', 'demo@whatscard.app');

    if (usersError) {
      console.error('❌ Error querying users table:', usersError.message);
    } else if (users && users.length > 0) {
      console.log('✅ User found in users table:');
      console.log(JSON.stringify(users[0], null, 2));
      console.log('\n');
    } else {
      console.log('❌ User NOT found in users table\n');
    }

    // Check auth.users (only service role can query this, so this might fail)
    console.log('Note: Cannot directly query auth.users with anon key\n');

    // Try to sign in to test credentials
    console.log('🔐 Testing login with demo@whatscard.app / demo1234...\n');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@whatscard.app',
      password: 'demo1234',
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      console.log('\nPossible reasons:');
      console.log('1. User does not exist');
      console.log('2. Wrong password');
      console.log('3. Email not verified');
      console.log('4. User disabled/deleted\n');
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', authData.user.id);
      console.log('Email:', authData.user.email);
      console.log('Email verified:', authData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkDemoUser().then(() => {
  console.log('✅ Check complete');
  process.exit(0);
});
