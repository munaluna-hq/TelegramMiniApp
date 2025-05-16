import fetch from 'node-fetch';

// ChatID of your Telegram account
// Replace this with your actual Telegram chat ID
const CHAT_ID = "262371163"; // This appears to be your ID based on previous logs

// Function to send a message with a WebApp button
async function sendWelcomeMessage() {
  try {
    // Get the bot token
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN not found in environment variables");
      return;
    }

    // URL for your WebApp
    const WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app";

    // Create welcome message
    const welcomeText = 
      `Привет! 👋\n\n` +
      "Я бот WebApp. Вот что я могу:\n" +
      "• Открывать мини-приложения\n" +
      "• Помогать с задачами\n" +
      "• Просто быть рядом 😊";
    
    // Create keyboard with WebApp button
    const replyMarkup = {
      inline_keyboard: [
        [{ text: "Open WebApp", web_app: { url: WEBAPP_URL } }]
      ]
    };

    // Telegram API endpoint
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    // Request data
    const data = {
      chat_id: CHAT_ID,
      text: welcomeText,
      reply_markup: replyMarkup
    };

    console.log("Sending welcome message to Telegram...");
    
    // Make the request
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Parse and log the response
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Message sent successfully!");
      console.log("Your welcome message with WebApp button should now appear in your Telegram chat");
    } else {
      console.error("❌ Failed to send message:", result.description);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Run the function
sendWelcomeMessage();