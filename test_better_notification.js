import { sendReliableNotification } from './server/better-notify.js';

async function testNotification() {
  try {
    // Your Telegram ID
    const telegramId = "262371163";
    
    // Create a test message with HTML formatting
    const message = 
      `<b>🔔 ТЕСТОВОЕ УВЕДОМЛЕНИЕ MunaLuna 🔔</b>\n\n` +
      `Ассаляму алейкум!\n\n` +
      `Это тестовое уведомление отправлено: <b>${new Date().toLocaleTimeString()}</b>\n\n` +
      `<i>Если вы видите это сообщение с форматированием и слышите звуковое уведомление, значит система работает правильно!</i>\n\n` +
      `Пожалуйста, сообщите в чате Replit, получили ли вы это уведомление.`;
    
    console.log("Sending enhanced test notification...");
    
    // Send with maximum reliability
    const result = await sendReliableNotification(telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 3
    });
    
    if (result) {
      console.log("✅ Test notification sent successfully!");
    } else {
      console.error("❌ Failed to send test notification.");
    }
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testNotification();