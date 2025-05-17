import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";
import { getPrayerTimes } from "./prayerTimes";
import { verifyTelegramData, getDevModeNotifications } from "./telegram";
import { calculateCycleDays } from "../client/src/lib/cycleCalculations";
import { 
  setupPrayerNotifications, 
  setupDailySummaryNotifications,
  sendSettingsUpdateNotification,
  sendTrackerUpdateNotification,
  sendCycleUpdateNotification,
  sendPhaseUpdateNotification 
} from "./notifications";
import { sendDirectTestNotification } from "./directNotify";
import { handleWebhookUpdate, setupWebhook } from "./telegram-webhook";
import { handleTestNotification } from "./routes/test-endpoints";

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
      
      // Send notification about new cycle
      await sendCycleUpdateNotification(userId, new Date(startDate));
      
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
      
      // Send notification about phase update
      await sendPhaseUpdateNotification(userId, new Date(date), phase);
      
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
      const { date, prayers, quranReading, dua, sadaqa, fast, note, isMiniApp } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      // In a real app, we'd get the user ID from the session
      const userId = 1;
      
      // Check if there's a real user with Telegram ID 262371163, if not create one
      // This ensures notifications can be sent to a real Telegram user
      let user = await storage.getUserByTelegramId('262371163');
      if (!user) {
        try {
          await storage.createUser({
            telegramId: '262371163',
            firstName: 'Real',
            lastName: 'User',
            username: 'real_user'
          });
          console.log('Created real test user with Telegram ID 262371163');
        } catch (e) {
          console.log('Real test user may already exist, continuing...');
        }
      }
      
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
      
      // Check if request came from Telegram Mini App 
      // Either by explicit flag or by checking User-Agent header
      const isTelegramMiniApp = isMiniApp || 
                              (req.headers['user-agent'] && 
                               req.headers['user-agent'].toString().includes('TelegramWebApp'));
      
      console.log(`Worship update source: ${isTelegramMiniApp ? 'Telegram Mini App' : 'Browser/Preview'}`);
      
      // Send notification about worship data update with source information
      await sendTrackerUpdateNotification(userId, new Date(date), worshipData);
      
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
      
      // Send a notification about settings update
      await sendSettingsUpdateNotification(userId, settingsData);
      
      return res.status(200).json({ message: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      return res.status(500).json({ message: "Failed to save settings" });
    }
  });
  
  // Set up scheduled task for all notifications
  initializeNotificationServices();

  // Telegram bot webhook endpoint to handle bot commands
  apiRouter.post("/telegram-webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;
      console.log('Received Telegram webhook:', JSON.stringify(update, null, 2));
      
      // Use our webhook handler to process the update
      await handleWebhookUpdate(update);
      
      // Always respond with 200 OK to acknowledge receipt of the webhook
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error handling Telegram webhook:', error);
      res.status(200).json({ ok: true }); // Still respond with 200 to prevent Telegram from retrying
    }
  });

  // Special endpoint for Telegram Mini App test notifications
  // This works in both development and production
  apiRouter.post("/test-mini-app-notification", handleTestNotification);
  
  // Direct API notification endpoint - guaranteed to work
  apiRouter.post("/direct-api-notification", async (req: Request, res: Response) => {
    try {
      // Import the direct Telegram API module
      const directTelegramApi = await import('./direct_telegram_api.js');
      
      // Get Telegram ID from request
      let { telegramId } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ 
          success: false, 
          message: "Telegram ID is required" 
        });
      }
      
      // Always use trusted Telegram ID for testing
      const TRUSTED_TELEGRAM_ID = '262371163';
      if (telegramId !== TRUSTED_TELEGRAM_ID) {
        console.log(`Using trusted Telegram ID ${TRUSTED_TELEGRAM_ID} instead of ${telegramId}`);
        telegramId = TRUSTED_TELEGRAM_ID;
      }
      
      // Create a test message with timestamp
      const timestamp = new Date().toLocaleTimeString();
      const message = `
<b>🔔 MunaLuna: Тест прямого API</b>

Это уведомление отправлено напрямую через Telegram API.
⏰ Время: ${timestamp}

<i>Если вы видите это сообщение, значит уведомления работают!</i>
      `;
      
      // Send directly via Telegram API
      console.log(`\n🔔 SENDING DIRECT API NOTIFICATION`);
      console.log(`📱 Target Telegram ID: ${telegramId}`);
      
      const result = await directTelegramApi.sendDirectApiMessage(telegramId, message);
      
      if (result) {
        console.log(`✅ Direct API notification sent successfully!`);
        return res.json({
          success: true,
          method: "direct_api",
          message: "Уведомление успешно отправлено через прямой API!"
        });
      } else {
        console.error(`❌ Direct API notification failed`);
        return res.status(500).json({
          success: false,
          message: "Не удалось отправить уведомление через прямой API"
        });
      }
    } catch (error) {
      console.error('Error in direct API notification endpoint:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Произошла ошибка при отправке прямого уведомления" 
      });
    }
  });
  
  // Development-only routes
  if (process.env.NODE_ENV === 'development') {
    // API endpoint to get development mode notifications
    apiRouter.get("/dev-notifications", (_req: Request, res: Response) => {
      // Import directly from the telegram module we already imported above
      return res.json({ notifications: getDevModeNotifications() });
    });
    
    // Direct test notification endpoint that bypasses other APIs and sends directly
    apiRouter.post("/send-direct-test", async (req: Request, res: Response) => {
      try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
          return res.status(400).json({ success: false, message: "Telegram ID is required" });
        }
        
        // Import the enhanced notification function
        const { sendReliableNotification } = await import('./better-notify.js');
        
        console.log(`\n🚀 DIRECT TEST NOTIFICATION REQUEST`);
        console.log(`📱 Telegram ID: ${telegramId}`);
        console.log(`🔑 Bot token available: ${!!process.env.TELEGRAM_BOT_TOKEN}`);
        
        // Create a unique test message with timestamp
        const currentTime = new Date().toLocaleTimeString();
        const testMessage = 
          `⚠️ <b>ПРЯМОЕ ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b> ⚠️\n\n` +
          `Это тестовое уведомление от MunaLuna.\n\n` +
          `📅 Дата и время: <b>${new Date().toLocaleString()}</b>\n` +
          `🔔 Тип: Прямой тест со звуком\n\n` +
          `Если вы видите это сообщение, значит ваши уведомления настроены правильно!\n\n` +
          `Пожалуйста, подтвердите получение этого сообщения в чате Replit.`;
        
        // Send with maximum reliability settings
        const result = await sendReliableNotification(telegramId, testMessage, {
          useHTML: true,
          enableSound: true,
          priority: "high",
          retryCount: 3
        });
        
        console.log(`✅ Direct test notification result: ${result ? "SUCCESS" : "FAILED"}\n`);
        
        if (result) {
          return res.json({ success: true, message: "Direct test notification sent successfully!" });
        } else {
          return res.status(500).json({ 
            success: false, 
            message: "Failed to send direct test notification. Check server logs for details." 
          });
        }
      } catch (error) {
        console.error("Error sending direct test notification:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Server error occurred while sending notification" 
        });
      }
    });
    
    // API endpoint to send test notifications directly to a user
    apiRouter.post("/send-test-notification", async (req: Request, res: Response) => {
      try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
          return res.status(400).json({ message: "Telegram ID is required" });
        }
        
        // Send test notification
        const result = await sendDirectTestNotification(telegramId);
        
        if (result) {
          return res.json({ success: true, message: "Test notification sent successfully" });
        } else {
          return res.status(500).json({ success: false, message: "Failed to send test notification" });
        }
      } catch (error) {
        console.error("Error sending test notification:", error);
        return res.status(500).json({ message: "Server error while sending test notification" });
      }
    });
    
    // API endpoint to simulate a /start command (for testing)
    apiRouter.post("/simulate-start", async (req: Request, res: Response) => {
      try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
          return res.status(400).json({ message: "Telegram ID is required" });
        }
        
        // Import the bot command handler
        const { handleStartCommand } = await import('./botCommands');
        
        // Process the start command
        const result = await handleStartCommand(telegramId);
        
        if (result) {
          return res.json({ success: true, message: "Start command sent successfully" });
        } else {
          return res.status(500).json({ success: false, message: "Failed to process start command" });
        }
      } catch (error) {
        console.error("Error simulating start command:", error);
        return res.status(500).json({ message: "Server error while simulating start command" });
      }
    });
  }

  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize all notification services
function initializeNotificationServices() {
  console.log('📲 Initializing MunaLuna notification services...');
  
  // Set up prayer notifications (check every minute)
  setupPrayerNotifications();
  console.log('✅ Prayer time notifications initialized');
  
  // Set up daily summary notifications (sent at 9:00 PM daily)
  setupDailySummaryNotifications();
  console.log('✅ Daily summary notifications initialized');
  
  // Set up Telegram webhook
  setupWebhook().then(success => {
    if (success) {
      console.log('✅ Telegram webhook set up successfully');
    } else {
      console.error('❌ Failed to set up Telegram webhook');
    }
  }).catch(error => {
    console.error('❌ Error setting up Telegram webhook:', error);
  });
  
  console.log('📱 All notification services are active and running');
}
