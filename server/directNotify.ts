import { sendTelegramNotification } from "./telegram";

// This module provides direct notification capabilities
// for testing and development purposes

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
  console.log(`Sending direct test notification to Telegram ID: ${telegramId}`);
  
  try {
    // Ensure we're working with a valid numeric ID
    if (!/^\d+$/.test(telegramId)) {
      console.error("Invalid Telegram ID format. Must be numeric.");
      return false;
    }
    
    // Send directly using the main notification method
    const result = await sendTelegramNotification(telegramId, TEST_MESSAGE);
    return result;
  } catch (error) {
    console.error("Failed to send direct test notification:", error);
    return false;
  }
}