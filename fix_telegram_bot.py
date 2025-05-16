import os
import json
import requests

# Get the bot token from environment variables
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    print("No TELEGRAM_BOT_TOKEN found in environment variables!")
    exit(1)

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

def setup_commands():
    """Set up bot commands so they appear in menu"""
    url = f"https://api.telegram.org/bot{TOKEN}/setMyCommands"
    commands = [
        {"command": "start", "description": "Начать работу с ботом"}
    ]
    
    response = requests.post(url, json={"commands": commands})
    print(f"Setting up commands... Status: {response.status_code}")
    print(response.json())
    return response.status_code == 200

def delete_webhook():
    """Delete any existing webhook"""
    url = f"https://api.telegram.org/bot{TOKEN}/deleteWebhook"
    response = requests.get(url)
    print(f"Deleting webhook... Status: {response.status_code}")
    print(response.json())
    return response.status_code == 200

def enable_long_polling():
    """Switch to long polling mode instead of webhooks"""
    # First delete any existing webhook
    if not delete_webhook():
        print("Failed to delete webhook")
        return False
    
    # Now the bot will use long polling automatically
    return True

if __name__ == "__main__":
    print("Fixing Telegram Bot Configuration")
    print("================================")
    
    # Step 1: Delete webhook to use polling instead
    print("\nEnabling long polling mode...")
    if enable_long_polling():
        print("✅ Long polling mode enabled")
    else:
        print("❌ Failed to enable long polling mode")
    
    # Step 2: Set up bot commands
    print("\nSetting up bot commands...")
    if setup_commands():
        print("✅ Bot commands set up")
    else:
        print("❌ Failed to set up bot commands")
    
    print("\n✅ Your bot should now be ready to respond to /start command with polling mode.")
    print("Run your bot with python python_telegram_bot.py to start responding to commands.")