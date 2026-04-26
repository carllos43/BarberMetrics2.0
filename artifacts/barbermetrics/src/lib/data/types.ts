export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  serviceId: string | null;
  serviceName: string;
  price: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  note: string | null;
  createdAt: string;
}

export interface Settings {
  barbershopName: string;
  dailyGoal: number;
  currency: string;
  workStartTime: string;
  workEndTime: string;
  workDays: number[];
  theme: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  totalRevenue: number;
  totalAppointments: number;
  avgTicket: number;
  goalProgressPct: number;
  goal: number;
  workedSeconds: number;
  idleSeconds: number;
  revenuePerHour: number;
}

export interface RangeSummary {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalAppointments: number;
  avgTicket: number;
  workedSeconds: number;
  idleSeconds: number;
  revenuePerHour: number;
  days: { date: string; revenue: number; appointments: number; workedSeconds: number }[];
}

export interface Insight {
  id: string;
  kind: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
}

export interface CreateServiceInput {
  name: string;
  price: number;
  durationMinutes?: number | null;
}
export interface UpdateServiceInput {
  name?: string;
  price?: number;
  durationMinutes?: number | null;
  isActive?: boolean;
}

export interface CreateAppointmentInput {
  serviceId: string | null;
  serviceName: string;
  price: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  note: string | null;
}
export interface UpdateAppointmentInput {
  serviceId?: string | null;
  serviceName?: string;
  price?: number;
  startedAt?: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  note?: string | null;
}

export interface UpdateSettingsInput {
  barbershopName?: string;
  dailyGoal?: number;
  currency?: string;
  workStartTime?: string;
  workEndTime?: string;
  workDays?: number[];
  theme?: string;
}
