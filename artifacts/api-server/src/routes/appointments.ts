import { Router, type IRouter } from "express";
import { db, appointmentsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  UpdateAppointmentParams,
  DeleteAppointmentParams,
  ListAppointmentsQueryParams,
} from "@workspace/api-zod";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { serializeAppointment } from "../lib/serializers";
import { dayStart, dayEnd } from "../lib/dates";

const router: IRouter = Router();

router.get("/appointments", async (req, res) => {
  const query = ListAppointmentsQueryParams.parse(req.query);
  const conds = [];
  if (query.date) {
    conds.push(gte(appointmentsTable.startedAt, dayStart(query.date)));
    conds.push(lte(appointmentsTable.startedAt, dayEnd(query.date)));
  } else {
    if (query.startDate) conds.push(gte(appointmentsTable.startedAt, dayStart(query.startDate)));
    if (query.endDate) conds.push(lte(appointmentsTable.startedAt, dayEnd(query.endDate)));
  }
  if (query.serviceId) conds.push(eq(appointmentsTable.serviceId, query.serviceId));

  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(where)
    .orderBy(asc(appointmentsTable.startedAt));
  res.json(rows.map(serializeAppointment));
});

router.post("/appointments", async (req, res) => {
  const body = CreateAppointmentBody.parse(req.body);
  const startedAt = new Date(body.startedAt);
  const endedAt = body.endedAt ? new Date(body.endedAt) : null;
  let duration = body.durationSeconds ?? null;
  if (duration === null && endedAt) {
    duration = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  }
  const [row] = await db
    .insert(appointmentsTable)
    .values({
      serviceId: body.serviceId ?? null,
      serviceName: body.serviceName,
      price: body.price.toString(),
      startedAt,
      endedAt,
      durationSeconds: duration,
      note: body.note ?? null,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Failed to create" });
    return;
  }
  res.status(201).json(serializeAppointment(row));
});

router.patch("/appointments/:id", async (req, res) => {
  const params = UpdateAppointmentParams.parse(req.params);
  const body = UpdateAppointmentBody.parse(req.body);
  const update: Record<string, unknown> = {};
  if (body.serviceId !== undefined) update.serviceId = body.serviceId;
  if (body.serviceName !== undefined) update.serviceName = body.serviceName;
  if (body.price !== undefined) update.price = body.price.toString();
  if (body.startedAt !== undefined) update.startedAt = new Date(body.startedAt);
  if (body.endedAt !== undefined) update.endedAt = body.endedAt ? new Date(body.endedAt) : null;
  if (body.durationSeconds !== undefined) update.durationSeconds = body.durationSeconds;
  if (body.note !== undefined) update.note = body.note;

  // If durationSeconds wasn't sent but both timestamps are now known, recompute
  if (
    update.durationSeconds === undefined &&
    update.startedAt !== undefined &&
    update.endedAt !== undefined &&
    update.endedAt !== null
  ) {
    update.durationSeconds = Math.max(
      0,
      Math.round(
        ((update.endedAt as Date).getTime() - (update.startedAt as Date).getTime()) / 1000,
      ),
    );
  }

  const [row] = await db
    .update(appointmentsTable)
    .set(update)
    .where(eq(appointmentsTable.id, params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeAppointment(row));
});

router.delete("/appointments/:id", async (req, res) => {
  const params = DeleteAppointmentParams.parse(req.params);
  const [row] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
