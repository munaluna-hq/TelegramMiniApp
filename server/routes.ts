import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";
import { getPrayerTimes } from "./prayerTimes";
import { sendTelegramNotification, verifyTelegramData } from "./telegram";
import { calculateCycleDays } from "../client/src/lib/cycleCalculations";
import * as cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router
  const apiRouter = express.Router();
  
  // Authentication endpoint - validates Telegram data and registers/logs in the user
  apiRouter.post("/auth", async (req: Request, res: Response) => {
    try {
      const { telegramUser } = req.body;
      
      if (!telegramUser || !telegramUser.id) {
        return res.status(400).json({ message: "Invalid Telegram user data" });
      }
      
      // Verify Telegram data if initData is provided
      // In a real production app, you'd verify the Telegram WebApp data
      // with the bot token to ensure the request is authentic
      
      // Look for existing user
      let user = await storage.getUserByTelegramId(telegramUser.id.toString());
      
      // If user doesn't exist, create a new one
      if (!user) {
        user = await storage.createUser({
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || "",
          username: telegramUser.username || "",
        });
        
        // Create default settings for new user
        const settings = {
          userId: user.id,
          city: "",
          latitude: "",
          longitude: "",
          notificationTime: "exact" as const,
          notifyFajr: false,
          notifyZuhr: true,
          notifyAsr: true,
          notifyMaghrib: true,
          notifyIsha: true,
          menstruationDays: 5,
          cycleDays: 28
        };
        await storage.saveSettings(user.id, settings);
      }
      
      return res.status(200).json({ message: "Authentication successful", user });
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  });
  
  // Get user's cycle data
  apiRouter.get("/cycles", async (req: Request, res: Response) => {
    try {
      // In a real app, we'd get the user ID from the session
      // For this demo, we'll use a fixed user ID
      const userId = 1;
      
      const cycles = await storage.getCycles(userId);
      return res.json(cycles);
    } catch (error) {
      console.error("Error fetching cycles:", error);
      return res.status(500).json({ message: "Failed to fetch cycle data" });
    }
  });
  
  // Start a new cycle
  apiRouter.post("/cycles/start", async (req: Request, res: Response) => {
    try {
      const { startDate } = req.body;
      
      if (!startDate) {
        return res.status(400).json({ message: "Start date is required" });
      }
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      // Get user settings for menstruation and cycle duration
      const settings = await storage.getSettings(userId);
      const menstruationDays = settings?.menstruationDays || 5;
      const cycleDuration = settings?.cycleDays || 28;
      
      // Calculate cycle days
      const calculatedCycleDays = calculateCycleDays(new Date(startDate), menstruationDays, cycleDuration);
      
      // Convert to the right format for database storage
      const cycleDaysForDb = calculatedCycleDays.map(day => ({
        ...day,
        userId,
        date: new Date(day.date),
        ovulationDate: day.ovulationDate ? new Date(day.ovulationDate) : null
      }));
      
      // Save cycle days to database
      await storage.saveCycle(userId, cycleDaysForDb);
      
      return res.status(200).json({ message: "New cycle started successfully" });
    } catch (error) {
      console.error("Error starting new cycle:", error);
      return res.status(500).json({ message: "Failed to start new cycle" });
    }
  });
  
  // Update phase for a specific day
  apiRouter.post("/cycles/update-phase", async (req: Request, res: Response) => {
    try {
      const { date, phase } = req.body;
      
      if (!date || !phase) {
        return res.status(400).json({ message: "Date and phase are required" });
      }
      
      // Validate phase
      if (!["menstruation", "clean", "ovulation"].includes(phase)) {
        return res.status(400).json({ message: "Invalid phase" });
      }
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      // Update the phase for this date
      await storage.updatePhase(userId, new Date(date), phase);
      
      return res.status(200).json({ message: "Phase updated successfully" });
    } catch (error) {
      console.error("Error updating phase:", error);
      return res.status(500).json({ message: "Failed to update phase" });
    }
  });
  
  // Get prayer times for a specific date
  apiRouter.get("/prayer-times", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      // Get user's location from settings
      const settings = await storage.getSettings(userId);
      
      if (!settings || !settings.latitude || !settings.longitude) {
        return res.status(400).json({ message: "Location settings are not configured" });
      }
      
      // Get prayer times
      const prayerDate = date ? new Date(date as string) : new Date();
      const prayerTimes = await getPrayerTimes(
        parseFloat(settings.latitude),
        parseFloat(settings.longitude),
        prayerDate
      );
      
      return res.json(prayerTimes);
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      return res.status(500).json({ message: "Failed to fetch prayer times" });
    }
  });
  
  // Get user's worship data for a specific date
  apiRouter.get("/worship", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      const worshipData = await storage.getWorship(userId, new Date(date as string));
      return res.json(worshipData || {
        prayers: {},
        quranReading: 0,
        dua: false,
        sadaqa: false,
        fast: "none",
        note: ""
      });
    } catch (error) {
      console.error("Error fetching worship data:", error);
      return res.status(500).json({ message: "Failed to fetch worship data" });
    }
  });
  
  // Save user's worship data for a specific date
  apiRouter.post("/worship", async (req: Request, res: Response) => {
    try {
      const { date, prayers, quranReading, dua, sadaqa, fast, note } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      const worshipData = {
        userId,
        date: new Date(date),
        prayers,
        quranReading: quranReading || 0,
        dua: dua || false,
        sadaqa: sadaqa || false,
        fast: fast || "none",
        note: note || ""
      };
      
      await storage.saveWorship(userId, new Date(date), worshipData);
      
      return res.status(200).json({ message: "Worship data saved successfully" });
    } catch (error) {
      console.error("Error saving worship data:", error);
      return res.status(500).json({ message: "Failed to save worship data" });
    }
  });
  
  // Get user settings
  apiRouter.get("/settings", async (req: Request, res: Response) => {
    try {
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      const settings = await storage.getSettings(userId);
      return res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Save user settings
  apiRouter.post("/settings", async (req: Request, res: Response) => {
    try {
      const settingsSchema = z.object({
        city: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        notificationTime: z.enum(["exact", "5min", "10min"]),
        notifyFajr: z.boolean(),
        notifyZuhr: z.boolean(),
        notifyAsr: z.boolean(),
        notifyMaghrib: z.boolean(),
        notifyIsha: z.boolean(),
        menstruationDays: z.number().min(1).max(14),
        cycleDays: z.number().min(21).max(45)
      });
      
      const validatedSettings = settingsSchema.parse(req.body);
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      // Get current settings to check if they exist
      const currentSettings = await storage.getSettings(userId);
      
      const settingsData = {
        userId,
        city: validatedSettings.city || "",
        latitude: validatedSettings.latitude || "",
        longitude: validatedSettings.longitude || "",
        notificationTime: validatedSettings.notificationTime,
        notifyFajr: validatedSettings.notifyFajr,
        notifyZuhr: validatedSettings.notifyZuhr,
        notifyAsr: validatedSettings.notifyAsr,
        notifyMaghrib: validatedSettings.notifyMaghrib,
        notifyIsha: validatedSettings.notifyIsha,
        menstruationDays: validatedSettings.menstruationDays,
        cycleDays: validatedSettings.cycleDays
      };
      
      await storage.saveSettings(userId, settingsData);
      
      return res.status(200).json({ message: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      return res.status(500).json({ message: "Failed to save settings" });
    }
  });
  
  // Set up scheduled task for prayer notifications
  setupPrayerNotifications();

  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

// Setup scheduled task for prayer notifications
function setupPrayerNotifications() {
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
            await sendTelegramNotification(user.telegramId, message);
          }
        }
      }
    } catch (error) {
      console.error("Error in prayer notification scheduler:", error);
    }
  });
}
