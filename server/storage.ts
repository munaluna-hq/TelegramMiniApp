import { users, type User, type InsertUser, CycleDay, Settings, Worship } from "@shared/schema";
import { format } from "date-fns";
import { DatabaseStorage } from "./dbStorage";

// Interface for all storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: { telegramId: string, firstName: string, lastName?: string, username?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Cycle management
  getCycles(userId: number): Promise<CycleDay[]>;
  saveCycle(userId: number, cycleDays: any[]): Promise<void>;
  updatePhase(userId: number, date: Date, phase: string): Promise<void>;
  
  // Worship tracking
  getWorship(userId: number, date: Date): Promise<Worship | undefined>;
  saveWorship(userId: number, date: Date, worship: any): Promise<void>;
  
  // Settings
  getSettings(userId: number): Promise<Settings | undefined>;
  saveSettings(userId: number, settings: any): Promise<void>;
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();
