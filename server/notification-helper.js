/**
 * MunaLuna Notification Helper
 *
 * This module provides functions to handle the common notification scenarios,
 * focusing on the specific requirements of Telegram Mini Apps.
 */

import * as miniAppNotify from './mini_app_notification.js';
import * as directApi from './direct_telegram_api.js';
import { sendReliableNotification } from './better-notify.js';

/**
 * Send a notification using the best approach based on context
 * Handles all the fallbacks and error cases automatically
 * 
 * @param {string} telegramId - The Telegram user ID to send the notification to
 * @param {string} message - The message content (supports HTML)
 * @param {object} options - Options for the notification
 * @returns {Promise<boolean>} - Success status
 */
export async function sendNotification(telegramId, message, options = {}) {
  console.log(`Sending notification to Telegram ID: ${telegramId}`);
  
  try {
    // First try the specialized Mini App notification method
    // This is optimized for the Telegram Mini App environment
    const miniAppResult = await miniAppNotify.sendMiniAppNotification(telegramId, message);
    
    if (miniAppResult) {
      console.log(`✅ Notification sent successfully via Mini App method`);
      return true;
    }
    
    // If that failed, try direct API approach
    const directResult = await directApi.sendDirectApiMessage(telegramId, message);
    
    if (directResult) {
      console.log(`✅ Notification sent successfully via direct API`);
      return true;
    }
    
    // Final fallback - use reliable notification with all options
    const fallbackResult = await sendReliableNotification(telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 3,
      ...options
    });
    
    if (fallbackResult) {
      console.log(`✅ Notification sent successfully via fallback method`);
      return true;
    }
    
    // If all methods failed, log the error
    console.error(`❌ All notification methods failed for user ${telegramId}`);
    
    // Store this failure for reporting to the user in the UI
    storeFailedNotification(telegramId, message);
    
    return false;
  } catch (error) {
    console.error(`❌ Error sending notification:`, error);
    storeFailedNotification(telegramId, message);
    return false;
  }
}

// In-memory store of failed notifications to show in the UI
const failedNotifications = new Map();

/**
 * Store a failed notification to show in the UI
 */
function storeFailedNotification(telegramId, message) {
  const timestamp = new Date().toISOString();
  const id = `${telegramId}-${Date.now()}`;
  
  const notification = {
    id,
    telegramId,
    message,
    timestamp,
    read: false
  };
  
  if (!failedNotifications.has(telegramId)) {
    failedNotifications.set(telegramId, []);
  }
  
  const userNotifications = failedNotifications.get(telegramId);
  userNotifications.push(notification);
  
  // Keep only the last 10 notifications per user
  if (userNotifications.length > 10) {
    userNotifications.shift();
  }
}

/**
 * Get any failed notifications for a user to show in the UI
 */
export function getFailedNotifications(telegramId) {
  if (!failedNotifications.has(telegramId)) {
    return [];
  }
  
  return failedNotifications.get(telegramId);
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(notificationId) {
  for (const [telegramId, notifications] of failedNotifications.entries()) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
  }
  
  return false;
}