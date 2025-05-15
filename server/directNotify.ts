import { sendTelegramNotification } from "./telegram";

// This module provides direct notification capabilities
// for testing and development purposes

const TEST_MESSAGE = `
🌙 *MunaLuna Test Notification* 🌙

Ассаламу алейкум! Это тестовое уведомление от приложения MunaLuna.

• Вы успешно настроили уведомления
• Теперь вы будете получать напоминания о намазах
• Приложение будет отправлять вам сводки по вашим поклонениям

*Альхамдулиллях!* Благодарим вас за использование нашего приложения.
`;

/**
 * Sends a direct test notification to the specified Telegram handle or ID
 */
export async function sendDirectTestNotification(telegramIdOrHandle: string): Promise<boolean> {
  console.log(`Sending direct test notification to: ${telegramIdOrHandle}`);
  
  // Determine if this is a numeric ID or a handle
  const isNumericId = /^\d+$/.test(telegramIdOrHandle);
  const targetId = isNumericId ? telegramIdOrHandle : telegramIdOrHandle.replace('@', '');
  
  try {
    // For handles, we need a different API endpoint
    if (!isNumericId) {
      return await sendTelegramNotificationByUsername(targetId, TEST_MESSAGE);
    } else {
      return await sendTelegramNotification(targetId, TEST_MESSAGE);
    }
  } catch (error) {
    console.error("Failed to send direct test notification:", error);
    return false;
  }
}

/**
 * Sends a notification to a user by username instead of ID
 * This uses a different API method (sendMessage vs. username lookup)
 */
async function sendTelegramNotificationByUsername(username: string, message: string): Promise<boolean> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token not configured");
      return false;
    }
    
    console.log(`Attempting to send Telegram notification to username: @${username}`);
    
    // First attempt to get chat ID from username
    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const requestBody = {
      chat_id: `@${username}`,  // Note the @ prefix for usernames
      text: message,
      parse_mode: "Markdown"
    };
    
    console.log(`Sending Telegram API request to: ${apiUrl}`);
    console.log(`With payload: ${JSON.stringify(requestBody)}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json() as any;
    
    if (!data.ok) {
      console.error(`Telegram API error: ${data.description}`);
    } else {
      console.log(`Telegram notification successfully sent to username @${username}`);
    }
    
    return data.ok === true;
  } catch (error) {
    console.error("Error sending Telegram notification by username:", error);
    return false;
  }
}