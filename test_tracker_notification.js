/**
 * MunaLuna Tracker Notification Test
 *
 * This script simulates a user updating their tracker (checking a prayer)
 * and tests that notifications work properly in the Telegram Mini App environment.
 */

import fetch from 'node-fetch';

// Default Telegram ID
const TELEGRAM_ID = '262371163';
const USER_ID = 1;
const TODAY = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

async function testTrackerNotification() {
  console.log(`\n🌙 Testing Tracker Notification in Telegram Mini App 🌙`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Create worship data that simulates checking prayers in the tracker
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
    
    console.log(`Simulating tracker update with prayer data...`);
    
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
    
    const result = await worshipResponse.json();
    
    console.log(`Tracker update API response:`, result);
    
    if (worshipResponse.status === 200) {
      console.log(`\n✅ Tracker update successful. Check your Telegram app for notifications.`);
      console.log(`If you see a notification in Telegram, the fix worked!`);
    } else {
      console.log(`\n❌ Tracker update failed:`, result);
    }
  } catch (error) {
    console.error(`\n❌ Error in tracker notification test:`, error);
  }
}

// Run the test
testTrackerNotification();