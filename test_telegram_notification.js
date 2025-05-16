/**
 * MunaLuna: Test Telegram Mini App Notification
 * 
 * This script tests sending notifications directly to Telegram,
 * bypassing the server API. This is useful for verifying the notification
 * mechanism works properly in the Telegram Mini App environment.
 */

// Import the enhanced notification function from our better-notify module
import { sendReliableNotification } from './server/better-notify.js';

// Real Telegram ID to test with
const TELEGRAM_ID = '262371163';

async function testMiniAppNotification() {
  console.log('🔔 Testing Telegram Mini App Notification');
  console.log('========================================');
  
  try {
    // Current timestamp for uniqueness
    const timestamp = new Date().toLocaleTimeString();
    
    // Create a test message with HTML formatting
    const message = `
<b>🔔 Тест уведомления MunaLuna</b>

Это тестовое уведомление от MunaLuna для проверки работы в Telegram Mini App.

📱 Telegram ID: ${TELEGRAM_ID}
⏰ Время отправки: ${timestamp}
🔄 Тип: Прямой тест из Mini App

<i>Если вы видите это сообщение, значит система уведомлений работает правильно!</i>
    `;
    
    console.log(`Sending test notification to Telegram ID: ${TELEGRAM_ID}`);
    
    // Send notification with sound enabled and high priority
    const result = await sendReliableNotification(TELEGRAM_ID, message, {
      useHTML: true,
      enableSound: true,
      priority: 'high',
      retryCount: 3
    });
    
    if (result) {
      console.log('✅ Test notification sent successfully!');
    } else {
      console.error('❌ Failed to send test notification.');
    }
  } catch (error) {
    console.error('❌ Error testing notification:', error);
  }
}

// Run the test
testMiniAppNotification();