import os
import json
import requests

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

# Get the bot token from environment variables
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    print("No TELEGRAM_BOT_TOKEN found in environment variables!")
    exit(1)

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

    # API endpoint for sending messages
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    
    # Data to send
    data = {
        "chat_id": chat_id,
        "text": welcome_message,
        "reply_markup": json.dumps(keyboard)
    }
    
    # Send the request
    print(f"Sending message to Telegram chat ID: {chat_id}")
    response = requests.post(url, data=data)
    
    # Check if the request was successful
    if response.status_code == 200:
        print("Message sent successfully!")
        print(response.json())
        return True
    else:
        print(f"Failed to send message. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    # You need to replace this with your Telegram chat ID
    chat_id = input("Enter your Telegram chat ID: ")
    
    if not chat_id:
        print("No chat ID provided. Exiting.")
        exit(1)
    
    send_welcome_message(chat_id)