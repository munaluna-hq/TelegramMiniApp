/**
 * MunaLuna Notification Sender
 * 
 * This utility tool sends test notifications to a Telegram user
 * Usage: node send_notification.js <chat_id> "<message>"
 * Example: node send_notification.js 262371163 "Hello, this is a test message"
 */

import { sendReliableNotification } from './server/better-notify.js';

// Get command line arguments
const chatId = process.argv[2];
const message = process.argv[3];

// Validate input
if (!chatId || !message) {
  console.log("Usage: node send_notification.js <chat_id> \"<message>\"");
  console.log("Example: node send_notification.js 262371163 \"Hello, this is a test message\"");
  process.exit(1);
}

// Send the notification
console.log(`Sending notification to Telegram chat ID: ${chatId}`);
console.log(`Message: ${message}`);

sendReliableNotification(chatId, message, {
  useHTML: true,
  enableSound: true,
  priority: "high",
  retryCount: 3
}).then(result => {
  if (result) {
    console.log("✅ Notification sent successfully!");
  } else {
    console.error("❌ Failed to send notification.");
  }
}).catch(error => {
  console.error("❌ Error sending notification:", error);
});