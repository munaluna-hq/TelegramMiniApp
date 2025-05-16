import { Telegraf } from 'telegraf';

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

// URL for the webapp
const WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app";

// Create a bot instance
const bot = new Telegraf(token);

// Handle the /start command
bot.start((ctx) => {
  // Get the user's first name
  const firstName = ctx.from.first_name || 'there';
  
  // Create welcome message with personalized greeting
  const welcomeText = 
    `Привет, ${firstName}! 👋\n\n` +
    "Я бот WebApp. Вот что я могу:\n" +
    "• Открывать мини-приложения\n" +
    "• Помогать с задачами\n" +
    "• Просто быть рядом 😊";
  
  // Create inline keyboard with WebApp button
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Open WebApp', web_app: { url: WEBAPP_URL } }]
    ]
  };
  
  // Send message with inline keyboard
  return ctx.reply(welcomeText, {
    reply_markup: keyboard
  });
});

// Handle the /help command
bot.help((ctx) => ctx.reply('Используйте команду /start чтобы начать.'));

// Start the bot in polling mode
console.log('Starting bot in polling mode...');
bot.launch()
  .then(() => {
    console.log('Bot is running!');
    console.log('Press Ctrl+C to stop');
  })
  .catch((err) => {
    console.error('Error starting bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));