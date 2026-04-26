import type { ServiceRow, AppointmentRow, SettingsRow } from "@workspace/db";

export function serializeService(row: ServiceRow) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    durationMinutes: row.durationMinutes ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    serviceId: row.serviceId ?? null,
    serviceName: row.serviceName,
    price: Number(row.price),
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    durationSeconds: row.durationSeconds ?? null,
    note: row.note ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeSettings(row: SettingsRow) {
  return {
    barbershopName: row.barbershopName,
    dailyGoal: Number(row.dailyGoal),
    currency: row.currency,
    workStartTime: row.workStartTime,
    workEndTime: row.workEndTime,
    workDays: row.workDays,
    theme: row.theme,
  };
}
