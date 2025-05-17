/**
 * MunaLuna: Test All Notification Types
 * 
 * This script tests all types of notifications the app can send.
 * It will:
 * 1. Send a tracker update notification
 * 2. Send a settings update notification
 * 3. Send a prayer time notification
 * 4. Send a cycle update notification
 * 
 * Usage: node test_all_notification_types.js
 */

import * as miniAppNotify from './server/mini_app_notification.js';
import fetch from 'node-fetch';

// Default Telegram ID for testing
const TELEGRAM_ID = '262371163';
const USER_ID = 1;
const TODAY = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

async function testAllNotificationTypes() {
  console.log(`\n🌙 Testing All MunaLuna Notification Types 🌙`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // 1. Test Tracker Update Notification
    console.log(`\n1️⃣ Testing Tracker Update Notification\n`);
    
    // Create worship data
    const worshipData = {
      date: TODAY,
      prayers: {
        fajr: true,
        zuhr: true,
        asr: true,
        maghrib: true,
        isha: true
      },
      quranReading: 20,
      dua: true,
      sadaqa: true,
      fast: "nafl",
      note: "Тестирование уведомлений трекера из Mini App"
    };
    
    console.log(`Sending tracker update...`);
    
    // Send worship data to the API
    const worshipResponse = await fetch('http://localhost:5000/api/worship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramWebApp/MunaLuna' // Simulate Telegram Mini App environment
      },
      body: JSON.stringify({
        date: TODAY,
        userId: USER_ID,
        worship: worshipData,
        isMiniApp: true // Signal that this is coming from Mini App
      })
    });
    
    const trackerResult = await worshipResponse.json();
    console.log(`Tracker update result:`, trackerResult);
    
    // Wait 2 seconds before next notification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Test Settings Update Notification
    console.log(`\n2️⃣ Testing Settings Update Notification\n`);
    
    // Create settings data matching the schema requirements
    const settingsData = {
      city: "Москва",
      latitude: "55.7558",
      longitude: "37.6173",
      notificationTime: "exact",
      notifyFajr: true,
      notifyZuhr: true,
      notifyAsr: true,
      notifyMaghrib: true,
      notifyIsha: true,
      menstruationDays: 5,
      cycleDays: 28
    };
    
    console.log(`Sending settings update...`);
    
    // Send settings data to the API
    const settingsResponse = await fetch('http://localhost:5000/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramWebApp/MunaLuna' // Simulate Telegram Mini App environment
      },
      body: JSON.stringify(settingsData) // Send the settings data directly, not wrapped
    });
    
    const settingsResult = await settingsResponse.json();
    console.log(`Settings update result:`, settingsResult);
    
    // Wait 2 seconds before next notification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Test Direct Mini App Notification
    console.log(`\n3️⃣ Testing Direct Mini App Notification\n`);
    
    const prayerMessage = `
📝 <b>Время намаза</b>

Напоминание о намазе Аср.

⏰ Текущее время: ${new Date().toLocaleTimeString()}
🕌 Аср: ${new Date().toLocaleTimeString()}

Да примет Аллах ваш намаз!
`;
    
    console.log(`Sending direct Mini App notification...`);
    const miniAppResult = await miniAppNotify.sendMiniAppNotification(TELEGRAM_ID, prayerMessage);
    
    if (miniAppResult) {
      console.log(`Mini App notification sent successfully.`);
    } else {
      console.log(`Failed to send Mini App notification.`);
    }
    
    console.log(`\n✅ All notification tests complete!`);
    console.log(`Check your Telegram app to see if all notifications were received.`);
    
  } catch (error) {
    console.error(`\n❌ Error testing notifications:`, error);
  }
}

// Run the tests
testAllNotificationTypes();