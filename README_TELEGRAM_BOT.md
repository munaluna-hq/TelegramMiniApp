# MunaLuna Telegram Bot with User-Specific Data

This repository contains two implementations of a Telegram bot for MunaLuna that properly isolates user data, ensuring each user has their own separate tracker:

1. **Memory-based storage** (`user_tracker_bot.py`): Uses a JSON file for persistence
2. **SQLite-based storage** (`user_tracker_bot_sqlite.py`): Uses an SQLite database for more robust persistence

## Features

- ✅ User-specific data storage - each user's actions only affect their own data
- ✅ Track daily prayers (Fajr, Zuhr, Asr, Maghrib, Isha)
- ✅ Track additional worship activities (Dhikr, Quran)
- ✅ Save user-specific settings (notification preferences, cycle settings)
- ✅ Calculate and display daily progress
- ✅ Integration with MunaLuna web app

## Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and see welcome message |
| `/status` | Check your current prayer and worship status for today |
| `/done [activity]` | Mark a specific prayer or activity as completed |
| `/settings` | View your current notification and cycle settings |
| `/help` | Display available commands and instructions |

## Data Storage

### Memory-based Version
- Uses a simple in-memory dictionary to store user data
- Periodically saves to `user_tracker_data.json` for persistence
- Ideal for simple deployments with low to moderate user volume

### SQLite Version
- Uses SQLite database (`munaluna_tracker.db`)
- More robust for higher volumes of users and data
- Better data integrity and query capabilities
- Recommended for production use

## Setting Up

1. Ensure you have the required dependencies:
   ```
   pip install aiogram
   ```

2. Set your Telegram Bot Token:
   ```
   export TELEGRAM_BOT_TOKEN="your_bot_token_here"
   ```

3. Run the bot (choose one):
   ```
   python user_tracker_bot.py       # Memory-based version
   ```
   or
   ```
   python user_tracker_bot_sqlite.py  # SQLite version
   ```

## Integration with MunaLuna Mini App

The bot includes a button to launch the full MunaLuna Telegram Mini App, providing seamless integration between the basic bot commands and the full-featured web application.

## Privacy & Data Isolation

Unlike previous implementations:
- Each user's data is completely isolated
- One user's actions never affect another user's data
- Settings are individually stored per user
- Worship tracking is user-specific

## Performance Considerations

- The SQLite version is recommended for deployments with more than 100 users
- For very large deployments (1000+ users), consider migrating to a more robust database like PostgreSQL

## Telegram Bot API Features Used

- Persistent button keyboard with WebApp button
- HTML formatting for better readability
- Command handling with arguments
- User tracking and identification