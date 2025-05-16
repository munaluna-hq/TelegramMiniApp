/**
 * MunaLuna: Comprehensive Notification Testing
 * 
 * This script tests all possible methods of sending notifications to Telegram
 * to find the most reliable approach that works in the Telegram Mini App environment.
 * 
 * Usage: node comprehensive_notification_test.js [telegram_id]
 * Default: 262371163 (known working ID)
 */

const directTelegramApi = require('./server/direct_telegram_api');
const { sendReliableNotification } = require('./server/better-notify');

// Verified working Telegram ID
const DEFAULT_TELEGRAM_ID = '262371163';

// Get Telegram ID from command line or use default
const telegramId = process.argv[2] || DEFAULT_TELEGRAM_ID;

async function runComprehensiveTests() {
  console.log(`\n🔍 Running Comprehensive Notification Tests`);
  console.log(`🆔 Using Telegram ID: ${telegramId}`);
  
  // First test: Direct API approach (most reliable)
  console.log(`\n🧪 TEST 1: Direct Telegram API Tests`);
  await directTelegramApi.testMultipleNotificationMethods(telegramId);
  
  // Second test: Enhanced notification approach
  console.log(`\n🧪 TEST 2: Enhanced Notification System`);
  const message = `<b>Enhanced Notification Test</b>\nThis is a test message sent via the enhanced notification system at ${new Date().toLocaleTimeString()}`;
  
  try {
    const result = await sendReliableNotification(telegramId, message);
    console.log(`📊 Enhanced notification result: ${result ? '✅' : '❌'}`);
  } catch (error) {
    console.error(`❌ Error with enhanced notification:`, error);
  }
  
  console.log(`\n✅ All notification tests completed!`);
  console.log(`Please check your Telegram app for received messages.`);
}

// Run the tests
runComprehensiveTests().catch(error => {
  console.error('Error running comprehensive tests:', error);
});