#!/usr/bin/env python
"""
MunaLuna User Tracker Bot - aiogram implementation
This bot keeps track of user worship data for each user separately.
"""

import os
import json
import logging
import asyncio
from datetime import datetime, date
from typing import Dict, List, Optional, Union, Any

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.utils.markdown import hbold, hitalic, hcode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot with token from environment variable
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("No TELEGRAM_BOT_TOKEN found in environment variables")

# Initialize bot, dispatcher, and storage
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# In-memory data storage - each user will have their own data
USER_DATA = {}

# Available prayers
PRAYERS = ["fajr", "zuhr", "asr", "maghrib", "isha"]

# Data storage file
DATA_FILE = "user_tracker_data.json"

# Load existing data if available
def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return {}

# Save data to file
def save_data():
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(USER_DATA, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving data: {e}")

# Initialize data
USER_DATA = load_data()

# Get today's date as a string for storage
def get_today():
    return date.today().isoformat()

# Initialize a user's data structure if they don't exist yet
def ensure_user_data(user_id: str):
    user_id_str = str(user_id)  # Convert to string for JSON compatibility
    if user_id_str not in USER_DATA:
        USER_DATA[user_id_str] = {
            "name": "",
            "tracker": {},
            "settings": {
                "notifyFajr": True,
                "notifyZuhr": True,
                "notifyAsr": True,
                "notifyMaghrib": True,
                "notifyIsha": True,
                "notificationTime": "exact",
                "menstruationDays": 5,
                "cycleDays": 28
            }
        }
    
    # Initialize today's tracking if not present
    today = get_today()
    if today not in USER_DATA[user_id_str].get("tracker", {}):
        USER_DATA[user_id_str]["tracker"][today] = {
            "fajr": False,
            "zuhr": False,
            "asr": False,
            "maghrib": False,
            "isha": False,
            "dhikr": False,
            "quran": False
        }

# Start command handler
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = str(message.from_user.id)
    ensure_user_data(user_id)
    
    # Save user's name
    USER_DATA[user_id]["name"] = message.from_user.first_name
    save_data()
    
    # Create WebApp button
    webapp_button = KeyboardButton(
        text="Открыть MunaLuna 🌙",
        web_app=types.WebAppInfo(url="https://telegram-mini-app-guljansmm.replit.app/")
    )
    
    # Create keyboard with the WebApp button
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[webapp_button]],
        resize_keyboard=True
    )
    
    await message.answer(
        f"Ассаляму алейкум, {hbold(message.from_user.first_name)}!\n\n"
        "MunaLuna - ваш личный ассистент для отслеживания поклонения.\n\n"
        "Вы можете использовать следующие команды:\n"
        "/status - узнать статус ваших молитв на сегодня\n"
        "/done [молитва] - отметить молитву выполненной\n"
        "/settings - настройки уведомлений\n"
        "Или нажмите кнопку ниже, чтобы открыть полную версию приложения:",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

# Status command handler
@dp.message(Command("status"))
async def cmd_status(message: types.Message):
    user_id = str(message.from_user.id)
    ensure_user_data(user_id)
    
    today = get_today()
    user_tracker = USER_DATA[user_id]["tracker"][today]
    
    status_text = f"📊 {hbold('Ваши ибадаты на сегодня')} ({today}):\n\n"
    
    # Add prayer status
    status_text += f"🕋 {hbold('Намазы')}:\n"
    for prayer in PRAYERS:
        status = "✅" if user_tracker[prayer] else "⬜️"
        status_text += f"{status} {prayer.capitalize()}\n"
    
    # Add other worship activities
    status_text += f"\n📿 {hbold('Дополнительно')}:\n"
    status_text += f"{'✅' if user_tracker['dhikr'] else '⬜️'} Зикр\n"
    status_text += f"{'✅' if user_tracker['quran'] else '⬜️'} Коран\n"
    
    # Calculate completion percentage
    total_items = len(PRAYERS) + 2  # Prayers + dhikr + quran
    completed = sum(1 for k, v in user_tracker.items() if v is True)
    percentage = int((completed / total_items) * 100)
    
    status_text += f"\n{hbold('Прогресс')}: {percentage}% завершено ⭐️"
    
    await message.answer(status_text, parse_mode="HTML")

# Done command handler
@dp.message(Command("done"))
async def cmd_done(message: types.Message):
    user_id = str(message.from_user.id)
    ensure_user_data(user_id)
    
    # Parse command arguments
    command_parts = message.text.split()
    if len(command_parts) < 2:
        await message.answer(
            "Пожалуйста, укажите, какую ибадат вы выполнили.\n"
            "Например: /done fajr или /done quran"
        )
        return
    
    activity = command_parts[1].lower()
    today = get_today()
    
    valid_activities = PRAYERS + ["dhikr", "quran"]
    if activity not in valid_activities:
        await message.answer(
            f"Неизвестная активность: {activity}\n"
            f"Доступные варианты: {', '.join(valid_activities)}"
        )
        return
    
    # Mark the activity as done
    USER_DATA[user_id]["tracker"][today][activity] = True
    save_data()
    
    await message.answer(
        f"✅ {hbold(activity.capitalize())} отмечен как выполненный!",
        parse_mode="HTML"
    )
    
    # Send summary of completed activities
    user_tracker = USER_DATA[user_id]["tracker"][today]
    completed = sum(1 for k, v in user_tracker.items() if v is True)
    total = len(user_tracker)
    percentage = int((completed / total) * 100)
    
    await message.answer(
        f"🎯 Ваш прогресс на сегодня: {completed}/{total} ({percentage}%)",
        parse_mode="HTML"
    )

# Settings command handler
@dp.message(Command("settings"))
async def cmd_settings(message: types.Message):
    user_id = str(message.from_user.id)
    ensure_user_data(user_id)
    
    settings = USER_DATA[user_id]["settings"]
    
    settings_text = f"⚙️ {hbold('Ваши настройки')}:\n\n"
    
    # Notification settings
    settings_text += f"🔔 {hbold('Уведомления')}:\n"
    for prayer in PRAYERS:
        key = f"notify{prayer.capitalize()}"
        status = "✅" if settings.get(key, True) else "❌"
        settings_text += f"{status} {prayer.capitalize()}\n"
    
    # Notification timing
    timing_map = {
        "exact": "Точно в намаз",
        "5min": "За 5 минут",
        "10min": "За 10 минут"
    }
    time_setting = settings.get("notificationTime", "exact")
    settings_text += f"\n⏰ {hbold('Время уведомлений')}: {timing_map.get(time_setting, 'Точно в намаз')}\n"
    
    # Cycle settings
    settings_text += f"\n🔄 {hbold('Настройки цикла')}:\n"
    settings_text += f"📅 Дней менструации: {settings.get('menstruationDays', 5)}\n"
    settings_text += f"⏱️ Длина цикла: {settings.get('cycleDays', 28)} дней\n"
    
    # Add note about changing settings
    settings_text += "\n💡 Для изменения настроек используйте полную версию приложения."
    
    await message.answer(settings_text, parse_mode="HTML")

# Help command handler
@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    help_text = f"{hbold('Команды бота MunaLuna')}:\n\n"
    help_text += "/start - Начать использование бота\n"
    help_text += "/status - Показать статус ваших ибадатов на сегодня\n"
    help_text += "/done [активность] - Отметить активность как выполненную\n"
    help_text += "/settings - Показать ваши текущие настройки\n"
    help_text += "/help - Показать это сообщение\n\n"
    
    help_text += f"{hbold('Доступные активности')}:\n"
    help_text += "- fajr, zuhr, asr, maghrib, isha - молитвы\n"
    help_text += "- dhikr - зикр\n"
    help_text += "- quran - чтение Корана\n\n"
    
    help_text += "Для использования полной версии приложения, нажмите кнопку 'Открыть MunaLuna 🌙'"
    
    await message.answer(help_text, parse_mode="HTML")

# Handle all other messages
@dp.message()
async def echo_message(message: types.Message):
    # Check if this is a command-like message but not a valid command
    if message.text.startswith('/'):
        await message.answer(
            "Неизвестная команда. Используйте /help для просмотра списка доступных команд."
        )
        return
    
    # Just echo back the message for other cases
    await message.answer(
        f"Я получил ваше сообщение: {message.text}\n"
        "Используйте /help для просмотра списка доступных команд."
    )

# Main function to start the bot
async def main():
    logger.info("Starting MunaLuna User Tracker Bot")
    
    # Initialize the bot
    await dp.start_polling(bot)

if __name__ == "__main__":
    # Run the bot
    asyncio.run(main())