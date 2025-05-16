/**
 * MunaLuna: Force Telegram Notification
 * 
 * This script sends a direct notification to a specific Telegram ID
 * Used for testing and verifying notification functionality
 */

import { sendReliableNotification } from './server/better-notify.js';

const TELEGRAM_ID = '262371163';

async function sendForcedNotification() {
  try {
    console.log(`📤 Sending forced direct notification to Telegram ID: ${TELEGRAM_ID}`);
    
    const message = `
🔔 <b>MunaLuna Notification Test</b>

This is a direct notification test from MunaLuna.
Time sent: ${new Date().toLocaleTimeString()}

🕌 If you're seeing this message, notifications are working correctly!
    `;
    
    const result = await sendReliableNotification(TELEGRAM_ID, message, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 3
    });
    
    if (result) {
      console.log('✅ Direct notification sent successfully!');
    } else {
      console.error('❌ Failed to send direct notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Execute the function
sendForcedNotification();