import type { Appointment, Service, Settings } from "./types";

export function mapService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    durationMinutes: row.duration_minutes ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    serviceId: row.service_id ?? null,
    serviceName: row.service_name,
    price: Number(row.price),
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    durationSeconds: row.duration_seconds ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

export function mapSettings(row: any): Settings {
  return {
    barbershopName: row.barbershop_name,
    dailyGoal: Number(row.daily_goal),
    currency: row.currency,
    workStartTime: row.work_start_time,
    workEndTime: row.work_end_time,
    workDays: row.work_days ?? [],
    theme: row.theme,
    updatedAt: row.updated_at,
  };
}
