const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvahortlayplumgrcmvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2YWhvcnRsYXlwbHVtZ3JjbXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzAxNjIsImV4cCI6MjA3MzMwNjE2Mn0.8PSz3NErD03kFmjm9uxNI4Z4bn52sjecsf6qANEawEg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setUnlimitedScans() {
  const email = 'zokeyot.siow@gmail.com';

  console.log('🔍 Searching for user with email:', email);

  // Query the users table to find the user ID
  const { data: users, error: queryError } = await supabase
    .from('users')
    .select('id, email, tier, daily_scan_count, total_scans')
    .eq('email', email);

  if (queryError) {
    console.error('❌ Error querying users:', queryError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('⚠️  User not found in users table.');
    console.log('ℹ️  They may need to sign in first to create their profile.');
    process.exit(1);
  }

  const user = users[0];
  console.log('✅ Found user:', {
    id: user.id,
    email: user.email,
    currentTier: user.tier,
    dailyScans: user.daily_scan_count,
    totalScans: user.total_scans
  });

  // Update user to enterprise tier (unlimited scans)
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({
      tier: 'enterprise',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select();

  if (updateError) {
    console.error('❌ Error updating user tier:', updateError.message);
    process.exit(1);
  }

  console.log('');
  console.log('✅ SUCCESS! User upgraded to Enterprise tier (unlimited scans)');
  console.log('📧 Email:', email);
  console.log('🎫 Tier: enterprise');
  console.log('♾️  Daily Limit: UNLIMITED');
  console.log('');
  console.log('The user now has unlimited scans!');
}

setUnlimitedScans();
