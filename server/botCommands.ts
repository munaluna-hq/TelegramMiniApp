import fetch from "node-fetch";

/**
 * Welcome message sent to users when they first start the bot
 */
const WELCOME_MESSAGE = `🌙 <b>Добро пожаловать в MunaLuna!</b> 🌙

Ассаламу алейкум! Я ваш личный помощник для отслеживания менструального цикла и поклонений.

<b>Что я умею:</b>
• Отслеживать ваш менструальный цикл
• Напоминать о намазах
• Помогать планировать ваши поклонения
• Уведомлять о важных событиях

Используйте Mini App, чтобы получить доступ ко всем функциям.

<b>Альхамдулиллях!</b> Начните пользоваться прямо сейчас, нажав кнопку "Открыть" ниже.`;

/**
 * Handles the /start command for the Telegram bot
 * Sends a welcome message to the user
 */
export async function handleStartCommand(telegramId: string): Promise<boolean> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token not configured");
      return false;
    }
    
    // Make the API call to Telegram
    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const requestBody = {
      chat_id: telegramId,
      text: WELCOME_MESSAGE,
      parse_mode: "HTML"
    };
    
    console.log(`Sending welcome message to user ID: ${telegramId}`);
    
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
      return false;
    } else {
      console.log(`Welcome message successfully sent to user ${telegramId}`);
      return true;
    }
  } catch (error) {
    console.error("Error sending welcome message:", error);
    return false;
  }
}