/**
 * List available Gemini models to find the correct model name
 */

require('dotenv').config({ path: '.env.production' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  console.log('🔍 Fetching available Gemini models...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.error('');
    console.error('Please set it in one of these ways:');
    console.error('1. Create .env.production file with: GEMINI_API_KEY=your_key_here');
    console.error('2. Run: GEMINI_API_KEY=your_key_here node list-gemini-models.js');
    console.error('');
    process.exit(1);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Available models:\n');

    if (data.models && Array.isArray(data.models)) {
      data.models.forEach((model) => {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Supported: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });

      // Find vision models
      const visionModels = data.models.filter(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('vision') || m.name.includes('flash') || m.name.includes('pro'))
      );

      console.log('\n🎯 Recommended models for OCR (with vision/multimodal support):\n');
      visionModels.forEach(m => {
        console.log(`✨ ${m.name}`);
        console.log(`   ${m.displayName || ''}`);
      });
    }

  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

listModels().then(() => {
  console.log('\n✅ Done');
  process.exit(0);
});
