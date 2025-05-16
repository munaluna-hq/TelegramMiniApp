import fetch from 'node-fetch';

// Function to send a welcome message with WebApp button to a specific chat ID
async function sendWelcomeMessage(chatId) {
  // Get bot token from environment variables
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required!');
    return false;
  }

  // The URL to your Telegram Mini Web App
  const WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app";

  try {
    // Create welcome message
    const welcomeText = 
      `Ассаляму алейкум! 👋\n\n` +
      "Добро пожаловать в MunaLuna!\n\n" +
      "MunaLuna - это приложение, которое помогает мусульманкам системно и легко планировать поклонение, учитывая женский цикл и нормы шариата.\n\n" +
      "Как это работает:\n" + 
      "• Отслеживание менструального цикла\n" +
      "• Планирование поклонения и ежедневных духовных практик\n" +
      "• Напоминания о времени намаза\n" +
      "• Получение духовной поддержки\n\n" +
      "Планируй поклонение с умом и спокойствием!";
    
    // Create inline keyboard with WebApp button
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Открыть MunaLuna', web_app: { url: WEBAPP_URL } }]
      ]
    };
    
    // Prepare the API call
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: welcomeText,
      reply_markup: keyboard
    };
    
    console.log(`Sending welcome message to chat ID: ${chatId}`);
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('Welcome message sent successfully!');
      return true;
    } else {
      console.error('Failed to send message:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Ask the user for a chat ID
console.log('Enter your Telegram chat ID to send a test message:');
process.stdin.once('data', async (data) => {
  const chatId = data.toString().trim();
  if (!chatId) {
    console.error('No chat ID provided!');
    process.exit(1);
  }
  
  console.log(`Sending test message to chat ID: ${chatId}`);
  await sendWelcomeMessage(chatId);
  process.exit(0);
});