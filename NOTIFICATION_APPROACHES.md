# MunaLuna Notification System Overview

## Introduction

This document describes the multi-approach notification system implemented in MunaLuna to ensure reliable delivery of notifications in the Telegram Mini App environment.

## Notification Methods (In Order of Reliability)

### 1. Direct API Approach
- Uses direct Telegram Bot API calls without library dependencies
- Implemented in `server/direct_telegram_api.js`
- Most reliable method for Telegram Mini App environment
- Handles proper formatting and notification settings
- Used as primary approach for all notification types

### 2. Enhanced Reliable Notification
- Uses improved notification delivery with retries and error handling
- Implemented in `server/better-notify.js`
- Serves as first fallback if direct API fails
- Includes detailed logging for troubleshooting

### 3. Standard Telegram Library
- Uses standard Telegram library approach
- Implemented via webhook handling in `server/telegram-webhook.js`
- Serves as final fallback option

## Notification Types

Each notification type tries multiple approaches in sequence to maximize reliability:

1. **Prayer Time Notifications**
   - Sent for Fajr, Zuhr, Asr, Maghrib, and Isha prayers
   - Configurable timing (exact, 5 min before, 10 min before)
   - Includes random motivational messages

2. **Settings Update Notifications**
   - Confirms when user settings are changed
   - Shows which settings were updated

3. **Tracker Update Notifications**
   - Confirms when daily worship activities are recorded
   - Summarizes recorded activities

4. **Daily Summary Notifications**
   - Provides end-of-day summary of all worship activities
   - Sent at configurable time

5. **Cycle Update Notifications**
   - Confirms when cycle data is updated
   - Shows cycle phases and dates

## Testing the Notification System

Use our test script to verify all notification approaches:
```bash
node test_multi_approach_notifications.js [telegram_id]
```

This will test all three approaches and provide a summary of which ones work.

## Troubleshooting

If notifications aren't working:

1. Check if the Telegram bot token is valid
2. Verify the webhook is properly set up
3. Ensure the Telegram ID being used is correct (numeric only)
4. Check server logs for detailed error messages
5. Try the direct test endpoint at `/api/send-direct-test`

## Developer Notes

- Always implement the multi-approach pattern for any new notification types
- Add detailed logging for each notification attempt
- Use the `directApi.sendImportantNotification()` method for critical notifications
- Use `directApi.sendSilentNotification()` for less urgent updates