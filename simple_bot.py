import os
import requests
import json

# Token for the Telegram Bot API
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables!")

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

def send_test_message(chat_id):
    """Send a test message to verify bot is working"""
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": "Test message - bot is working!"
    }
    
    response = requests.post(url, data=data)
    print(f"Response: {response.status_code}")
    print(f"Response body: {response.text}")
    return response.status_code == 200

def set_commands():
    """Register bot commands with Telegram"""
    url = f"https://api.telegram.org/bot{TOKEN}/setMyCommands"
    commands = [
        {"command": "start", "description": "Start the bot and open WebApp"}
    ]
    
    data = {
        "commands": json.dumps(commands)
    }
    
    response = requests.post(url, data=data)
    print(f"Set commands response: {response.status_code}")
    print(f"Response body: {response.text}")
    return response.status_code == 200

def setup_webhook(webhook_url):
    """Setup webhook for the bot"""
    url = f"https://api.telegram.org/bot{TOKEN}/setWebhook"
    data = {
        "url": webhook_url
    }
    
    response = requests.post(url, data=data)
    print(f"Webhook setup response: {response.status_code}")
    print(f"Response body: {response.text}")
    return response.status_code == 200

def get_webhook_info():
    """Get current webhook info"""
    url = f"https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
    
    response = requests.get(url)
    print(f"Webhook info response: {response.status_code}")
    print(f"Response body: {response.text}")
    return response.status_code == 200

def get_bot_info():
    """Get information about the bot"""
    url = f"https://api.telegram.org/bot{TOKEN}/getMe"
    
    response = requests.get(url)
    print(f"Bot info response: {response.status_code}")
    print(f"Response body: {response.text}")
    return response.status_code == 200

if __name__ == "__main__":
    print("Telegram Bot Configuration Helper")
    print("================================")
    
    print("\nGetting bot information...")
    get_bot_info()
    
    print("\nGetting current webhook info...")
    get_webhook_info()
    
    print("\nSetting bot commands...")
    set_commands()
    
    # Uncomment and fill in chat_id to test sending a message
    # print("\nSending test message...")
    # send_test_message("YOUR_CHAT_ID_HERE")
    
    # Uncomment and fill in webhook URL to set up webhook
    # print("\nSetting up webhook...")
    # setup_webhook("YOUR_WEBHOOK_URL_HERE")