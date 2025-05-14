import { users, cycleDays, worshipEntries, settingsTable, type User, type InsertUser, type CycleDay, type Worship, type Settings } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { IStorage } from "./storage";
import { format } from "date-fns";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(userData: { telegramId: string, firstName: string, lastName?: string, username?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      telegramId: userData.telegramId,
      firstName: userData.firstName,
      lastName: userData.lastName || "",
      username: userData.username || ""
    }).returning();
    
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Cycle management
  async getCycles(userId: number): Promise<CycleDay[]> {
    return await db.select().from(cycleDays).where(eq(cycleDays.userId, userId));
  }
  
  async saveCycle(userId: number, cycleData: any[]): Promise<void> {
    // First, delete existing cycle data for this user
    await db.delete(cycleDays).where(eq(cycleDays.userId, userId));
    
    // Then insert new cycle data
    if (cycleData.length > 0) {
      const cyclesToInsert = cycleData.map(cycle => ({
        userId,
        date: new Date(cycle.date),
        phase: cycle.phase,
        cycleDuration: cycle.cycleDuration || null,
        menstruationDuration: cycle.menstruationDuration || null,
        ovulationDate: cycle.ovulationDate ? new Date(cycle.ovulationDate) : null
      }));
      
      await db.insert(cycleDays).values(cyclesToInsert);
    }
  }
  
  async updatePhase(userId: number, date: Date, phase: string): Promise<void> {
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Check if there's an existing entry for this date
    const [existingDay] = await db.select()
      .from(cycleDays)
      .where(
        and(
          eq(cycleDays.userId, userId),
          eq(cycleDays.date, new Date(formattedDate))
        )
      );
    
    if (existingDay) {
      // Update existing entry
      await db.update(cycleDays)
        .set({ phase })
        .where(
          and(
            eq(cycleDays.userId, userId),
            eq(cycleDays.date, new Date(formattedDate))
          )
        );
    } else {
      // Insert new entry
      await db.insert(cycleDays).values({
        userId,
        date: new Date(formattedDate),
        phase
      });
    }
  }
  
  // Worship tracking
  async getWorship(userId: number, date: Date): Promise<Worship | undefined> {
    const formattedDate = format(date, "yyyy-MM-dd");
    
    const [worship] = await db.select()
      .from(worshipEntries)
      .where(
        and(
          eq(worshipEntries.userId, userId),
          eq(worshipEntries.date, new Date(formattedDate))
        )
      );
    
    return worship;
  }
  
  async saveWorship(userId: number, date: Date, worship: any): Promise<void> {
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Check if there's an existing entry for this date
    const [existingWorship] = await db.select()
      .from(worshipEntries)
      .where(
        and(
          eq(worshipEntries.userId, userId),
          eq(worshipEntries.date, new Date(formattedDate))
        )
      );
    
    if (existingWorship) {
      // Update existing entry
      await db.update(worshipEntries)
        .set({
          prayers: worship.prayers,
          quranReading: worship.quranReading,
          dua: worship.dua,
          sadaqa: worship.sadaqa,
          fast: worship.fast,
          note: worship.note || ""
        })
        .where(
          and(
            eq(worshipEntries.userId, userId),
            eq(worshipEntries.date, new Date(formattedDate))
          )
        );
    } else {
      // Insert new entry
      await db.insert(worshipEntries).values({
        userId,
        date: new Date(formattedDate),
        prayers: worship.prayers,
        quranReading: worship.quranReading,
        dua: worship.dua,
        sadaqa: worship.sadaqa,
        fast: worship.fast,
        note: worship.note || ""
      });
    }
  }
  
  // Settings
  async getSettings(userId: number): Promise<Settings | undefined> {
    const [settings] = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId));
    
    return settings;
  }
  
  async saveSettings(userId: number, settings: any): Promise<void> {
    // Check if there are existing settings for this user
    const [existingSettings] = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId));
    
    if (existingSettings) {
      // Update existing settings
      await db.update(settingsTable)
        .set({
          city: settings.city || "",
          latitude: settings.latitude || "",
          longitude: settings.longitude || "",
          notificationTime: settings.notificationTime,
          notifyFajr: settings.notifyFajr,
          notifyZuhr: settings.notifyZuhr,
          notifyAsr: settings.notifyAsr,
          notifyMaghrib: settings.notifyMaghrib,
          notifyIsha: settings.notifyIsha,
          menstruationDays: settings.menstruationDays,
          cycleDays: settings.cycleDays
        })
        .where(eq(settingsTable.userId, userId));
    } else {
      // Insert new settings
      await db.insert(settingsTable).values({
        userId,
        city: settings.city || "",
        latitude: settings.latitude || "",
        longitude: settings.longitude || "",
        notificationTime: settings.notificationTime,
        notifyFajr: settings.notifyFajr,
        notifyZuhr: settings.notifyZuhr,
        notifyAsr: settings.notifyAsr,
        notifyMaghrib: settings.notifyMaghrib,
        notifyIsha: settings.notifyIsha,
        menstruationDays: settings.menstruationDays,
        cycleDays: settings.cycleDays
      });
    }
  }
}