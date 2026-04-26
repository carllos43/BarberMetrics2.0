import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { serializeSettings } from "../lib/serializers";

const router: IRouter = Router();

const SETTINGS_ID = 1;

async function loadOrCreate() {
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, SETTINGS_ID));
  if (existing[0]) return existing[0];
  const [row] = await db
    .insert(settingsTable)
    .values({ id: SETTINGS_ID })
    .returning();
  if (!row) throw new Error("Failed to bootstrap settings");
  return row;
}

router.get("/settings", async (_req, res) => {
  const row = await loadOrCreate();
  res.json(serializeSettings(row));
});

router.patch("/settings", async (req, res) => {
  const body = UpdateSettingsBody.parse(req.body);
  await loadOrCreate();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.barbershopName !== undefined) update.barbershopName = body.barbershopName;
  if (body.dailyGoal !== undefined) update.dailyGoal = body.dailyGoal.toString();
  if (body.currency !== undefined) update.currency = body.currency;
  if (body.workStartTime !== undefined) update.workStartTime = body.workStartTime;
  if (body.workEndTime !== undefined) update.workEndTime = body.workEndTime;
  if (body.workDays !== undefined) update.workDays = body.workDays;
  if (body.theme !== undefined) update.theme = body.theme;

  const [row] = await db
    .update(settingsTable)
    .set(update)
    .where(eq(settingsTable.id, SETTINGS_ID))
    .returning();
  if (!row) {
    res.status(500).json({ error: "Update failed" });
    return;
  }
  res.json(serializeSettings(row));
});

export default router;
