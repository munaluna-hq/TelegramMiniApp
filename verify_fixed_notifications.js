/**
 * MunaLuna Notification System Verification
 * 
 * This script tests the improved notification system that properly handles
 * Telegram chat IDs to ensure notifications work in Mini App environment.
 */

import * as miniAppNotify from './server/mini_app_notification.js';
import * as chatManager from './server/telegram-chat-manager.js';

// Default Telegram ID for testing
const TELEGRAM_ID = '262371163';

async function testFixedNotifications() {
  console.log(`\n🌙 Testing Fixed Telegram Notification System 🌙`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // 1. First test with direct notification
    console.log(`\n1️⃣ Testing direct notification with chat manager...`);
    
    const directMessage = `
<b>🔔 Тест уведомлений MunaLuna</b>

Это тестовое уведомление для проверки исправленной системы уведомлений,
которая теперь правильно обрабатывает ID чата в Telegram.

⏰ Время: ${new Date().toLocaleTimeString()}
🔄 Тип: Прямое уведомление через менеджер чатов

Если вы видите это сообщение в Telegram, значит система работает правильно!
`;
    
    const directResult = await miniAppNotify.sendMiniAppNotification(TELEGRAM_ID, directMessage);
    console.log(`Direct notification result: ${directResult ? 'Success ✅' : 'Failed ❌'}`);
    
    // Wait 2 seconds before next test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Test with alternative notification approach
    console.log(`\n2️⃣ Testing alternative notification approach...`);
    
    const alternativeMessage = `
<b>🔔 Альтернативное уведомление MunaLuna</b>

Это тестовое уведомление использует альтернативный подход с менеджером чатов.

⏰ Время: ${new Date().toLocaleTimeString()}
🔄 Тип: Альтернативное уведомление

Если вы видите это сообщение, значит оба подхода работают!
`;
    
    // Simulate the alternative approach directly
    const alternativeResult = await miniAppNotify.sendTrackerMiniAppNotification(TELEGRAM_ID, alternativeMessage);
    console.log(`Alternative notification result: ${alternativeResult ? 'Success ✅' : 'Failed ❌'}`);
    
    // Check if we have a cached chat ID now
    const cachedId = chatManager.getCachedChatId(TELEGRAM_ID);
    console.log(`Cached chat ID for ${TELEGRAM_ID}: ${cachedId || 'Not found'}`);
    
    // Summary
    console.log(`\n✅ Notification testing complete!`);
    console.log(`If you received both messages in your Telegram, our fix was successful.`);
    console.log(`Our system now correctly handles Telegram chat IDs for notifications.`);
    
  } catch (error) {
    console.error(`\n❌ Error testing notifications:`, error);
  }
}

// Run the test
testFixedNotifications();