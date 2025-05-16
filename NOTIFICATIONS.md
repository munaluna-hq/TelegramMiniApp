# MunaLuna Notification System Documentation

This document describes the notification system used in the MunaLuna Telegram Mini Web App.

## Overview

MunaLuna uses Telegram to send notifications to users for various events:

1. **Prayer Times** - Notifications for each of the five daily prayers
2. **Settings Updates** - Confirmation when user settings are changed
3. **Tracker Updates** - Notifications when worship activities are recorded
4. **Daily Summaries** - End-of-day summary of all worship activities

## Technical Implementation

### Main Components

1. **better-notify.js** - Enhanced notification delivery system with fallbacks and retries
2. **notifications.ts** - Cron job scheduling and message formatting for different notification types
3. **telegram-webhook.js** - Handles Telegram webhook setup and message sending
4. **directNotify.ts** - Direct notification sender for testing

### Notification Flow

1. Event occurs (prayer time, settings update, etc.)
2. Appropriate function in `notifications.ts` is called
3. Message is formatted with HTML and emoji
4. `sendReliableNotification()` is called to deliver the message
5. Multiple delivery attempts and fallbacks are used if needed

## Testing Tools

Several testing tools are available to verify notification functionality:

1. **test_all_notifications.js** - Tests all notification types at once
2. **send_forced_prayer_notification.js** - Sends a prayer notification regardless of settings
3. **bot_diagnosis.js** - Comprehensive bot and webhook diagnostics
4. **notification_status_check.js** - Checks status of all notification components

## Usage Examples

### To send a test prayer notification:

```
node send_forced_prayer_notification.js 262371163 fajr
```

### To run a full notification system check:

```
node notification_status_check.js 262371163
```

### To test all notification types:

```
node test_all_notifications.js 262371163
```

## Common Issues and Solutions

1. **No notifications received**
   - Ensure user has started a conversation with the bot by sending `/start`
   - Verify bot token is valid using `node bot_diagnosis.js`
   - Check webhook URL is correctly set

2. **Only some notifications work**
   - Check user settings for which prayer notifications are enabled
   - Verify cron job scheduling in `notifications.ts`

3. **Message formatting issues**
   - HTML formatting may be broken - check for unclosed tags
   - Messages might be too long (Telegram has a 4096 character limit)

## Maintenance

Regular checks of the notification system can be scheduled using:

```
node notification_status_check.js
```

This can be automated to run daily or weekly to ensure the system continues to function properly.