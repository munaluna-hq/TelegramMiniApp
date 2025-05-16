/**
 * Telegram webhook implementation
 * This script handles webhook callbacks from Telegram for commands like /start
 * Works with the API route in server/routes.ts
 */

import fetch from 'node-fetch';
import { sendReliableNotification } from './better-notify.js';

// The URL for your Telegram Mini Web App
const WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app";

// Handle incoming webhook updates from Telegram
export async function handleWebhookUpdate(update) {
  console.log('Received webhook update:', JSON.stringify(update, null, 2));
  
  // Check if this is a message with a /start command
  if (update.message && 
      update.message.text && 
      update.message.text === '/start') {
    
    await handleStartCommand(update.message);
    return true;
  }
  
  // We didn't handle this update
  return false;
}

// Handle the /start command
async function handleStartCommand(message) {
  const chatId = message.chat.id;
  const firstName = message.from.first_name || 'there';
  
  console.log(`Handling /start command from user ${firstName} (${chatId})`);
  
  // Create the welcome message with personalized greeting
  const welcomeText = 
    `Ассаляму алейкум, ${firstName}! 👋\n\n` +
    "Добро пожаловать в MunaLuna!\n\n" +
    "MunaLuna - это приложение, которое помогает мусульманкам системно и легко планировать поклонение, учитывая женский цикл и нормы шариата.\n\n" +
    "Как это работает:\n" + 
    "• Отслеживание менструального цикла\n" +
    "• Планирование поклонения и ежедневных духовных практик\n" +
    "• Напоминания о времени намаза\n" +
    "• Получение духовной поддержки\n\n" +
    "Планируй поклонение с умом и спокойствием!";
  
  // Create the inline keyboard with WebApp button
  const replyMarkup = {
    inline_keyboard: [
      [{ text: 'Открыть MunaLuna', web_app: { url: WEBAPP_URL } }]
    ]
  };
  
  // Send the welcome message using the improved notification system
  // First try with our reliable notification system (for text only)
  await sendReliableNotification(chatId, welcomeText, {
    useHTML: true,
    enableSound: true,
    priority: "high",
    retryCount: 3
  });
  
  // Then send the button separately using the original method
  await sendTelegramMessage(chatId, "Нажмите на кнопку ниже, чтобы открыть приложение:", replyMarkup);
}

// General function to send Telegram messages
export async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required!');
    return false;
  }
  
  try {
    // Prepare the API call
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_notification: false  // Ensure notification is sent with sound
    };
    
    // Add reply markup if provided
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    
    console.log(`Attempting to send message to Telegram chat ID: ${chatId}`);
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ Message sent successfully to chat ID: ${chatId}`);
      return true;
    } else {
      console.error('Failed to send message:', result.description);
      
      // Try an alternative approach if chat not found
      if (result.description?.includes("chat not found")) {
        return await sendAlternativeNotification(chatId, text);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Alternative notification method using sendMessage with special formats
async function sendAlternativeNotification(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  
  try {
    // Clean text from HTML tags
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Try with different notification settings
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: `🔔 NOTIFICATION 🔔\n\n${cleanText}`,
      disable_web_page_preview: true,
      disable_notification: false
    };
    
    console.log(`Attempting alternative notification to chat ID: ${chatId}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ Alternative notification sent successfully to chat ID: ${chatId}`);
      return true;
    } else {
      console.error('Failed to send alternative notification:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Error sending alternative notification:', error);
    return false;
  }
}

// Set up webhook URL for the bot
export async function setupWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required!');
    return false;
  }

  // Use the actual full URL of the Replit app
  const webhookUrl = `https://telegram-mini-app-guljansmm.replit.app/api/telegram-webhook`;
  
  try {
    console.log(`Setting webhook to: ${webhookUrl}`);
    
    // Delete any existing webhook first
    const deleteUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
    await fetch(deleteUrl);
    
    // Set the new webhook
    const setUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const response = await fetch(setUrl);
    const result = await response.json();
    
    if (result.ok) {
      console.log('Webhook set successfully!');
      return true;
    } else {
      console.error('Failed to set webhook:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}

// Get current webhook info
export async function getWebhookInfo() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required!');
    return null;
  }
  
  try {
    const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return null;
  }
}