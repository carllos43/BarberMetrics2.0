import { pgTable, uuid, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id"),
  serviceName: text("service_name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppointmentRow = typeof appointmentsTable.$inferSelect;
export type InsertAppointmentRow = typeof appointmentsTable.$inferInsert;
