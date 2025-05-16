#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Simple Telegram Bot implementation that handles the /start command
and responds with a welcome message and a WebApp button.
"""
import os
import json
import logging
import requests
from flask import Flask, request

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get the bot token from environment variables
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables!")

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

# Flask app for webhook
app = Flask(__name__)

def send_welcome_message(chat_id):
    """
    Sends the welcome message with a WebApp button to the specified chat.
    """
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

    # Create keyboard with WebApp button
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

    # API endpoint for sending messages
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    
    # Data to send
    data = {
        "chat_id": chat_id,
        "text": welcome_message,
        "reply_markup": json.dumps(keyboard)
    }
    
    # Send the request
    response = requests.post(url, data=data)
    
    # Check if the request was successful
    if response.status_code == 200:
        logger.info(f"Welcome message sent successfully to chat ID: {chat_id}")
        return True
    else:
        logger.error(f"Failed to send welcome message. Status code: {response.status_code}, Response: {response.text}")
        return False

@app.route('/telegram-webhook', methods=['POST'])
def webhook():
    """Handle webhook requests from Telegram."""
    # Get update data
    update = request.json
    
    # Check if it's a message with text
    if update and 'message' in update and 'text' in update['message']:
        chat_id = update['message']['chat']['id']
        text = update['message']['text']
        
        # Handle /start command
        if text == '/start':
            logger.info(f"Received /start command from chat ID: {chat_id}")
            send_welcome_message(chat_id)
    
    return {'ok': True}

@app.route('/set-webhook', methods=['GET'])
def set_webhook():
    """Set the webhook for the bot."""
    webhook_url = f"https://{request.host}/telegram-webhook"
    url = f"https://api.telegram.org/bot{TOKEN}/setWebhook"
    data = {'url': webhook_url}
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200 and response.json().get('ok'):
        return f"Webhook set to {webhook_url}"
    else:
        return f"Failed to set webhook: {response.text}"

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint."""
    return "Bot is running!"

def test_send_message():
    """Test function to send a welcome message to a specific chat ID."""
    # Replace with an actual chat ID for testing
    chat_id = input("Enter your Telegram chat ID for testing: ")
    if not chat_id:
        logger.error("No chat ID provided")
        return
    
    if send_welcome_message(chat_id):
        print(f"Test message sent successfully to {chat_id}")
    else:
        print("Failed to send test message")

if __name__ == "__main__":
    # For testing direct message sending
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_send_message()
    else:
        # Run the webhook server
        logger.info("Starting Telegram bot webhook server...")
        app.run(host='0.0.0.0', port=8080)