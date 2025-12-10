/**
 * Check which Gemini API key is the correct one
 */

require('dotenv').config({ path: '.env.production' });

console.log('🔑 Checking Gemini API Keys...\n');

const envProductionKey = process.env.GEMINI_API_KEY;

console.log('📋 Keys Found:\n');

if (envProductionKey) {
  console.log('✅ .env.production file has:');
  console.log(`   ${envProductionKey.substring(0, 20)}...${envProductionKey.substring(envProductionKey.length - 4)}`);
  console.log(`   Full key: ${envProductionKey}`);
} else {
  console.log('❌ No GEMINI_API_KEY found in .env.production');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🎯 CORRECT API KEY FOR EAS SECRET:\n');
console.log(`   ${envProductionKey}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ This is the key you should have used when running:');
console.log(`   eas env:create`);
console.log('');
console.log('📝 To verify your EAS secret has the correct key, run:');
console.log('   eas env:list');
console.log('');
console.log('⚠️  If you used a different key, delete and recreate:');
console.log('   eas env:delete GEMINI_API_KEY');
console.log(`   eas env:create (then enter: ${envProductionKey})`);
console.log('');
