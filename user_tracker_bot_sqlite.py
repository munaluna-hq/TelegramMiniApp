#!/usr/bin/env python
"""
MunaLuna User Tracker Bot - aiogram implementation with SQLite storage
This bot keeps track of user worship data for each user separately using SQLite.
"""

import os
import json
import logging
import asyncio
import sqlite3
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

# Available prayers
PRAYERS = ["fajr", "zuhr", "asr", "maghrib", "isha"]

# Database setup
DB_FILE = "munaluna_tracker.db"

def init_db():
    """Initialize the SQLite database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT,
        settings TEXT
    )
    ''')
    
    # Create tracker table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tracker (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        date TEXT,
        prayer_name TEXT,
        completed BOOLEAN,
        UNIQUE(user_id, date, prayer_name)
    )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")

# User data functions
def get_user(user_id):
    """Get user data from database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return {
            "user_id": user[0],
            "name": user[1],
            "settings": json.loads(user[2]) if user[2] else {}
        }
    return None

def save_user(user_id, name, settings=None):
    """Save user data to database"""
    if settings is None:
        settings = {
            "notifyFajr": True,
            "notifyZuhr": True,
            "notifyAsr": True,
            "notifyMaghrib": True,
            "notifyIsha": True,
            "notificationTime": "exact",
            "menstruationDays": 5,
            "cycleDays": 28
        }
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    settings_json = json.dumps(settings)
    
    cursor.execute(
        "INSERT OR REPLACE INTO users (user_id, name, settings) VALUES (?, ?, ?)",
        (user_id, name, settings_json)
    )
    
    conn.commit()
    conn.close()

def get_tracker_for_date(user_id, date_str):
    """Get user's tracker data for a specific date"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT prayer_name, completed FROM tracker WHERE user_id = ? AND date = ?",
        (user_id, date_str)
    )
    
    results = cursor.fetchall()
    conn.close()
    
    tracker = {
        "fajr": False,
        "zuhr": False,
        "asr": False,
        "maghrib": False,
        "isha": False,
        "dhikr": False,
        "quran": False
    }
    
    for prayer_name, completed in results:
        tracker[prayer_name] = bool(completed)
    
    return tracker

def save_tracker_item(user_id, date_str, prayer_name, completed):
    """Save a tracker item to the database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        """
        INSERT OR REPLACE INTO tracker 
        (user_id, date, prayer_name, completed) 
        VALUES (?, ?, ?, ?)
        """,
        (user_id, date_str, prayer_name, completed)
    )
    
    conn.commit()
    conn.close()

# Get today's date as a string for storage
def get_today():
    return date.today().isoformat()

# Initialize a user if they don't exist yet
def ensure_user_exists(user_id, name):
    user = get_user(user_id)
    if not user:
        # Create new user with default settings
        save_user(user_id, name)
        logger.info(f"Created new user: {user_id}, {name}")
    
    # Initialize today's tracker data if it doesn't exist
    today = get_today()
    tracker = get_tracker_for_date(user_id, today)
    
    # If no tracker items were found for today, initialize them
    if not any(tracker.values()):
        for prayer in list(tracker.keys()):
            save_tracker_item(user_id, today, prayer, False)
        logger.info(f"Initialized tracker for user {user_id} on {today}")

# Start command handler
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = str(message.from_user.id)
    name = message.from_user.first_name
    
    # Ensure user exists in database
    ensure_user_exists(user_id, name)
    
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
        f"Ассаляму алейкум, {hbold(name)}!\n\n"
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
    name = message.from_user.first_name
    
    # Ensure user exists
    ensure_user_exists(user_id, name)
    
    today = get_today()
    user_tracker = get_tracker_for_date(user_id, today)
    
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
    name = message.from_user.first_name
    
    # Ensure user exists
    ensure_user_exists(user_id, name)
    
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
    save_tracker_item(user_id, today, activity, True)
    
    await message.answer(
        f"✅ {hbold(activity.capitalize())} отмечен как выполненный!",
        parse_mode="HTML"
    )
    
    # Send summary of completed activities
    user_tracker = get_tracker_for_date(user_id, today)
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
    name = message.from_user.first_name
    
    # Ensure user exists
    ensure_user_exists(user_id, name)
    
    # Get user settings
    user = get_user(user_id)
    settings = user["settings"]
    
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
    logger.info("Starting MunaLuna User Tracker Bot with SQLite storage")
    
    # Initialize the database
    init_db()
    
    # Initialize the bot
    await dp.start_polling(bot)

if __name__ == "__main__":
    # Run the bot
    asyncio.run(main())