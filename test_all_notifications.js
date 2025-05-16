/**
 * MunaLuna: Test All Notification Types
 * 
 * This script tests all types of notifications the app can send.
 * It will:
 * 1. Send a prayer time notification
 * 2. Send a settings update notification
 * 3. Send a tracker update notification
 * 4. Send a daily summary notification
 * 
 * Usage: node test_all_notifications.js [telegram_id]
 * Default Telegram ID: 262371163
 */

import { sendReliableNotification } from './server/better-notify.js';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Target Telegram ID
const targetId = process.argv[2] || '262371163';

// Test all notification types
async function testAllNotificationTypes() {
  console.log(`\n🔔 Testing all notification types for Telegram ID: ${targetId}\n`);
  
  // Get current date formatted in Russian
  const today = new Date();
  const formattedDate = format(today, "d MMMM", { locale: ru });
  
  try {
    // 1. Prayer time notification
    console.log('📩 Testing prayer time notification...');
    const prayers = ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'];
    const randomPrayer = prayers[Math.floor(Math.random() * prayers.length)];
    const prayerTime = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    
    const prayerMessage = `🕌 ${randomPrayer} в ${prayerTime}\n\nВремя для поклонения Аллаху. Намаз - ключ к Раю.`;
    
    await sendReliableNotification(targetId, prayerMessage, {
      useHTML: true,
      enableSound: true,
      priority: "high",
      retryCount: 2
    });
    
    console.log('✅ Prayer notification sent!\n');
    
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 2. Settings update notification
    console.log('📩 Testing settings update notification...');
    
    const settingsMessage = `⚙️ <b>Настройки обновлены</b>\n\n` +
      `📍 <b>Город:</b> Алматы\n` +
      `🔔 <b>Уведомления о намазах:</b> Фаджр, Зухр, Аср, Магриб, Иша\n` +
      `⏱️ <b>Время уведомлений:</b> точно в назначенное время\n` +
      `🔴 <b>Дней менструации:</b> 7\n` +
      `🔄 <b>Дней цикла:</b> 28\n` +
      `Настройки успешно сохранены и применены ✅`;
    
    await sendReliableNotification(targetId, settingsMessage, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
    });
    
    console.log('✅ Settings notification sent!\n');
    
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Tracker update notification
    console.log('📩 Testing tracker update notification...');
    
    const trackerMessage = `📝 <b>Трекер обновлен (${formattedDate})</b>\n` +
      `🕌 <b>Намазы:</b> 4/5\n` +
      `📖 <b>Коран:</b> 15 минут\n` +
      `🤲 <b>Ду'а:</b> ✅\n` +
      `💰 <b>Садака:</b> ✅\n` +
      `🍽️ <b>Пост:</b> нафиля\n` +
      `МашаАллах! Продолжай в том же духе 💯`;
    
    await sendReliableNotification(targetId, trackerMessage, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
    });
    
    console.log('✅ Tracker notification sent!\n');
    
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 4. Daily summary notification
    console.log('📩 Testing daily summary notification...');
    
    const summaryMessage = `📊 <b>Сводка за ${formattedDate}</b>\n\n` +
      `🕌 <b>Намазы:</b> 4/5\n` +
      `📖 <b>Коран:</b> 20 минут\n` +
      `🤲 <b>Ду'а:</b> ✅\n` +
      `💰 <b>Садака:</b> ✅\n` +
      `🍽️ <b>Пост:</b> нафиля\n\n` +
      `МашаАллах! Продолжай стараться и завтра, ин ша Аллах 💜`;
    
    await sendReliableNotification(targetId, summaryMessage, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
    });
    
    console.log('✅ Daily summary notification sent!\n');
    
    console.log('✨ All notifications sent successfully!');
    console.log('Please check your Telegram app for the messages.\n');
    
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }
}

// Run the test
testAllNotificationTypes();