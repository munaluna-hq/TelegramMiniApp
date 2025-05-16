// Import notification systems
import { sendReliableNotification } from "./better-notify.js";
import * as directApi from "./direct_telegram_api.js";

// This module provides direct notification capabilities
// for testing and development purposes with fallback mechanisms

const TEST_MESSAGE = `🌙 <b>MunaLuna Test Notification</b> 🌙

Ассаламу алейкум! Это тестовое уведомление от приложения MunaLuna.

• Вы успешно настроили уведомления
• Теперь вы будете получать напоминания о намазах
• Приложение будет отправлять вам сводки по вашим поклонениям

<b>Альхамдулиллях!</b> Благодарим вас за использование нашего приложения.`;

/**
 * Sends a direct test notification to the specified Telegram ID
 * We only support numeric Telegram IDs as they are more reliable
 */
export async function sendDirectTestNotification(telegramId: string): Promise<boolean> {
  console.log(`-------- BEGIN TEST NOTIFICATION DEBUG --------`);
  console.log(`Sending direct test notification to Telegram ID: ${telegramId}`);
  console.log(`Bot token exists: ${!!process.env.TELEGRAM_BOT_TOKEN}`);
  console.log(`Bot token length: ${process.env.TELEGRAM_BOT_TOKEN?.length || 0}`);
  
  try {
    // Ensure we're working with a valid numeric ID
    if (!/^\d+$/.test(telegramId)) {
      console.error("Invalid Telegram ID format. Must be numeric.");
      return false;
    }
    
    // First try the direct API approach (most reliable)
    console.log("1. Attempting to send notification via direct API method...");
    try {
      const directResult = await directApi.sendImportantNotification(telegramId, TEST_MESSAGE);
      
      if (directResult) {
        console.log("✅ Direct API notification sent successfully!");
        return true;
      } else {
        console.log("❌ Direct API notification failed, attempting fallback...");
      }
    } catch (directError) {
      console.error("Error with direct API method:", directError);
      console.log("Trying fallback approach...");
    }
    
    // Fallback to enhanced reliable notification system
    console.log("2. Attempting to send notification via improved Telegram API...");
    const result = await sendReliableNotification(
      telegramId, 
      TEST_MESSAGE,
      {
        useHTML: true,
        enableSound: true,
        priority: "high",
        retryCount: 3
      }
    );
    console.log(`Notification send result: ${result ? "Success ✅" : "Failed ❌"}`);
    console.log(`-------- END TEST NOTIFICATION DEBUG --------`);
    return result;
  } catch (error) {
    console.error("Failed to send direct test notification:", error);
    console.log(`-------- END TEST NOTIFICATION DEBUG --------`);
    return false;
  }
}