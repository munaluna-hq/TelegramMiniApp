import os
import json
import requests
import logging

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
    logger.info(f"Sending welcome message to {chat_id}...")
    response = requests.post(url, data=data)
    
    # Check if the request was successful
    if response.status_code == 200:
        result = response.json()
        logger.info(f"Welcome message sent successfully: {result}")
        return True
    else:
        logger.error(f"Failed to send welcome message. Status code: {response.status_code}, Response: {response.text}")
        return False

# Use this function to test with your Telegram ID
# To get your Telegram ID, message @userinfobot on Telegram
# Example: CHAT_ID = "123456789"  (it should be a number represented as a string)
CHAT_ID = "YOUR_CHAT_ID_HERE"

if __name__ == "__main__":
    print("Starting welcome message test...")
    if CHAT_ID == "YOUR_CHAT_ID_HERE":
        print("Please edit this file and replace YOUR_CHAT_ID_HERE with your actual Telegram ID")
        print("You can get your Telegram ID by messaging @userinfobot on Telegram")
    else:
        success = send_welcome_message(CHAT_ID)
        if success:
            print(f"Welcome message with WebApp button successfully sent to chat ID: {CHAT_ID}")
        else:
            print(f"Failed to send welcome message to chat ID: {CHAT_ID}")