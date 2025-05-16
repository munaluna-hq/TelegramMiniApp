#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Simple Telegram Bot implementation using python-telegram-bot library.
This bot responds to the /start command with a welcome message and WebApp button.
"""
import os
import logging
import asyncio
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# The URL to your Telegram Mini Web App
WEBAPP_URL = "https://telegram-mini-app-guljansmm.replit.app"

# Welcome message
WELCOME_MESSAGE = """Добро пожаловать в MunaLuna!

MunaLuna - это приложение, которое помогает мусульманкам системно и легко планировать поклонение, учитывая женский цикл и нормы шариата.

Как это работает:
Наш инструмент помогает:
• Планировать важные религиозные обряды в нужное время
• Следить за своим здоровьем и состоянием с учётом особенностей женского организма
• Получать поддержку и рекомендации для уверенного поклонения каждый день

Планируй поклонение с умом и спокойствием!

Присоединяйся!"""

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send welcome message when the command /start is issued."""
    # Create an inline keyboard with a button to open the WebApp
    keyboard = [
        [InlineKeyboardButton("Open WebApp", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Send message with inline keyboard
    await update.message.reply_text(WELCOME_MESSAGE, reply_markup=reply_markup)
    
    # Log the action
    if update.effective_user:
        logger.info(f"Sent welcome message to {update.effective_user.id}")
    else:
        logger.info("Sent welcome message to a user (ID not available)")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    await update.message.reply_text("Используйте команду /start чтобы начать.")

def main() -> None:
    """Start the bot."""
    # Get the bot token from environment variables
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("No TELEGRAM_BOT_TOKEN found in environment variables!")
        return
    
    application = Application.builder().token(token).build()
    
    # Register command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    
    # Start the Bot
    logger.info("Starting bot in polling mode...")
    application.run_polling()

if __name__ == "__main__":
    main()