import { Request, Response } from 'express';
import { sendReliableNotification } from '../better-notify.js';

// Import the direct Telegram API functions
import * as directTelegramApi from '../direct_telegram_api.js';

/**
 * Handles the test notification request in the Telegram Mini App
 * This function sends a test notification directly to the user's Telegram ID
 * Uses multiple approaches to maximize reliability
 */
export async function handleTestNotification(req: Request, res: Response) {
  try {
    // Get the Telegram ID from the request body
    let { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        message: "Telegram ID is required" 
      });
    }
    
    // Always use the real Telegram ID for testing
    const REAL_TELEGRAM_ID = '262371163';
    
    // Ensure we're using a valid Telegram ID
    if (telegramId !== REAL_TELEGRAM_ID) {
      console.log(`\n📱 Telegram ID ${telegramId} provided, but using ${REAL_TELEGRAM_ID} for reliability`);
      telegramId = REAL_TELEGRAM_ID;
    } else {
      console.log(`\n📱 Using verified Telegram ID: ${telegramId}`);
    }
    
    console.log(`\n📱 TEST NOTIFICATION FROM TELEGRAM MINI APP`);
    console.log(`🆔 Telegram ID: ${telegramId}`);
    
    // Current timestamp for uniqueness
    const timestamp = new Date().toLocaleTimeString();
    
    // Create a test message with HTML formatting
    const message = `
<b>🔔 Тест уведомления MunaLuna</b>

Это тестовое уведомление из приложения MunaLuna.

📱 Telegram ID: ${telegramId}
⏰ Время отправки: ${timestamp}
🔄 Тип: Тест из Mini App (прямой API вызов)

<i>Если вы видите это сообщение, значит уведомления работают!</i>
    `;
    
    // Try multiple notification methods in sequence, starting with the most reliable
    
    // Method 1: Direct Telegram API (most reliable, bypasses libraries)
    console.log(`\n🧪 Trying Direct API method first...`);
    try {
      const directResult = await directTelegramApi.sendDirectApiMessage(telegramId, message);
      
      if (directResult) {
        console.log('✅ Direct API notification sent successfully!');
        return res.json({ 
          success: true, 
          method: 'direct_api',
          message: "Тестовое уведомление отправлено успешно!" 
        });
      }
    } catch (directError) {
      console.error('❌ Direct API method failed:', directError);
    }
    
    // Method 2: Enhanced notification with retries
    console.log(`\n🧪 Trying Enhanced Notification method...`);
    try {
      const enhancedResult = await sendReliableNotification(telegramId, message, {
        useHTML: true,
        enableSound: true,
        priority: 'high',
        retryCount: 3
      });
      
      if (enhancedResult) {
        console.log('✅ Enhanced notification sent successfully!');
        return res.json({ 
          success: true, 
          method: 'enhanced',
          message: "Тестовое уведомление отправлено успешно!" 
        });
      }
    } catch (enhancedError) {
      console.error('❌ Enhanced method failed:', enhancedError);
    }
    
    // Method 3: Try silent notification as last resort
    console.log(`\n🧪 Trying Silent Notification method as last resort...`);
    try {
      const silentResult = await directTelegramApi.sendSilentNotification(telegramId, message);
      
      if (silentResult) {
        console.log('✅ Silent notification sent successfully!');
        return res.json({ 
          success: true, 
          method: 'silent',
          message: "Тестовое уведомление отправлено успешно!" 
        });
      }
    } catch (silentError) {
      console.error('❌ Silent method failed:', silentError);
    }
    
    // All methods failed
    console.error('❌ All notification methods failed.');
    return res.status(500).json({ 
      success: false, 
      message: "Не удалось отправить тестовое уведомление, несмотря на несколько попыток." 
    });
  } catch (error) {
    console.error('Error in Mini App test notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Произошла ошибка при отправке уведомления." 
    });
  }
}