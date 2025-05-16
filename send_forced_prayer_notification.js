/**
 * MunaLuna: Send Forced Prayer Notification
 * 
 * This script sends a forced prayer notification to a specific user
 * regardless of their settings. It's useful for testing or for
 * sending important notifications.
 * 
 * Usage: node send_forced_prayer_notification.js [telegram_id] [prayer_name]
 * Where prayer_name is one of: fajr, zuhr, asr, maghrib, isha
 * 
 * Default: sends a notification for a random prayer
 */

import { sendReliableNotification } from './server/better-notify.js';

// Target Telegram ID
const targetId = process.argv[2] || '262371163';

// Prayer name if specified
const prayerArg = process.argv[3]?.toLowerCase();

// Valid prayer names
const validPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

// Prayer name to Russian mapping
const prayerNames = {
  fajr: "Фаджр",
  zuhr: "Зухр",
  asr: "Аср",
  maghrib: "Магриб",
  isha: "Иша"
};

// Get current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Pick a random prayer if none specified
function getRandomPrayer() {
  return validPrayers[Math.floor(Math.random() * validPrayers.length)];
}

// Pick a random motivational message
function getRandomMessage() {
  const messages = [
    "Время для поклонения Аллаху",
    "Успех в обоих мирах начинается с намаза",
    "Намаз - ключ к Раю",
    "Самый любимый поступок для Аллаха - своевременный намаз",
    "Спешите к успеху через намаз",
    "Не упускай этот шанс приблизиться к Аллаху"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Send the prayer notification
async function sendForcedPrayerNotification() {
  try {
    // Determine which prayer to notify about
    const prayerKey = validPrayers.includes(prayerArg) ? prayerArg : getRandomPrayer();
    const prayerName = prayerNames[prayerKey];
    
    // Get current time
    const currentTime = getCurrentTime();
    
    // Get motivational message
    const motivationalMessage = getRandomMessage();
    
    // Construct the message
    const message = `🕌 ${prayerName} в ${currentTime}\n\n${motivationalMessage}`;
    
    console.log(`\n📤 Sending forced prayer notification (${prayerName}) to Telegram ID: ${targetId}`);
    
    // Send notification with sound
    const success = await sendReliableNotification(targetId, message, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 2
    });
    
    if (success) {
      console.log('✅ Prayer notification sent successfully!');
    } else {
      console.log('❌ Failed to send prayer notification.');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Run the function
sendForcedPrayerNotification();