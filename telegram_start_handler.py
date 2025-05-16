import os
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# Token for the Telegram Bot API
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables!")

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

@app.route('/telegram-webhook', methods=['POST'])
def webhook():
    """Handle incoming webhook data from Telegram"""
    update = request.json
    
    # Check if it's a message with text
    if update and 'message' in update and 'text' in update['message']:
        chat_id = update['message']['chat']['id']
        text = update['message']['text']
        
        # Get user's first name if available
        user_firstname = update['message']['from']['first_name'] if 'from' in update['message'] and 'first_name' in update['message']['from'] else "there"
        
        # Handle /start command
        if text == '/start':
            send_welcome_message(chat_id, user_firstname)
    
    return jsonify({"ok": True})

def send_welcome_message(chat_id, user_firstname):
    """Send welcome message with WebApp button"""
    # Create welcome message with personalized greeting
    welcome_text = (
        f"Привет, {user_firstname}! 👋\n\n"
        "Я бот WebApp. Вот что я могу:\n"
        "• Открывать мини-приложения\n"
        "• Помогать с задачами\n"
        "• Просто быть рядом 😊"
    )
    
    # Create inline keyboard with WebApp button
    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "Open WebApp",
                    "web_app": {"url": WEBAPP_URL}
                }
            ]
        ]
    }
    
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": welcome_text,
        "reply_markup": json.dumps(keyboard)
    }
    
    response = requests.post(url, data=data)
    print(f"Message sent: {response.status_code}")
    return response.status_code == 200

@app.route('/set-webhook', methods=['GET'])
def set_webhook():
    """Set the webhook URL for the bot"""
    webhook_url = f"https://{request.host}/telegram-webhook"
    url = f"https://api.telegram.org/bot{TOKEN}/setWebhook"
    data = {
        "url": webhook_url
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        return f"Webhook set to {webhook_url}"
    else:
        return f"Failed to set webhook: {response.text}"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return "Bot is running"

if __name__ == "__main__":
    print("Starting Telegram bot webhook server...")
    app.run(host='0.0.0.0', port=8080)