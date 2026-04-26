import { Router, type IRouter } from "express";
import { db, servicesTable } from "@workspace/db";
import { CreateServiceBody, UpdateServiceBody, UpdateServiceParams, DeleteServiceParams } from "@workspace/api-zod";
import { and, desc, eq } from "drizzle-orm";
import { serializeService } from "../lib/serializers";

const router: IRouter = Router();

router.get("/services", async (_req, res) => {
  const rows = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.isActive, true))
    .orderBy(desc(servicesTable.createdAt));
  res.json(rows.map(serializeService));
});

router.post("/services", async (req, res) => {
  const body = CreateServiceBody.parse(req.body);
  const [row] = await db
    .insert(servicesTable)
    .values({
      name: body.name,
      price: body.price.toString(),
      durationMinutes: body.durationMinutes ?? null,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Failed to create" });
    return;
  }
  res.status(201).json(serializeService(row));
});

router.patch("/services/:id", async (req, res) => {
  const params = UpdateServiceParams.parse(req.params);
  const body = UpdateServiceBody.parse(req.body);
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.price !== undefined) update.price = body.price.toString();
  if (body.durationMinutes !== undefined) update.durationMinutes = body.durationMinutes;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  const [row] = await db
    .update(servicesTable)
    .set(update)
    .where(eq(servicesTable.id, params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeService(row));
});

router.delete("/services/:id", async (req, res) => {
  const params = DeleteServiceParams.parse(req.params);
  // Soft delete to preserve historical references on appointments
  const [row] = await db
    .update(servicesTable)
    .set({ isActive: false })
    .where(and(eq(servicesTable.id, params.id), eq(servicesTable.isActive, true)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
