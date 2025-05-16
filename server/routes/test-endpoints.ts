import { Request, Response } from 'express';
import { sendReliableNotification } from '../better-notify.js';

/**
 * Handles the test notification request in the Telegram Mini App
 * This function sends a test notification directly to the user's Telegram ID
 */
export async function handleTestNotification(req: Request, res: Response) {
  try {
    // Get the Telegram ID from the request body
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        message: "Telegram ID is required" 
      });
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
🔄 Тип: Тест из Mini App

<i>Если вы видите это сообщение, значит уведомления работают!</i>
    `;
    
    // Send notification with sound enabled and high priority
    const result = await sendReliableNotification(telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: 'high',
      retryCount: 3
    });
    
    if (result) {
      console.log('✅ Mini App test notification sent successfully!');
      return res.json({ 
        success: true, 
        message: "Тестовое уведомление отправлено успешно!" 
      });
    } else {
      console.error('❌ Failed to send Mini App test notification.');
      return res.status(500).json({ 
        success: false, 
        message: "Не удалось отправить тестовое уведомление." 
      });
    }
  } catch (error) {
    console.error('Error in Mini App test notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Произошла ошибка при отправке уведомления." 
    });
  }
}