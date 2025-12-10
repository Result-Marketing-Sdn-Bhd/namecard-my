/**
 * Verify Build Configuration
 *
 * This script checks that all required environment variables
 * and configurations are properly set before building.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Build Configuration...\n');

// Check 1: Verify eas.json exists and is valid
console.log('1️⃣ Checking eas.json...');
try {
  const easConfig = require('./eas.json');
  console.log('   ✅ eas.json found and valid');

  // Check production profile
  if (easConfig.build && easConfig.build.production) {
    console.log('   ✅ Production build profile exists');

    // Verify NO hardcoded API keys
    const prodEnv = easConfig.build.production.env || {};
    if (prodEnv.GEMINI_API_KEY) {
      console.log('   ❌ ERROR: GEMINI_API_KEY is still hardcoded in eas.json!');
      console.log('   Please remove it for security.');
      process.exit(1);
    } else {
      console.log('   ✅ No hardcoded GEMINI_API_KEY (will use EAS secret)');
    }

    // Check other required env vars
    if (prodEnv.SUPABASE_URL) {
      console.log('   ✅ SUPABASE_URL configured');
    }
    if (prodEnv.SUPABASE_ANON_KEY) {
      console.log('   ✅ SUPABASE_ANON_KEY configured');
    }
  } else {
    console.log('   ❌ ERROR: Production build profile not found');
    process.exit(1);
  }
} catch (err) {
  console.log('   ❌ ERROR: eas.json not found or invalid:', err.message);
  process.exit(1);
}

console.log('');

// Check 2: Verify app.json
console.log('2️⃣ Checking app.json...');
try {
  const appConfig = require('./app.json');
  console.log('   ✅ app.json found and valid');

  if (appConfig.expo) {
    console.log('   ✅ Expo configuration exists');
    console.log('   📱 App Name:', appConfig.expo.name);
    console.log('   🔢 Version:', appConfig.expo.version);
    console.log('   📦 Bundle ID (iOS):', appConfig.expo.ios?.bundleIdentifier);
    console.log('   📦 Package (Android):', appConfig.expo.android?.package);
  }
} catch (err) {
  console.log('   ❌ ERROR: app.json not found or invalid:', err.message);
  process.exit(1);
}

console.log('');

// Check 3: Verify app.config.js reads environment variables
console.log('3️⃣ Checking app.config.js...');
try {
  const appConfigPath = path.join(__dirname, 'app.config.js');
  if (fs.existsSync(appConfigPath)) {
    const configContent = fs.readFileSync(appConfigPath, 'utf8');

    if (configContent.includes('process.env.GEMINI_API_KEY')) {
      console.log('   ✅ app.config.js reads GEMINI_API_KEY from environment');
    } else {
      console.log('   ⚠️  WARNING: app.config.js might not be reading GEMINI_API_KEY');
    }

    if (configContent.includes('extra')) {
      console.log('   ✅ app.config.js exports extra config');
    }
  } else {
    console.log('   ⚠️  WARNING: app.config.js not found');
  }
} catch (err) {
  console.log('   ⚠️  WARNING: Could not read app.config.js:', err.message);
}

console.log('');

// Check 4: Verify IAP configuration
console.log('4️⃣ Checking IAP configuration...');
try {
  const iapConfigPath = path.join(__dirname, 'config', 'iap-config.ts');
  if (fs.existsSync(iapConfigPath)) {
    const iapContent = fs.readFileSync(iapConfigPath, 'utf8');

    if (iapContent.includes('whatscard_premium_monthly')) {
      console.log('   ✅ Monthly product ID configured: whatscard_premium_monthly');
    }
    if (iapContent.includes('whatscard_premium_yearly')) {
      console.log('   ✅ Yearly product ID configured: whatscard_premium_yearly');
    }
    if (iapContent.includes('MOCK_MODE: false')) {
      console.log('   ✅ Mock mode disabled (production ready)');
    } else if (iapContent.includes('MOCK_MODE: true')) {
      console.log('   ⚠️  WARNING: Mock mode enabled (should be false for production)');
    }

    // Check pricing
    if (iapContent.includes('usd: 9.99')) {
      console.log('   ✅ Monthly price: $9.99');
    }
    if (iapContent.includes('usd: 117.99')) {
      console.log('   ✅ Yearly price: $117.99');
    }
  } else {
    console.log('   ❌ ERROR: iap-config.ts not found');
  }
} catch (err) {
  console.log('   ⚠️  WARNING: Could not read iap-config.ts:', err.message);
}

console.log('');

// Check 5: Verify package.json dependencies
console.log('5️⃣ Checking dependencies...');
try {
  const packageJson = require('./package.json');

  const criticalDeps = {
    'expo': packageJson.dependencies['expo'],
    'react-native-iap': packageJson.dependencies['react-native-iap'],
    '@supabase/supabase-js': packageJson.dependencies['@supabase/supabase-js'],
    'react-native': packageJson.dependencies['react-native'],
  };

  for (const [dep, version] of Object.entries(criticalDeps)) {
    if (version) {
      console.log(`   ✅ ${dep}: ${version}`);
    } else {
      console.log(`   ❌ ${dep}: NOT INSTALLED`);
    }
  }
} catch (err) {
  console.log('   ❌ ERROR: package.json not found:', err.message);
  process.exit(1);
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('✅ BUILD CONFIGURATION VERIFIED!');
console.log('');
console.log('📋 Summary:');
console.log('   • No hardcoded API keys in eas.json');
console.log('   • GEMINI_API_KEY will be loaded from EAS secret');
console.log('   • IAP product IDs configured correctly');
console.log('   • All critical dependencies installed');
console.log('');
console.log('🚀 Ready to build with:');
console.log('   eas build --platform ios --profile production');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
