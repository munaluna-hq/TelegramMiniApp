import os
import logging
from flask import Flask, request, Response
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, Bot, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters
)
from threading import Thread
import asyncio

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get the bot token from environment variables
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables!")

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

# Flask app for webhook
app = Flask(__name__)

# Create bot and application instances
bot = Bot(token=TELEGRAM_BOT_TOKEN)
application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send welcome message when the command /start is issued."""
    
    # Create an inline keyboard with a button to open the WebApp
    keyboard = [
        [InlineKeyboardButton("Open WebApp", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Welcome message text
    welcome_message = """Добро пожаловать в MunaLuna!

MunaLuna - это приложение, которое помогает мусульманкам системно и легко планировать поклонение, учитывая женский цикл и нормы шариата.

Как это работает:
Наш инструмент помогает:
• Планировать важные религиозные обряды в нужное время
• Следить за своим здоровьем и состоянием с учётом особенностей женского организма
• Получать поддержку и рекомендации для уверенного поклонения каждый день

Планируй поклонение с умом и спокойствием!

Присоединяйся!"""
    
    # Send message with the inline keyboard
    if update.message:
        await update.message.reply_text(
            text=welcome_message,
            reply_markup=reply_markup
        )
        if update.effective_user:
            logger.info(f"Start command sent to user {update.effective_user.id}")

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Echo the user message."""
    if update.message:
        await update.message.reply_text(
            "Для взаимодействия с ботом используйте команду /start или перейдите в WebApp."
        )

# Flask can't directly handle async functions
@app.route('/telegram-webhook', methods=['POST'])
def webhook_handler():
    """Handle the webhook updates from Telegram."""
    if request.method == "POST":
        try:
            # Create an event loop for async processing
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Get the update data
            update_data = request.get_json(force=True)
            
            # Process the update asynchronously
            update = Update.de_json(update_data, bot)
            loop.run_until_complete(application.process_update(update))
            
            loop.close()
        except Exception as e:
            logger.error(f"Error processing update: {e}")
        
        # Always return 200 OK for Telegram
        return Response('', status=200)
    
    return Response('Only POST requests are accepted', status=403)

@app.route('/set-webhook', methods=['GET'])
def set_webhook():
    """Set the webhook for the Telegram bot."""
    webhook_url = f"https://{request.host}/telegram-webhook"
    
    # Create an event loop for async processing
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Set the webhook asynchronously
    success = loop.run_until_complete(bot.set_webhook(webhook_url))
    
    loop.close()
    
    if success:
        return f"Webhook set to {webhook_url}"
    return "Failed to set webhook"

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return "Bot is running!"

def register_handlers():
    """Register all the handlers for the application."""
    # Register command handlers
    application.add_handler(CommandHandler("start", start_command))
    
    # Add a default message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))
    
    logger.info("Handlers registered")

def run_flask():
    """Run the Flask app."""
    # Use 0.0.0.0 to make the server publicly available
    app.run(host='0.0.0.0', port=8080, use_reloader=False)

def main():
    """Start the bot."""
    # Register all handlers
    register_handlers()
    
    # Start the Flask app in a separate thread
    flask_thread = Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    logger.info("Bot started successfully with /start command that displays:")
    logger.info("- Welcome message in Russian")
    logger.info("- WebApp button that opens the Telegram Mini App")
    
    # Keep the main thread running
    try:
        from flask import cli
        cli.show_server_banner = lambda *args, **kwargs: None
        flask_thread.join()
    except KeyboardInterrupt:
        logger.info("Bot stopped")

if __name__ == '__main__':
    main()