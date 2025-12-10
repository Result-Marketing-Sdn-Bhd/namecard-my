/**
 * Create demo@whatscard.app account for testing
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

async function createDemoUser() {
  console.log('🔧 Creating demo@whatscard.app account...\n');

  const email = 'demo@whatscard.app';
  const password = 'demo1234';

  try {
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Demo User',
        },
        emailRedirectTo: 'https://whatscard.netlify.app',
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);

      // Check if user already exists
      if (signUpError.message.includes('already registered')) {
        console.log('\n✅ User already exists. Trying to sign in...\n');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          console.log('\nThe user exists but password might be different.');
          console.log('You may need to reset the password via Supabase dashboard.\n');
        } else {
          console.log('✅ Successfully signed in!');
          console.log('User ID:', signInData.user.id);
          console.log('Email:', signInData.user.email);
          console.log('\n📝 Demo Account Credentials:');
          console.log('Email:', email);
          console.log('Password:', password);
        }
      }
      return;
    }

    console.log('✅ User created successfully!');
    console.log('User ID:', signUpData.user?.id || 'pending');
    console.log('Email:', signUpData.user?.email);

    if (signUpData.user) {
      // Update user profile in users table
      console.log('\n🔧 Setting up user profile...');

      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: signUpData.user.id,
          email: email,
          full_name: 'Demo User',
          tier: 'free',
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.log('⚠️  Profile update warning:', updateError.message);
        console.log('(This is okay - profile will be created on first login)');
      } else {
        console.log('✅ User profile created');
      }
    }

    console.log('\n📝 Demo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', email);
    console.log('Password: ', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT:');

    if (signUpData.user?.email_confirmed_at) {
      console.log('✅ Email is already verified - you can log in now!');
    } else {
      console.log('📧 Check email for verification link (if email confirmation is enabled)');
      console.log('   If you don\'t see it, the account may be auto-confirmed.');
    }

    console.log('\n💡 To disable email confirmation (for testing):');
    console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
    console.log('   2. Disable "Enable email confirmations"');
    console.log('   3. This allows immediate login without email verification\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

createDemoUser().then(() => {
  console.log('✅ Script complete');
  process.exit(0);
});
