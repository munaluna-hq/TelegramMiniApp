// Import notification functions and APIs
import { sendReliableNotification } from "./better-notify";
import * as directApi from "./direct_telegram_api.js"; // Direct API approach
import { storage } from "./storage";
import { getPrayerTimes } from "./prayerTimes";
import cron from "node-cron";
import { format, isToday } from "date-fns";
import { ru } from "date-fns/locale";

// Prayer notification service
export function setupPrayerNotifications() {
  // Run every minute to check for prayer times
  cron.schedule("* * * * *", async () => {
    try {
      // Get all users with notification settings
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        // Get user settings
        const settings = await storage.getSettings(user.id);
        if (!settings || !settings.latitude || !settings.longitude) continue;
        
        // Skip if all notifications are disabled
        if (!settings.notifyFajr && !settings.notifyZuhr && !settings.notifyAsr && 
            !settings.notifyMaghrib && !settings.notifyIsha) continue;
        
        // Get prayer times for today
        const today = new Date();
        const prayerTimes = await getPrayerTimes(
          parseFloat(settings.latitude),
          parseFloat(settings.longitude),
          today
        );
        
        // Check if current time matches any prayer time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Get user's cycle data to check if in menstruation phase
        const cycles = await storage.getCycles(user.id);
        const todayCycle = cycles.find(c => {
          const cycleDate = new Date(c.date);
          return cycleDate.getDate() === today.getDate() &&
                 cycleDate.getMonth() === today.getMonth() &&
                 cycleDate.getFullYear() === today.getFullYear();
        });
        
        // Skip notifications if user is in menstruation phase
        if (todayCycle && todayCycle.phase === "menstruation") continue;
        
        // Check each prayer time
        const prayers = [
          { name: "fajr", enabled: settings.notifyFajr, time: prayerTimes.fajr },
          { name: "zuhr", enabled: settings.notifyZuhr, time: prayerTimes.zuhr },
          { name: "asr", enabled: settings.notifyAsr, time: prayerTimes.asr },
          { name: "maghrib", enabled: settings.notifyMaghrib, time: prayerTimes.maghrib },
          { name: "isha", enabled: settings.notifyIsha, time: prayerTimes.isha },
        ];
        
        for (const prayer of prayers) {
          if (!prayer.enabled || !prayer.time) continue;
          
          // Parse prayer time
          const [prayerHour, prayerMinute] = prayer.time.split(":").map(Number);
          
          // Adjust for notification time setting
          let notificationTime: Date;
          if (settings.notificationTime === "5min") {
            notificationTime = new Date(today);
            notificationTime.setHours(prayerHour, prayerMinute - 5);
          } else if (settings.notificationTime === "10min") {
            notificationTime = new Date(today);
            notificationTime.setHours(prayerHour, prayerMinute - 10);
          } else {
            notificationTime = new Date(today);
            notificationTime.setHours(prayerHour, prayerMinute);
          }
          
          // Check if current time matches notification time
          if (currentHour === notificationTime.getHours() && 
              currentMinute === notificationTime.getMinutes()) {
            
            // Get prayer name in Russian
            const prayerNames: Record<string, string> = {
              fajr: "Фаджр",
              zuhr: "Зухр",
              asr: "Аср",
              maghrib: "Магриб",
              isha: "Иша"
            };
            
            // Pick a random motivational message
            const messages = [
              "Время для поклонения Аллаху",
              "Успех в обоих мирах начинается с намаза",
              "Намаз - ключ к Раю",
              "Самый любимый поступок для Аллаха - своевременный намаз"
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            // Send notification
            const message = `🕌 ${prayerNames[prayer.name]} в ${prayer.time}\n\n${randomMessage}`;
            
            // First try direct API approach (most reliable)
            try {
              console.log(`Attempting prayer notification via direct API for ${prayer.name}...`);
              const directResult = await directApi.sendImportantNotification(user.telegramId, message);
              
              if (directResult) {
                console.log(`✅ Prayer notification for ${prayer.name} successfully sent via direct API to ${user.telegramId}`);
                continue; // Move to next prayer if successful
              }
            } catch (directError) {
              console.error(`Error sending prayer notification via direct API:`, directError);
            }
            
            // Fallback to reliable notification
            console.log(`Falling back to reliable notification for prayer ${prayer.name}...`);
            await sendReliableNotification(user.telegramId, message, {
              useHTML: true,
              enableSound: true,
              priority: "high",
              retryCount: 3
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in prayer notification scheduler:", error);
    }
  });
}

// Daily tracker report notification
export function setupDailySummaryNotifications() {
  // Run every day at 9:00 PM
  cron.schedule("0 21 * * *", async () => {
    try {
      // Get all users
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        const today = new Date();
        const formattedDate = format(today, "yyyy-MM-dd");
        
        // Get today's worship data
        const worship = await storage.getWorship(user.id, today);
        if (!worship) continue; // Skip if no worship data for today
        
        // Create a summary message
        let message = `📊 <b>Сводка за ${format(today, "d MMMM", { locale: ru })}</b>\n\n`;
        
        // Prayer summary
        const prayers = worship.prayers || {};
        const prayerCount = Object.values(prayers).filter(Boolean).length;
        const totalPrayers = 5;
        
        message += `🕌 <b>Намазы:</b> ${prayerCount}/${totalPrayers}\n`;
        
        // Other worship activities
        if (worship.quranReading > 0) {
          message += `📖 <b>Коран:</b> ${worship.quranReading} минут\n`;
        }
        
        if (worship.dua) {
          message += `🤲 <b>Ду'а:</b> ✅\n`;
        }
        
        if (worship.sadaqa) {
          message += `💰 <b>Садака:</b> ✅\n`;
        }
        
        if (worship.fast && worship.fast !== "none") {
          const fastTypes = {
            fard: "обязательный",
            nafl: "нафиля",
            kada: "када"
          };
          message += `🍽️ <b>Пост:</b> ${fastTypes[worship.fast as keyof typeof fastTypes]}\n`;
        }
        
        // Add note if available
        if (worship.note && worship.note.trim()) {
          message += `\n📝 <b>Заметка:</b> ${worship.note}\n`;
        }
        
        // Add motivational message
        message += "\nМашаАллах! Продолжай стараться и завтра, ин ша Аллах 💜";
        
        // Send notification - First try direct API approach (most reliable)
        try {
          console.log(`Attempting daily summary notification via direct API...`);
          const directResult = await directApi.sendDirectApiMessage(user.telegramId, message);
          
          if (directResult) {
            console.log(`✅ Daily summary notification successfully sent via direct API to ${user.telegramId}`);
            continue; // Move to next user if successful
          }
        } catch (directError) {
          console.error(`Error sending daily summary via direct API:`, directError);
        }
        
        // Fallback to reliable notification
        console.log(`Falling back to reliable notification for daily summary...`);
        await sendReliableNotification(user.telegramId, message, {
          useHTML: true,
          enableSound: true,
          priority: "normal",
          retryCount: 3
        });
      }
    } catch (error) {
      console.error("Error in daily summary notification:", error);
    }
  });
}

// Settings update notification
export async function sendSettingsUpdateNotification(userId: number, settings: any) {
  try {
    // In development environment, always send to our test Telegram ID
    let telegramId = '262371163';
    
    if (process.env.NODE_ENV !== 'development') {
      // In production, find the actual user
      const user = await storage.getUser(userId);
      if (!user || !user.telegramId) {
        console.log("Cannot find valid user for settings notification, skipping");
        return;
      }
      telegramId = user.telegramId;
    } else {
      console.log("Development mode: Forcing settings notification to real test ID:", telegramId);
    }
    
    let message = "⚙️ <b>Настройки обновлены</b>\n\n";
    
    if (settings.city) {
      message += `📍 <b>Город:</b> ${settings.city}\n`;
    }
    
    // Prayer notification settings
    const prayers = [];
    if (settings.notifyFajr) prayers.push("Фаджр");
    if (settings.notifyZuhr) prayers.push("Зухр");
    if (settings.notifyAsr) prayers.push("Аср");
    if (settings.notifyMaghrib) prayers.push("Магриб");
    if (settings.notifyIsha) prayers.push("Иша");
    
    if (prayers.length > 0) {
      message += `🔔 <b>Уведомления о намазах:</b> ${prayers.join(", ")}\n`;
      
      // Notification timing
      const timingMap = {
        exact: "точно в назначенное время",
        "5min": "за 5 минут до намаза",
        "10min": "за 10 минут до намаза"
      };
      message += `⏱️ <b>Время уведомлений:</b> ${timingMap[settings.notificationTime as keyof typeof timingMap]}\n`;
    } else {
      message += "🔕 <b>Уведомления о намазах отключены</b>\n";
    }
    
    // Cycle settings
    if (settings.menstruationDays) {
      message += `🔴 <b>Дней менструации:</b> ${settings.menstruationDays}\n`;
    }
    
    if (settings.cycleDays) {
      message += `🔄 <b>Дней цикла:</b> ${settings.cycleDays}\n`;
    }
    
    message += "\nНастройки успешно сохранены и применены ✅";
    
    // Send notification
    console.log(`Sending settings notification to Telegram ID: ${telegramId}`);
    
    // First try direct API approach (most reliable)
    try {
      console.log(`Attempting settings notification via direct API...`);
      const directResult = await directApi.sendDirectApiMessage(telegramId, message);
      
      if (directResult) {
        console.log(`✅ Settings notification successfully sent via direct API to ${telegramId}`);
        return; // Exit if successful
      }
    } catch (directError) {
      console.error(`Error sending settings notification via direct API:`, directError);
    }
    
    // Fallback to reliable notification system
    console.log(`Falling back to reliable notification system for settings...`);
    await sendReliableNotification(telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 3
    });
  } catch (error) {
    console.error("Error sending settings update notification:", error);
  }
}

// Tracker update notification
export async function sendTrackerUpdateNotification(userId: number, date: Date, worship: any) {
  try {
    // In development environment, always send to our test Telegram ID
    let telegramId = '262371163';
    
    if (process.env.NODE_ENV !== 'development') {
      // In production, find the actual user
      const user = await storage.getUser(userId);
      if (!user || !user.telegramId) {
        console.log("Cannot find valid user for notification, skipping");
        return;
      }
      telegramId = user.telegramId;
    } else {
      console.log("Development mode: Forcing notification to real test ID:", telegramId);
    }
    
    const formattedDate = format(date, "d MMMM", { locale: ru });
    
    // Create message
    let message = `📝 <b>Трекер обновлен (${formattedDate})</b>\n\n`;
    
    // Prayer counts
    const prayers = worship.prayers || {};
    const prayerCount = Object.values(prayers).filter(Boolean).length;
    message += `🕌 <b>Намазы:</b> ${prayerCount}/5\n`;
    
    // Other worship activities
    if (worship.quranReading > 0) {
      message += `📖 <b>Коран:</b> ${worship.quranReading} минут\n`;
    }
    
    if (worship.dua) {
      message += `🤲 <b>Ду'а:</b> ✅\n`;
    }
    
    if (worship.sadaqa) {
      message += `💰 <b>Садака:</b> ✅\n`;
    }
    
    if (worship.fast && worship.fast !== "none") {
      const fastTypes = {
        fard: "обязательный",
        nafl: "нафиля",
        kada: "када"
      };
      message += `🍽️ <b>Пост:</b> ${fastTypes[worship.fast as keyof typeof fastTypes]}\n`;
    }
    
    // Add motivational message
    message += "\nМашаАллах! Продолжай в том же духе 💯";
    
    // Send notification using the telegramId we found
    console.log(`Sending tracker notification to Telegram ID: ${telegramId}`);
    
    // First try our direct API approach (most reliable)
    try {
      console.log(`Attempting direct API notification first...`);
      const directResult = await directApi.sendDirectApiMessage(telegramId, message);
      
      if (directResult) {
        console.log(`✅ Tracker notification successfully sent using direct API to ${telegramId}`);
        return; // Exit if successful
      }
    } catch (directError) {
      console.error(`Error with direct API notification:`, directError);
    }
    
    // Fallback to reliable notification approach
    console.log(`Falling back to reliable notification approach...`);
    await sendReliableNotification(telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 3
    });
  } catch (error) {
    console.error("Error sending tracker update notification:", error);
  }
}

// Cycle Update Notification
export async function sendCycleUpdateNotification(userId: number, startDate: Date) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return;
    
    const formattedDate = format(startDate, "d MMMM", { locale: ru });
    
    // Create message
    let message = `🔄 <b>Новый цикл начат</b>\n\n`;
    message += `📅 <b>Дата начала:</b> ${formattedDate}\n`;
    
    // Get user settings for cycle length
    const settings = await storage.getSettings(user.id);
    if (settings) {
      const menstruationDays = settings.menstruationDays || 5;
      const cycleDays = settings.cycleDays || 28;
      
      // Calculate phases
      const menstruationEndDate = new Date(startDate);
      menstruationEndDate.setDate(menstruationEndDate.getDate() + menstruationDays - 1);
      
      const formattedEndDate = format(menstruationEndDate, "d MMMM", { locale: ru });
      
      message += `🔴 <b>Фаза менструации:</b> ${formattedDate} - ${formattedEndDate}\n`;
      message += `⭕ <b>Длительность цикла:</b> ${cycleDays} дней\n`;
    }
    
    message += "\nДанные цикла успешно обновлены ✅";
    
    // Send notification using direct API first (most reliable)
    try {
      console.log(`Attempting cycle update notification via direct API...`);
      const directResult = await directApi.sendDirectApiMessage(user.telegramId, message);
      
      if (directResult) {
        console.log(`✅ Cycle update notification successfully sent via direct API to ${user.telegramId}`);
        return; // Exit if successful
      }
    } catch (directError) {
      console.error(`Error sending cycle update via direct API:`, directError);
    }
    
    // Fallback to reliable notification
    console.log(`Falling back to reliable notification for cycle update...`);
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 3
    });
  } catch (error) {
    console.error("Error sending cycle update notification:", error);
  }
}

// Phase update notification
export async function sendPhaseUpdateNotification(userId: number, date: Date, phase: string) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return;
    
    const formattedDate = format(date, "d MMMM", { locale: ru });
    
    // Get phase name in Russian
    const phaseNames: Record<string, string> = {
      "menstruation": "менструация",
      "ovulation": "овуляция",
      "clean": "чистый период"
    };
    
    const phaseName = phaseNames[phase] || phase;
    
    // Create message
    let message = `🔄 <b>Фаза цикла обновлена</b>\n\n`;
    message += `📅 <b>Дата:</b> ${formattedDate}\n`;
    message += `⭕ <b>Фаза:</b> ${phaseName}\n`;
    
    message += "\nДанные цикла успешно обновлены ✅";
    
    // Send notification using direct API first (most reliable)
    try {
      console.log(`Attempting phase update notification via direct API...`);
      const directResult = await directApi.sendDirectApiMessage(user.telegramId, message);
      
      if (directResult) {
        console.log(`✅ Phase update notification successfully sent via direct API to ${user.telegramId}`);
        return; // Exit if successful
      }
    } catch (directError) {
      console.error(`Error sending phase update via direct API:`, directError);
    }
    
    // Fallback to reliable notification
    console.log(`Falling back to reliable notification for phase update...`);
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 3
    });
  } catch (error) {
    console.error("Error sending phase update notification:", error);
  }
}