// Import the improved notification function instead of the old one
import { sendReliableNotification } from "./better-notify";
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
            await sendReliableNotification(user.telegramId, message, {
              useHTML: true,
              enableSound: true,
              priority: "high",
              retryCount: 2
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
        
        // Send notification
        await sendReliableNotification(user.telegramId, message, {
          useHTML: true,
          enableSound: true,
          priority: "normal",
          retryCount: 2
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
    const user = await storage.getUser(userId);
    if (!user) return;
    
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
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
    });
  } catch (error) {
    console.error("Error sending settings update notification:", error);
  }
}

// Tracker update notification
export async function sendTrackerUpdateNotification(userId: number, date: Date, worship: any) {
  try {
    // Try to find the user by ID first
    const user = await storage.getUser(userId);
    
    // If no user found or user has no telegramId, use the real test user
    let telegramId = user?.telegramId;
    if (!telegramId) {
      // Get the real test user we created (or find one with the specific telegramId)
      const realUser = await storage.getUserByTelegramId('262371163');
      if (realUser) {
        telegramId = realUser.telegramId;
        console.log("Using backup real user for notification:", telegramId);
      } else {
        console.log("Cannot find any real user for notification, skipping");
        return;
      }
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
    
    // Send notification
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
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
    
    // Send notification
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
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
    
    // Send notification
    await sendReliableNotification(user.telegramId, message, {
      useHTML: true,
      enableSound: true,
      priority: "normal",
      retryCount: 2
    });
  } catch (error) {
    console.error("Error sending phase update notification:", error);
  }
}