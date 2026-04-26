import { pgTable, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: integer("id").primaryKey(),
  barbershopName: text("barbershop_name").notNull().default("Minha Barbearia"),
  dailyGoal: numeric("daily_goal", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("BRL"),
  workStartTime: text("work_start_time").notNull().default("09:00"),
  workEndTime: text("work_end_time").notNull().default("19:00"),
  workDays: integer("work_days").array().notNull().default([1, 2, 3, 4, 5, 6]),
  theme: text("theme").notNull().default("dark"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SettingsRow = typeof settingsTable.$inferSelect;
