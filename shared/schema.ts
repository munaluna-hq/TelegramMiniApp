import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  firstName: true,
  lastName: true,
  username: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Cycle days table
export const cycleDays = pgTable("cycle_days", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  phase: text("phase").notNull(), // menstruation, clean, ovulation
  cycleDuration: integer("cycle_duration"),
  menstruationDuration: integer("menstruation_duration"),
  ovulationDate: timestamp("ovulation_date"),
});

export const insertCycleDaySchema = createInsertSchema(cycleDays).pick({
  userId: true,
  date: true,
  phase: true,
  cycleDuration: true,
  menstruationDuration: true,
  ovulationDate: true,
});

export type InsertCycleDay = z.infer<typeof insertCycleDaySchema>;
export type CycleDay = typeof cycleDays.$inferSelect;

// Worship tracking table
export const worshipEntries = pgTable("worship_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  prayers: json("prayers").notNull(), // { fajr: true, zuhr: false, ... }
  quranReading: integer("quran_reading").notNull(), // in minutes
  dua: boolean("dua").notNull(),
  sadaqa: boolean("sadaqa").notNull(),
  fast: text("fast").notNull(), // none, fard, nafl, kada
  note: text("note"),
});

export const insertWorshipSchema = createInsertSchema(worshipEntries).pick({
  userId: true,
  date: true,
  prayers: true,
  quranReading: true,
  dua: true,
  sadaqa: true,
  fast: true,
  note: true,
});

export type InsertWorship = z.infer<typeof insertWorshipSchema>;
export type Worship = typeof worshipEntries.$inferSelect;

// Settings table
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  cityId: integer("city_id"),  // ID of selected city from Muftyat.kz API
  cityName: text("city_name"), // Name of the city for display
  city: text("city"),          // Legacy field kept for backward compatibility
  latitude: text("latitude"),  // Legacy field kept for backward compatibility
  longitude: text("longitude"),// Legacy field kept for backward compatibility
  notificationTime: text("notification_time").notNull(), // exact, 5min, 10min
  notifyFajr: boolean("notify_fajr").notNull(),
  notifyZuhr: boolean("notify_zuhr").notNull(),
  notifyAsr: boolean("notify_asr").notNull(),
  notifyMaghrib: boolean("notify_maghrib").notNull(),
  notifyIsha: boolean("notify_isha").notNull(),
  menstruationDays: integer("menstruation_days").notNull(),
  cycleDays: integer("cycle_days").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).pick({
  userId: true,
  cityId: true,
  cityName: true,
  city: true,
  latitude: true,
  longitude: true,
  notificationTime: true,
  notifyFajr: true,
  notifyZuhr: true,
  notifyAsr: true,
  notifyMaghrib: true,
  notifyIsha: true,
  menstruationDays: true,
  cycleDays: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
