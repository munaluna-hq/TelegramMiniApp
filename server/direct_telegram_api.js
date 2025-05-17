/**
 * Direct Telegram API integration
 * 
 * This module directly calls the Telegram Bot API endpoints
 * without relying on intermediary libraries
 * 
 * This is optimized for the Telegram Mini App environment where
 * standard notification approaches might not work as expected.
 */

import fetch from 'node-fetch';

// Use the environment variable for the bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN environment variable is not set');
}

// Base URL for Telegram API
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a message directly to Telegram API
 * This is the most direct approach to ensure delivery
 */
async function sendDirectApiMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Cannot send message: TELEGRAM_BOT_TOKEN is not set');
    return false;
  }

  const apiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    // Ensure chat ID is a string
    chatId = String(chatId).trim();
    
    // Default message parameters with settings optimized for Telegram Mini App
    const messageParams = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_notification: false, // Ensure notifications are enabled
      protect_content: false,      // Don't restrict forwarding or saving
      disable_web_page_preview: true, // Disable web previews for cleaner notifications
      allow_sending_without_reply: true, // Allow sending even if there's no message to reply to
      ...options
    };

    console.log(`🔸 Sending optimized direct API message to ${chatId}`);
    
    // Make direct API request with headers set for Telegram
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MunaLuna Telegram Mini App/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(messageParams),
    });

    // Process response
    const data = await response.json();

    if (data.ok) {
      console.log(`✅ Direct API message successfully sent to ${chatId}`);
      return true;
    } else {
      console.error(`❌ Telegram API error: ${data.description}`);
      console.error(`Error code: ${data.error_code}`);
      
      // Special handling for specific error codes
      if (data.error_code === 403) {
        console.error(`User ${chatId} has blocked the bot or hasn't initiated conversation`);
      } else if (data.error_code === 400) {
        console.error(`Bad request - check if chat_id ${chatId} is valid`);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending direct API message:`, error);
    return false;
  }
}

/**
 * Send a message with advanced options
 * This function uses the direct API approach with more options
 */
async function sendAdvancedMessage(chatId, text, options = {}) {
  const defaultOptions = {
    disable_web_page_preview: true,
    disable_notification: false,
    protect_content: false
  };

  return sendDirectApiMessage(chatId, text, { ...defaultOptions, ...options });
}

/**
 * Send important notification
 * This is guaranteed to make a sound and appear as a notification
 */
async function sendImportantNotification(chatId, text) {
  return sendDirectApiMessage(chatId, text, {
    disable_notification: false,
    protect_content: false,
    disable_web_page_preview: true
  });
}

/**
 * Send silent notification
 * This will not make a sound but will still appear as a notification
 */
async function sendSilentNotification(chatId, text) {
  return sendDirectApiMessage(chatId, text, {
    disable_notification: true,
    disable_web_page_preview: true
  });
}

/**
 * Send a message with a button that opens the Mini App
 */
async function sendMiniAppButton(chatId, text, buttonText = 'Open MunaLuna') {
  const webAppUrl = 'https://telegram-mini-app-guljansmm.replit.app/';
  
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: buttonText,
          web_app: { url: webAppUrl }
        }
      ]
    ]
  };
  
  return sendDirectApiMessage(chatId, text, {
    reply_markup: JSON.stringify(inlineKeyboard)
  });
}

/**
 * Send a message with custom reply keyboard
 */
async function sendCustomReplyKeyboard(chatId, text, keyboard) {
  return sendDirectApiMessage(chatId, text, {
    reply_markup: JSON.stringify({
      keyboard: keyboard,
      resize_keyboard: true,
      one_time_keyboard: false
    })
  });
}

/**
 * A comprehensive test function that tries multiple notification methods
 * and reports which ones work
 */
async function testMultipleNotificationMethods(chatId) {
  console.log(`\n🧪 Testing multiple notification methods for chat ID: ${chatId}`);
  
  const results = {
    directApi: false,
    important: false,
    silent: false,
    miniAppButton: false
  };
  
  try {
    // Test direct API
    results.directApi = await sendDirectApiMessage(
      chatId, 
      `<b>Direct API Test</b>\nThis is a test message sent at ${new Date().toLocaleTimeString()}`
    );
    
    // Test important notification
    results.important = await sendImportantNotification(
      chatId,
      `<b>Important Notification Test</b>\nThis is a loud notification sent at ${new Date().toLocaleTimeString()}`
    );
    
    // Test silent notification
    results.silent = await sendSilentNotification(
      chatId,
      `<b>Silent Notification Test</b>\nThis is a silent notification sent at ${new Date().toLocaleTimeString()}`
    );
    
    // Test mini app button
    results.miniAppButton = await sendMiniAppButton(
      chatId,
      `<b>Mini App Button Test</b>\nTry opening the app with this button. Sent at ${new Date().toLocaleTimeString()}`
    );
    
    console.log('📊 Notification test results:', results);
    
    // Send a summary
    const summaryText = `
<b>📱 Notification Test Results</b>

Direct API: ${results.directApi ? '✅' : '❌'}
Important: ${results.important ? '✅' : '❌'}
Silent: ${results.silent ? '✅' : '❌'}
Mini App Button: ${results.miniAppButton ? '✅' : '❌'}

Please check if you received all these messages.
    `;
    
    await sendDirectApiMessage(chatId, summaryText);
    
    return results;
  } catch (error) {
    console.error('❌ Error running notification tests:', error);
    return results;
  }
}

export {
  sendDirectApiMessage,
  sendAdvancedMessage,
  sendImportantNotification,
  sendSilentNotification,
  sendMiniAppButton,
  sendCustomReplyKeyboard,
  testMultipleNotificationMethods
};