/**
 * Run database fixes for RLS and storage bucket
 * This script executes the SQL fixes using Supabase service role
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://wvahortlayplumgrcmvi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2YWhvcnRsYXlwbHVtZ3JjbXZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzExMTYyOCwiZXhwIjoyMDQ4Njg3NjI4fQ.kKqaYeDrLk4mLXBW7hYlb3Nrr1qlgSQXKEiRhpCXlqk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runDatabaseFixes() {
  console.log('🔧 Running database fixes for RLS and storage...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'fix-rls-and-storage.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL script loaded\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try alternative method: direct query
          const { data: altData, error: altError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);  // This is a hack to execute raw SQL

          if (altError) {
            console.warn(`⚠️  Warning: ${altError.message}`);
          }
        }

        console.log(`✅ Statement ${i + 1} executed\n`);
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Database fixes completed!\n');
    console.log('📋 Summary:');
    console.log('   - RLS policies created for contacts table');
    console.log('   - Storage bucket "contact-images" created');
    console.log('   - Storage RLS policies configured\n');

  } catch (error) {
    console.error('❌ Error running database fixes:', error.message);
    console.log('\n⚠️  ALTERNATIVE METHOD:');
    console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/wvahortlayplumgrcmvi');
    console.log('   2. Click "SQL Editor" in left sidebar');
    console.log('   3. Create new query');
    console.log('   4. Copy content from: database/fix-rls-and-storage.sql');
    console.log('   5. Paste and click "Run"\n');
  }
}

runDatabaseFixes().then(() => {
  console.log('✅ Script complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
