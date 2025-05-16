/**
 * MunaLuna: Test Multi-Approach Notification System
 * 
 * This script demonstrates the enhanced multi-approach notification system
 * that uses multiple delivery methods with fallbacks to ensure notifications
 * are delivered reliably in the Telegram Mini App environment.
 * 
 * Usage: node test_multi_approach_notifications.js [telegram_id]
 * Default: 262371163 (known working test ID)
 */

// Import necessary modules
const fetch = require('node-fetch');

// Default Telegram ID for testing (change this to your own ID for testing)
const DEFAULT_TELEGRAM_ID = '262371163';

// Get telegram ID from command line if provided
const telegramId = process.argv[2] || DEFAULT_TELEGRAM_ID;

// Test each notification type with multi-approach system
async function testMultiApproachNotificationSystem() {
  console.log(`\n🌙 MunaLuna Multi-Approach Notification System Test 🌙`);
  console.log(`Testing notifications for Telegram ID: ${telegramId}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // 1. Test direct API notification (most reliable approach)
    console.log(`\n--- 1. Testing Direct API Notification ---`);
    const directApiResponse = await fetch('http://localhost:5000/api/direct-api-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, message: '🔔 Тест 1: Прямой API подход' })
    });
    const directApiResult = await directApiResponse.json();
    console.log(`Direct API Result: ${directApiResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // 2. Test reliable notification with fallbacks
    console.log(`\n--- 2. Testing Reliable Notification with Fallbacks ---`);
    const sendDirectTestResponse = await fetch('http://localhost:5000/api/send-direct-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId })
    });
    const sendDirectTestResult = await sendDirectTestResponse.json();
    console.log(`Reliable Notification Result: ${sendDirectTestResult.success ? '✅ Success' : '❌ Failed'}`);

    // 3. Test legacy notification approach
    console.log(`\n--- 3. Testing Legacy Notification Approach ---`);
    const legacyResponse = await fetch('http://localhost:5000/api/send-test-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        telegramId, 
        message: '🔔 Тест 3: Проверка устаревшего подхода' 
      })
    });
    const legacyResult = await legacyResponse.json();
    console.log(`Legacy Approach Result: ${legacyResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // Display summary
    console.log(`\n===== NOTIFICATION TEST SUMMARY =====`);
    console.log(`Direct API Method: ${directApiResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Reliable with Fallbacks: ${sendDirectTestResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Legacy Approach: ${legacyResult.success ? '✅ Success' : '❌ Failed'}`);
    
    if (directApiResult.success || sendDirectTestResult.success || legacyResult.success) {
      console.log(`\n✅ NOTIFICATION SYSTEM IS WORKING! At least one approach succeeded.`);
      if (directApiResult.success) {
        console.log(`The most reliable Direct API approach is working! 🎉`);
      }
    } else {
      console.log(`\n❌ ALL NOTIFICATION APPROACHES FAILED`);
      console.log(`Please check Telegram Bot Token and ensure webhook is properly set.`);
    }
    
  } catch (error) {
    console.error(`Error running notification tests:`, error);
  }
}

// Run the tests
testMultiApproachNotificationSystem();