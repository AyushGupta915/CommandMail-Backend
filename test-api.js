require('dotenv').config();

console.log('Testing Gemini API Key...');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('API Key starts with AIza:', process.env.GEMINI_API_KEY?.startsWith('AIza'));
console.log('API Key length:', process.env.GEMINI_API_KEY?.length);

// Test the API
const { callLLM } = require('./services/llmService');

async function test() {
  try {
    console.log('\nCalling Gemini API...');
    
    const response = await callLLM(
      'You are a helpful assistant.',
      'Say "Hello! I am working correctly." and nothing else.'
    );
    
    console.log('\n✅ SUCCESS! Gemini API Response:');
    console.log(response);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

test();