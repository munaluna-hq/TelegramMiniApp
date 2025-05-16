/**
 * MunaLuna Notification Direct Test
 * 
 * This script directly tests the new notification system
 * using the most direct approach to the Telegram API.
 * 
 * Usage: node verify_direct_notifications.js
 */

import * as directApi from './server/direct_telegram_api.js';

// Your verified Telegram ID 
const TELEGRAM_ID = '262371163';

// Function to get current time
function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

async function runDirectTest() {
  console.log(`\n🧪 Testing Direct Telegram API Notifications`);
  console.log(`📱 Sending to Telegram ID: ${TELEGRAM_ID}`);
  console.log(`⏰ Test started at: ${getCurrentTime()}`);
  
  // Create test message
  const message = `
<b>🔔 MunaLuna Direct API Test</b>

This is a direct API test at ${getCurrentTime()}.
Bypassing all libraries and middleware.

<i>If you see this message, the direct approach works!</i>
  `;
  
  try {
    // Send the message using direct API call
    const result = await directApi.sendDirectApiMessage(TELEGRAM_ID, message);
    
    if (result) {
      console.log(`\n✅ SUCCESS! Direct notification sent successfully.`);
    } else {
      console.log(`\n❌ FAILURE! Direct notification failed to send.`);
    }
  } catch (error) {
    console.error(`\n❌ ERROR! Exception occurred:`, error);
  }
}

// Run the test
runDirectTest().catch(err => {
  console.error('Unhandled error in test:', err);
});