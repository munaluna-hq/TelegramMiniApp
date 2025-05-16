/**
 * MunaLuna: Improved Forced Notification Test
 * 
 * This script sends a direct notification to a real Telegram ID
 * with extensive logging to help diagnose any issues
 */

// Set environment variables if needed
process.env.NODE_ENV = 'development';
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Directly import the notification system
import { sendReliableNotification } from './server/better-notify.js';

// Target Telegram ID (this is a real ID that works)
const TELEGRAM_ID = '262371163';

async function sendEnhancedNotification() {
  console.log('🚀 Starting improved notification test');
  console.log('-----------------------------------');
  console.log(`📱 Target Telegram ID: ${TELEGRAM_ID}`);
  console.log(`🔑 Bot token available: ${!!process.env.TELEGRAM_BOT_TOKEN}`);
  console.log(`🔑 Bot token length: ${process.env.TELEGRAM_BOT_TOKEN?.length || 0}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log('-----------------------------------');
  
  // Create a richly formatted message with timestamp to uniquely identify this notification
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  const testMessage = `
🔔 <b>IMPROVED NOTIFICATION TEST</b> 🔔

This is a test message from the improved notification system.
This message was sent on <b>${now.toLocaleDateString()}</b> at <b>${timestamp}</b>.

<b>Testing Features:</b>
• HTML formatting
• Emoji support 🎉
• Multiple notification attempts
• Fallback delivery systems

<i>If you see this message, the system is working correctly!</i>
Please confirm receipt of this message in the testing environment.
`;

  try {
    console.log('📤 Sending enhanced test notification...');
    
    // Send the notification with maximum reliability settings
    const result = await sendReliableNotification(TELEGRAM_ID, testMessage, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 3
    });
    
    if (result) {
      console.log('✅ NOTIFICATION SUCCESSFULLY SENT!');
      console.log('Please check your Telegram app for the message.');
    } else {
      console.error('❌ NOTIFICATION FAILED TO SEND!');
      console.error('Please check the logs above for details on what went wrong.');
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
  }
}

// Run the test and catch any top-level errors
sendEnhancedNotification().catch(error => {
  console.error('Fatal error in notification test:', error);
});