import os
import requests
import logging

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get bot token from environment
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables!")

def register_webhook(webhook_url):
    """
    Registers a webhook URL with the Telegram Bot API
    """
    api_url = f"https://api.telegram.org/bot{TOKEN}/setWebhook"
    data = {
        "url": webhook_url,
        "allowed_updates": ["message"]
    }
    
    response = requests.post(api_url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            logger.info(f"Webhook successfully set to: {webhook_url}")
            logger.info(f"Response: {result}")
            return True
        else:
            logger.error(f"Failed to set webhook: {result}")
            return False
    else:
        logger.error(f"Request failed with status code: {response.status_code}")
        logger.error(f"Response: {response.text}")
        return False

def get_webhook_info():
    """
    Gets information about the current webhook
    """
    api_url = f"https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
    
    response = requests.get(api_url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            webhook_info = result.get("result", {})
            logger.info(f"Current webhook info: {webhook_info}")
            return webhook_info
        else:
            logger.error(f"Failed to get webhook info: {result}")
            return None
    else:
        logger.error(f"Request failed with status code: {response.status_code}")
        logger.error(f"Response: {response.text}")
        return None

def delete_webhook():
    """
    Deletes the current webhook
    """
    api_url = f"https://api.telegram.org/bot{TOKEN}/deleteWebhook"
    
    response = requests.get(api_url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            logger.info("Webhook successfully deleted")
            return True
        else:
            logger.error(f"Failed to delete webhook: {result}")
            return False
    else:
        logger.error(f"Request failed with status code: {response.status_code}")
        logger.error(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python webhook_setup.py info   - Get current webhook info")
        print("  python webhook_setup.py delete - Delete current webhook")
        print("  python webhook_setup.py set URL - Set webhook to URL")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "info":
        get_webhook_info()
    elif command == "delete":
        delete_webhook()
    elif command == "set" and len(sys.argv) >= 3:
        webhook_url = sys.argv[2]
        register_webhook(webhook_url)
    else:
        print("Invalid command. Use 'info', 'delete', or 'set URL'")