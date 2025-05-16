/**
 * Enhanced notification system for MunaLuna
 * This module provides more reliable Telegram notifications 
 * with fallback mechanisms and debugging
 */

import fetch from 'node-fetch';

// Send a notification with maximum reliability
export async function sendReliableNotification(telegramId, message, options = {}) {
  try {
    // Default options
    const defaultOptions = {
      useHTML: true,
      disablePreview: true,
      enableSound: true,
      priority: "normal", // Can be "normal" or "high"
      retryCount: 2
    };
    
    // Merge options
    const settings = { ...defaultOptions, ...options };
    
    // Get bot token
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN is missing");
      return false;
    }
    
    // In development mode, handle notifications differently
    if (process.env.NODE_ENV === 'development') {
      const REAL_TELEGRAM_ID = '262371163';
      
      // If it's not already our real test ID, redirect to the real ID
      if (telegramId !== REAL_TELEGRAM_ID) {
        if (telegramId === '12345' || telegramId === '123456789' || 
            !telegramId.match(/^\d+$/) || telegramId.length < 9) {
          console.log(`DEV MODE: Redirecting notification from mock user ${telegramId} to real ID ${REAL_TELEGRAM_ID}`);
          console.log("Original message:", message);
          
          // Add a prefix to the message showing it was redirected
          message = `[Development Mode - Originally for ID: ${telegramId}]\n\n${message}`;
          
          // Use the real Telegram ID instead
          telegramId = REAL_TELEGRAM_ID;
        }
      } else {
        console.log("Development mode: Sending notification to real Telegram ID:", telegramId);
      }
    }
    
    console.log(`Sending notification to Telegram ID ${telegramId}`);
    
    // Basic telegram API parameters
    const params = {
      chat_id: telegramId,
      text: message,
      disable_notification: !settings.enableSound,
      disable_web_page_preview: settings.disablePreview
    };
    
    // Add HTML parsing if needed
    if (settings.useHTML) {
      params.parse_mode = "HTML";
    }
    
    // Try sending with retries
    let attempt = 0;
    let success = false;
    let lastError = null;
    
    while (attempt < settings.retryCount && !success) {
      attempt++;
      
      try {
        const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        
        // Send the message
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        const result = await response.json();
        
        if (result.ok) {
          console.log(`✅ Notification successfully sent to ${telegramId} (attempt ${attempt})`);
          success = true;
          break;
        } else {
          lastError = result.description;
          console.warn(`Failed to send notification (attempt ${attempt}): ${result.description}`);
          
          // If chat not found or blocked, we need to try a different approach
          if (result.description?.includes("chat not found") || 
              result.description?.includes("bot was blocked")) {
            
            // Try the fallback method
            const fallbackResult = await sendFallbackNotification(telegramId, message, settings);
            if (fallbackResult) {
              console.log("Fallback notification succeeded");
              success = true;
              break;
            }
          }
          
          // Wait before retrying (200ms, 400ms, etc.)
          if (attempt < settings.retryCount) {
            await new Promise(r => setTimeout(r, attempt * 200));
          }
        }
      } catch (error) {
        lastError = error.message;
        console.error(`Error in notification attempt ${attempt}:`, error);
        
        // Wait before retrying
        if (attempt < settings.retryCount) {
          await new Promise(r => setTimeout(r, attempt * 200));
        }
      }
    }
    
    if (!success) {
      console.error(`All ${settings.retryCount} notification attempts failed. Last error: ${lastError}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Critical error in notification system:", error);
    return false;
  }
}

// Fallback notification method 
async function sendFallbackNotification(telegramId, message, settings) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;
    
    // Clean message from HTML if needed
    const messageText = settings.useHTML 
      ? message.replace(/<\/?[^>]+(>|$)/g, "") 
      : message;
    
    // Add attention-grabbing prefix
    const enhancedMessage = `🔔 ВАЖНОЕ УВЕДОМЛЕНИЕ 🔔\n\n${messageText}`;
    
    // Try alternative methods (e.g., with username format)
    let possibleIds = [telegramId];
    
    // If ID is numeric, also try with @ prefix
    if (!isNaN(telegramId) && !telegramId.startsWith('@')) {
      possibleIds.push(`@${telegramId}`);
    }
    
    // Try each possible ID format
    for (const chatId of possibleIds) {
      try {
        const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: enhancedMessage,
            disable_notification: false
          })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          console.log(`✅ Fallback notification delivered to ${chatId}`);
          return true;
        }
      } catch (error) {
        console.error(`Fallback attempt for ${chatId} failed:`, error);
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error in fallback notification:", error);
    return false;
  }
}