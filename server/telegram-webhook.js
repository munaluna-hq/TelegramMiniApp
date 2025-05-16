/**
 * Telegram webhook implementation
 * This script handles webhook callbacks from Telegram for commands like /start
 * Works with the API route in server/routes.ts
 */

import fetch from 'node-fetch';

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
    `Привет, ${firstName}! 👋\n\n` +
    "Я бот WebApp MunaLuna. С моей помощью вы сможете:\n" +
    "• Отслеживать менструальный цикл\n" +
    "• Получать напоминания о намазах\n" +
    "• Управлять своими религиозными практиками\n" +
    "• Получать духовную поддержку";
  
  // Create the inline keyboard with WebApp button
  const replyMarkup = {
    inline_keyboard: [
      [{ text: 'Открыть приложение', web_app: { url: WEBAPP_URL } }]
    ]
  };
  
  // Send the welcome message
  await sendTelegramMessage(chatId, welcomeText, replyMarkup);
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
      parse_mode: 'HTML'
    };
    
    // Add reply markup if provided
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    
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
      console.log(`Message sent successfully to chat ID: ${chatId}`);
      return true;
    } else {
      console.error('Failed to send message:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Error sending message:', error);
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

  const repl_slug = process.env.REPL_SLUG || 'telegram-mini-app-guljansmm';
  const repl_owner = process.env.REPL_OWNER || 'guljansmm';
  
  // The webhook URL that Telegram should call
  const webhookUrl = `https://${repl_slug}.${repl_owner}.repl.co/api/telegram-webhook`;
  
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