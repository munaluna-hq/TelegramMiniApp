import fetch from 'node-fetch';

// This script sends a direct message to your Telegram account
// It bypasses all the regular notification system to ensure delivery

async function sendDirectMessage() {
  try {
    // Get bot token
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN not found in environment variables");
      return;
    }

    // This should be your Telegram chat ID
    // We'll try multiple known formats of this ID to ensure delivery
    const possibleChatIds = [
      "262371163",       // Regular numeric ID
      "@guljansmm",      // Username format if that's your username
    ];

    // Create an attention-grabbing message
    const message = 
      `🚨 ВАЖНОЕ УВЕДОМЛЕНИЕ 🚨\n\n` +
      `Ассаляму алейкум!\n\n` +
      `Это прямое тестовое сообщение от бота MunaLuna, отправленное: ${new Date().toLocaleTimeString()}\n\n` +
      `Если вы видите это сообщение, пожалуйста, ответьте в чате Replit, что оно успешно доставлено.\n\n` +
      `Спасибо!`;

    let delivered = false;

    // Try sending to each possible chat ID format
    for (const chatId of possibleChatIds) {
      try {
        console.log(`Attempting to send message to chat ID: ${chatId}`);
        
        // Direct API call with minimal parameters
        const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message
          })
        });

        const result = await response.json();
        
        if (result.ok) {
          console.log(`✅ Message successfully delivered to ${chatId}!`);
          delivered = true;
          break;
        } else {
          console.log(`❌ Failed to deliver to ${chatId}: ${result.description}`);
        }
      } catch (err) {
        console.error(`Error trying ${chatId}:`, err);
      }
    }

    if (delivered) {
      console.log("\nMessage was successfully delivered! Check your Telegram app.");
    } else {
      console.error("\nFailed to deliver the message to any chat ID.");
      console.log("Please verify that:");
      console.log("1. Your Telegram bot token is correct");
      console.log("2. You have started a chat with your bot by sending /start");
      console.log("3. Your chat ID is correct");
    }
  } catch (error) {
    console.error("General error:", error);
  }
}

// Execute the function
sendDirectMessage();