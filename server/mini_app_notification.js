/**
 * Specialized Telegram Mini App Notification System
 * 
 * This module provides notification methods specifically optimized for
 * working within the actual Telegram Mini App environment.
 */

import fetch from 'node-fetch';
import * as chatManager from './telegram-chat-manager.js';

// Use the environment variable for the bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Base URL for Telegram API
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a notification that's guaranteed to work in the Telegram Mini App environment
 * This uses direct Bot API calls without relying on intermediary libraries
 * 
 * In Telegram, chat_id can be:
 * - The same as the user's Telegram ID (most common for private chats)
 * - Different from the Telegram ID (in group chats or channels)
 * - For private chats, we can also use the username with @ prefix
 */
export async function sendMiniAppNotification(telegramId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Cannot send mini app notification: TELEGRAM_BOT_TOKEN is not set');
    return false;
  }

  // First, try to get the proper chat ID using our chat manager
  let chatId;
  try {
    chatId = await chatManager.getChatId(String(telegramId).trim());
    console.log(`Using chat ID ${chatId} for user ID ${telegramId}`);
  } catch (error) {
    // If there's an error getting the chat ID, fall back to using telegramId directly
    console.error(`Error getting chat ID, falling back to user ID: ${error.message}`);
    chatId = String(telegramId).trim();
  }
  
  // Create a unique message ID to prevent duplicate notifications
  const uniqueId = Date.now().toString().slice(-6);
  
  // Add a special indicator for tracking
  const messageWithTracker = `${text}\n\n<i>MiniApp-${uniqueId}</i>`;
  
  // First try sending with the chat ID we retrieved
  try {
    console.log(`🔔 Sending Mini App notification to chat_id: ${chatId}`);
    
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
      console.log(`✅ Mini App notification successfully sent to chat_id: ${chatId}`);
      // Store the successful chat ID for future use
      chatManager.storeChatId(telegramId, chatId);
      return true;
    } else {
      console.error(`❌ Failed to send Mini App notification: ${data.description}`);
      console.log(`Attempting to look up proper chat ID...`);
      
      // Try to look up the proper chat ID
      const actualChatId = await chatManager.lookupChatId(telegramId);
      
      if (actualChatId) {
        // Try again with the actual chat ID
        return await sendWithChatId(actualChatId, text);
      } else {
        // Fall back to alternative method
        console.log(`Could not get proper chat ID, trying alternative method...`);
        return await sendAlternativeMiniAppNotification(telegramId, text);
      }
    }
  } catch (error) {
    console.error(`❌ Error sending Mini App notification:`, error);
    
    // Try alternative method if the first fails
    return await sendAlternativeMiniAppNotification(telegramId, text);
  }
}

/**
 * Helper function to send a notification with a specific chat ID
 * @param {string} chatId - The chat ID to use
 * @param {string} text - The message text
 * @returns {Promise<boolean>} Success indicator
 */
async function sendWithChatId(chatId, text) {
  try {
    console.log(`Sending notification with specific chat ID: ${chatId}`);
    
    // Create a unique message ID
    const uniqueId = Date.now().toString().slice(-6);
    const messageWithTracker = `${text}\n\n<i>MiniApp-Direct-${uniqueId}</i>`;
    
    const apiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageWithTracker,
        parse_mode: 'HTML',
        disable_notification: false
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Notification sent successfully to chat ID: ${chatId}`);
      return true;
    } else {
      console.error(`❌ Failed to send with specific chat ID: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending with specific chat ID:`, error);
    return false;
  }
}

/**
 * Alternative notification method for Mini App environment
 * Uses different parameters that might work better in certain app contexts
 * 
 * This method tries a different approach by:
 * 1. First - treating the ID as a chat ID (as is common in private chats)
 * 2. If that fails - adding a channel identifier for when chat_id might be different format
 */
async function sendAlternativeMiniAppNotification(telegramId, text) {
  try {
    console.log(`Trying alternative Mini App notification method for ${telegramId}`);
    
    // Create the API URL (same endpoint, different parameters)
    const apiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Use a slightly modified message to distinguish it
    const uniqueId = Date.now().toString().slice(-6);
    const modifiedText = `${text}\n\n<i>MiniApp-Alt-${uniqueId}</i>`;
    
    // Try with private message format
    const messageParams = {
      chat_id: telegramId, // Use as is - in private chats, chat_id is usually the same as telegramId
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
      console.log(`✅ Alternative Mini App notification successfully sent to ${telegramId}`);
      return true;
    } else {
      console.error(`❌ First alternative attempt failed: ${data.description}`);
      
      // If the first attempt failed, try a third approach - get channel info first
      return await tryGetChatAndSendNotification(telegramId, modifiedText);
    }
  } catch (error) {
    console.error(`❌ Error sending alternative Mini App notification:`, error);
    return false;
  }
}

/**
 * Last resort method that tries to first get the chat information
 * and then sends the notification with the correct chat ID
 */
async function tryGetChatAndSendNotification(telegramId, text) {
  try {
    console.log(`Attempting to retrieve actual chat ID for user ${telegramId}`);
    
    // First try to get chat information
    const getChatUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/getChat`;
    const chatParams = {
      chat_id: telegramId
    };
    
    const chatResponse = await fetch(getChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatParams)
    });
    
    const chatData = await chatResponse.json();
    
    if (chatData.ok && chatData.result && chatData.result.id) {
      // We got the actual chat ID, now try to send the message
      const actualChatId = chatData.result.id;
      console.log(`Retrieved actual chat ID: ${actualChatId}`);
      
      const finalApiUrl = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const finalParams = {
        chat_id: actualChatId,
        text: text,
        parse_mode: 'HTML',
        disable_notification: false
      };
      
      const finalResponse = await fetch(finalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalParams)
      });
      
      const finalData = await finalResponse.json();
      
      if (finalData.ok) {
        console.log(`✅ Final notification attempt successful using retrieved chat ID ${actualChatId}`);
        return true;
      } else {
        console.error(`❌ Final notification attempt failed: ${finalData.description}`);
        return false;
      }
    } else {
      console.error(`❌ Could not retrieve chat information: ${chatData.description || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in final notification attempt:`, error);
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