/**
 * MunaLuna Telegram Mini App Notification Test
 *
 * This script tests the specialized notification method that is designed
 * to work properly within the actual Telegram Mini App environment.
 */

import * as miniAppNotify from './server/mini_app_notification.js';

// Default test Telegram ID
const TELEGRAM_ID = '262371163';

async function testMiniAppNotifications() {
  console.log(`\n🌙 Testing Telegram Mini App Notifications 🌙`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  // Create a test message
  const testMessage = `
📝 <b>Тест уведомлений MunaLuna</b>

Это тестовое уведомление для проверки работы в Telegram Mini App.

⏰ Время: ${new Date().toLocaleTimeString()}
🔄 Тип теста: Специализированные уведомления Mini App

Если вы видите это сообщение в Telegram, значит система уведомлений работает правильно!
  `;
  
  try {
    console.log(`Sending Mini App notification to ${TELEGRAM_ID}...`);
    
    // Try the specialized Mini App notification method
    const result = await miniAppNotify.sendMiniAppNotification(TELEGRAM_ID, testMessage);
    
    if (result) {
      console.log(`\n✅ SUCCESS! Mini App notification sent successfully.`);
      console.log(`Check your Telegram app for the notification.`);
    } else {
      console.log(`\n❌ FAILED! Mini App notification failed to send.`);
      console.log(`The notification system wasn't able to send the message.`);
    }
  } catch (error) {
    console.error(`\n❌ ERROR! Exception while sending Mini App notification:`, error);
  }
}

// Run the test
testMiniAppNotifications();