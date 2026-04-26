import { pgTable, uuid, text, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";

export const servicesTable = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ServiceRow = typeof servicesTable.$inferSelect;
export type InsertServiceRow = typeof servicesTable.$inferInsert;
