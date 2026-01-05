require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash';

async function testGemini() {
  console.log('\n=== TEST GEMINI API ===');
  console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
  console.log('Model:', MODEL_NAME);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: "Xin chao, ban la ai?"
      }]
    }]
  };
  
  try {
    console.log('\nGửi request...');
    const result = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.candidates && result.data.candidates[0]) {
      const aiResponse = result.data.candidates[0].content.parts[0].text;
      console.log('\n=== AI RESPONSE ===');
      console.log(aiResponse);
    }
    
  } catch (error) {
    console.log('\n❌ ERROR!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testGemini();
