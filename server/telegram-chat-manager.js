/**
 * Telegram Chat Manager
 * 
 * This module handles the storage and retrieval of Telegram chat IDs associated with user IDs
 * to ensure notifications are always sent to the correct chat.
 */

import fetch from 'node-fetch';

// Cache of known chat IDs mapped to user IDs to avoid repeated API calls
const chatIdCache = new Map();

/**
 * Store a chat ID for a user
 * @param {string} userId - The Telegram user ID
 * @param {string} chatId - The Telegram chat ID
 */
function storeChatId(userId, chatId) {
  chatIdCache.set(userId, chatId);
  console.log(`Stored chat ID ${chatId} for user ${userId}`);
}

/**
 * Get the cached chat ID for a user, if available
 * @param {string} userId - The Telegram user ID
 * @returns {string|null} The chat ID or null if not in cache
 */
export function getCachedChatId(userId) {
  return chatIdCache.has(userId) ? chatIdCache.get(userId) : null;
}

/**
 * Get a chat ID for a user, either from cache or by calling Telegram API
 * @param {string} userId - The Telegram user ID
 * @returns {Promise<string>} The chat ID to use for notifications
 */
async function getChatId(userId) {
  // First check if we have this chat ID in our cache
  const cachedChatId = getCachedChatId(userId);
  if (cachedChatId) {
    return cachedChatId;
  }
  
  // If not in cache, use the user ID as chat ID (common in private chats)
  // We don't attempt to call Telegram API here since that should be done 
  // only when we know we need to (when a message send fails)
  return userId;
}

/**
 * Lookup the correct chat ID by calling Telegram API directly
 * This should be used when a send attempt fails with the basic user ID
 * @param {string} userId - The Telegram user ID
 * @returns {Promise<string|null>} The correct chat ID or null if not found
 */
async function lookupChatId(userId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('Cannot lookup chat ID: TELEGRAM_BOT_TOKEN is not set');
    return null;
  }
  
  try {
    console.log(`Looking up chat ID for user ${userId}`);
    
    // Call getChat API to retrieve information about this chat/user
    const getChatUrl = `https://api.telegram.org/bot${token}/getChat`;
    const response = await fetch(getChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: userId
      })
    });
    
    const data = await response.json();
    
    if (data.ok && data.result && data.result.id) {
      const chatId = String(data.result.id);
      console.log(`Found chat ID ${chatId} for user ${userId}`);
      
      // Store in cache for future use
      storeChatId(userId, chatId);
      return chatId;
    }
    
    console.error(`Could not retrieve chat information for user ${userId}`);
    return null;
  } catch (error) {
    console.error(`Error looking up chat ID for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get chat information for a specific user
 * @param {string} userId - The Telegram user ID
 * @returns {Promise<Object|null>} Chat information or null if not found
 */
async function getChatInfo(userId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('Cannot get chat info: TELEGRAM_BOT_TOKEN is not set');
    return null;
  }
  
  try {
    // Try to get chat information
    const getChatUrl = `https://api.telegram.org/bot${token}/getChat`;
    const response = await fetch(getChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: userId
      })
    });
    
    const data = await response.json();
    
    if (data.ok && data.result) {
      console.log(`Retrieved chat info for user ${userId}`);
      return data.result;
    } else {
      console.error(`Failed to get chat info: ${data.description}`);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving chat info:`, error);
    return null;
  }
}

/**
 * Ensure we have a valid chat ID where we can send messages,
 * verifying it works by actually sending a test message if requested
 * @param {string} userId - The Telegram user ID
 * @param {boolean} verify - Whether to verify by sending a test message
 * @returns {Promise<string|null>} A valid chat ID or null if none found
 */
async function ensureValidChatId(userId, verify = false) {
  // First try cached or default approach
  let chatId = await getChatId(userId);
  
  if (!verify) {
    return chatId;
  }
  
  // If verification requested, try to look up the correct chat ID
  const lookupId = await lookupChatId(userId);
  if (lookupId) {
    chatId = lookupId;
  }
  
  // Final verification - try to send a silent test message
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const testMsg = `<i>This is a silent test message. Please ignore.</i>`;
  
  try {
    const sendUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMsg,
        parse_mode: 'HTML',
        disable_notification: true
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`Verified chat ID ${chatId} for user ${userId}`);
      storeChatId(userId, chatId);
      return chatId;
    } else {
      console.error(`Chat ID verification failed: ${data.description}`);
      return null;
    }
  } catch (error) {
    console.error(`Error verifying chat ID:`, error);
    return null;
  }
}

export {
  getChatId,
  lookupChatId,
  getChatInfo,
  ensureValidChatId,
  storeChatId
};