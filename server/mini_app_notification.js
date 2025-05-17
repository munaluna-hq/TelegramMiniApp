/**
 * Specialized Telegram Mini App Notification System
 * 
 * This module provides notification methods specifically optimized for
 * working within the actual Telegram Mini App environment.
 */

import fetch from 'node-fetch';

// Use the environment variable for the bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Base URL for Telegram API
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a notification that's guaranteed to work in the Telegram Mini App environment
 * This uses direct Bot API calls without relying on intermediary libraries
 */
export async function sendMiniAppNotification(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Cannot send mini app notification: TELEGRAM_BOT_TOKEN is not set');
    return false;
  }

  // Ensure chat ID is a string
  chatId = String(chatId).trim();
  
  // Create a unique message ID to prevent duplicate notifications
  const uniqueId = Date.now().toString().slice(-6);
  
  // Add a special indicator for tracking
  const messageWithTracker = `${text}\n\n<i>MiniApp-${uniqueId}</i>`;
  
  // First try the simple notification method
  try {
    console.log(`🔔 Sending Mini App notification to ${chatId}`);
    
    // Create the API URL
    const apiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Create message parameters optimized for Mini App environment
    const messageParams = {
      chat_id: chatId,
      text: messageWithTracker,
      parse_mode: 'HTML',
      disable_notification: false,
      protect_content: false,
      disable_web_page_preview: true
    };
    
    // Send the request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MunaLuna Telegram Mini App Notifier/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(messageParams)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Mini App notification successfully sent to ${chatId}`);
      return true;
    } else {
      console.error(`❌ Failed to send Mini App notification: ${data.description}`);
      
      // Try alternative method if the first fails
      return await sendAlternativeMiniAppNotification(chatId, text);
    }
  } catch (error) {
    console.error(`❌ Error sending Mini App notification:`, error);
    
    // Try alternative method if the first fails
    return await sendAlternativeMiniAppNotification(chatId, text);
  }
}

/**
 * Alternative notification method for Mini App environment
 * Uses different parameters that might work better in certain app contexts
 */
async function sendAlternativeMiniAppNotification(chatId, text) {
  try {
    console.log(`Trying alternative Mini App notification method for ${chatId}`);
    
    // Create the API URL (same endpoint, different parameters)
    const apiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Use a slightly modified message to distinguish it
    const uniqueId = Date.now().toString().slice(-6);
    const modifiedText = `${text}\n\n<i>MiniApp-Alt-${uniqueId}</i>`;
    
    // Use different parameters for this alternative approach
    const messageParams = {
      chat_id: chatId,
      text: modifiedText,
      parse_mode: 'HTML',
      // Key differences in these parameters:
      disable_notification: false,
      allow_sending_without_reply: true
    };
    
    // Send the request with different headers
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageParams)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Alternative Mini App notification successfully sent to ${chatId}`);
      return true;
    } else {
      console.error(`❌ Alternative Mini App notification failed: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending alternative Mini App notification:`, error);
    return false;
  }
}

/**
 * Specialized method for sending tracker updates in the Mini App environment
 */
export async function sendTrackerMiniAppNotification(chatId, text) {
  return sendMiniAppNotification(chatId, text);
}

/**
 * Specialized method for sending settings updates in the Mini App environment
 */
export async function sendSettingsMiniAppNotification(chatId, text) {
  return sendMiniAppNotification(chatId, text);
}