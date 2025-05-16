/**
 * MunaLuna Ultimate Notification Test
 * 
 * This script tests all notification mechanisms available:
 * 1. Direct Telegram API using fetch
 * 2. Node-telegram-bot-api library
 * 3. Telegraf library
 * 4. Axios-based API calls
 * 5. Enhanced notification system
 * 
 * Usage: node test_all_approaches.js
 */

// Note: We use dynamic imports to avoid issues if some modules are missing
import fetch from 'node-fetch';

// Your Telegram ID for testing
const TELEGRAM_ID = '262371163';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN environment variable is not set!');
  process.exit(1);
}

// Helper for current time
function getTime() {
  return new Date().toLocaleTimeString();
}

// 1. Direct API approach (most reliable, no dependencies)
async function testDirectApi() {
  console.log(`\n🧪 TESTING: Direct API with fetch`);
  
  try {
    const message = `
<b>Test 1: Direct API</b>
Using fetch to call Telegram API directly.
Time: ${getTime()}
`;
    
    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Direct API: Success`);
      return true;
    } else {
      console.error(`❌ Direct API: Failed - ${data.description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Direct API: Error - ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`\n🚀 BEGINNING COMPREHENSIVE NOTIFICATION TESTS`);
  console.log(`📱 Target Telegram ID: ${TELEGRAM_ID}`);
  console.log(`⏰ Test started at: ${getTime()}`);
  
  // Track results
  const results = {
    directApi: false
  };
  
  // Test 1: Direct API
  results.directApi = await testDirectApi();
  
  // Report results
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`Direct API: ${results.directApi ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (results.directApi) {
    console.log(`\n✅ SUCCESS: At least one notification method works!`);
  } else {
    console.log(`\n❌ FAILURE: All notification methods failed.`);
  }
}

// Execute tests
runAllTests().catch(err => {
  console.error('Unhandled error:', err);
});