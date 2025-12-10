/**
 * Test Gemini API connectivity and quota
 */

require('dotenv').config({ path: '.env.production' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.error('');
    console.error('Please set it in one of these ways:');
    console.error('1. Create .env.production file with: GEMINI_API_KEY=your_key_here');
    console.error('2. Run: GEMINI_API_KEY=your_key_here node test-gemini-api.js');
    console.error('');
    process.exit(1);
  }

  console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 20)}...` : 'NOT FOUND');
  console.log('API URL:', API_URL);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Simple text generation
  console.log('Test 1: Simple text generation request...\n');

  const requestBody = {
    contents: [{
      parts: [{
        text: 'Say "Hello, API is working!"'
      }]
    }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 100
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:');
      console.error('Status:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(data, null, 2));

      if (response.status === 429) {
        console.log('\n🚨 QUOTA EXCEEDED!');
        console.log('You have hit your Gemini API quota limit.');
        console.log('\n💡 Solutions:');
        console.log('1. Wait for quota to reset (resets daily)');
        console.log('2. Enable billing in Google Cloud Console');
        console.log('3. Use a different API key');
        console.log('4. Switch to paid tier: $0.50 per 1M characters\n');
      } else if (response.status === 400) {
        console.log('\n⚠️  Bad Request - Check API key validity');
      } else if (response.status === 403) {
        console.log('\n⚠️  Forbidden - API key may be restricted or invalid');
      }

      return;
    }

    console.log('✅ API Response Received!');

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('Response:', text);
      console.log('\n✅ Gemini API is working correctly!\n');
    } else {
      console.log('⚠️  Unexpected response structure:', JSON.stringify(data, null, 2));
    }

    // Check usage metadata
    if (data.usageMetadata) {
      console.log('📊 Usage Statistics:');
      console.log('   Prompt tokens:', data.usageMetadata.promptTokenCount);
      console.log('   Response tokens:', data.usageMetadata.candidatesTokenCount);
      console.log('   Total tokens:', data.usageMetadata.totalTokenCount);
      console.log('');
    }

  } catch (err) {
    console.error('❌ Network Error:', err.message);
    console.log('\nPossible causes:');
    console.log('1. No internet connection');
    console.log('2. Firewall blocking the request');
    console.log('3. Gemini API servers down\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Summary:\n');
  console.log('If you see "✅ API is working", your Gemini integration is fine.');
  console.log('If you see "❌ QUOTA EXCEEDED", you need to enable billing or wait.');
  console.log('If you see network errors, check your internet connection.\n');
}

testGeminiAPI().then(() => {
  console.log('✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
