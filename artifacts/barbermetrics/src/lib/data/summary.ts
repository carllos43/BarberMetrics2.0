import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { mapAppointment } from "./mappers";
import { addDays, dayEnd, dayStart } from "./dates";
import { ensureSettings } from "./settings";
import type { Appointment, DailySummary, Insight, RangeSummary, Settings } from "./types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

async function fetchAppointmentsRange(start: string, end: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("started_at", dayStart(start).toISOString())
    .lte("started_at", dayEnd(end).toISOString())
    .order("started_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

function aggregateDay(rows: Appointment[]) {
  let revenue = 0;
  let worked = 0;
  for (const r of rows) {
    revenue += r.price;
    worked += r.durationSeconds ?? 0;
  }
  const count = rows.length;
  const avg = count > 0 ? revenue / count : 0;
  return { revenue, count, avgTicket: avg, workedSeconds: worked };
}

function idleSecondsFor(rows: Appointment[], settings: Settings): number {
  if (rows.length === 0) return 0;
  const sorted = [...rows].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
  let idle = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const prevEndMs = prev.endedAt
      ? new Date(prev.endedAt).getTime()
      : new Date(prev.startedAt).getTime() + (prev.durationSeconds ?? 0) * 1000;
    const gap = (new Date(cur.startedAt).getTime() - prevEndMs) / 1000;
    if (gap > 0) idle += gap;
  }
  const [sh, sm] = settings.workStartTime.split(":").map(Number);
  const [eh, em] = settings.workEndTime.split(":").map(Number);
  const windowSeconds = Math.max(0, ((eh ?? 0) * 3600 + (em ?? 0) * 60) - ((sh ?? 0) * 3600 + (sm ?? 0) * 60));
  return Math.min(idle, windowSeconds);
}

export function useGetDailySummary(params: { date: string }) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["summary", "daily", params.date],
    queryFn: async (): Promise<DailySummary> => {
      const [settings, rows] = await Promise.all([
        ensureSettings(qc),
        fetchAppointmentsRange(params.date, params.date),
      ]);
      const agg = aggregateDay(rows);
      const idle = idleSecondsFor(rows, settings);
      const goal = settings.dailyGoal;
      const goalProgressPct = goal > 0 ? Math.min(100, (agg.revenue / goal) * 100) : 0;
      const revenuePerHour = agg.workedSeconds > 0 ? agg.revenue / (agg.workedSeconds / 3600) : 0;
      return {
        date: params.date,
        totalRevenue: round2(agg.revenue),
        totalAppointments: agg.count,
        avgTicket: round2(agg.avgTicket),
        goalProgressPct: round2(goalProgressPct),
        goal: round2(goal),
        workedSeconds: agg.workedSeconds,
        idleSeconds: Math.round(idle),
        revenuePerHour: round2(revenuePerHour),
      };
    },
    staleTime: 30_000,
  });
}

export function useGetRangeSummary(params: { startDate: string; endDate: string }) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["summary", "range", params.startDate, params.endDate],
    queryFn: async (): Promise<RangeSummary> => {
      const [settings, allRows] = await Promise.all([
        ensureSettings(qc),
        fetchAppointmentsRange(params.startDate, params.endDate),
      ]);

      const days: RangeSummary["days"] = [];
      let totalIdle = 0;
      let cur = params.startDate;
      while (cur <= params.endDate) {
        const dayRows = allRows.filter(
          (r) =>
            new Date(r.startedAt) >= dayStart(cur) &&
            new Date(r.startedAt) <= dayEnd(cur)
        );
        const agg = aggregateDay(dayRows);
        days.push({
          date: cur,
          revenue: round2(agg.revenue),
          appointments: agg.count,
          workedSeconds: agg.workedSeconds,
        });
        totalIdle += idleSecondsFor(dayRows, settings);
        cur = addDays(cur, 1);
      }

      const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
      const totalAppointments = days.reduce((s, d) => s + d.appointments, 0);
      const workedSeconds = days.reduce((s, d) => s + d.workedSeconds, 0);
      const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
      const revenuePerHour = workedSeconds > 0 ? totalRevenue / (workedSeconds / 3600) : 0;

      return {
        startDate: params.startDate,
        endDate: params.endDate,
        totalRevenue: round2(totalRevenue),
        totalAppointments,
        avgTicket: round2(avgTicket),
        workedSeconds,
        idleSeconds: Math.round(totalIdle),
        revenuePerHour: round2(revenuePerHour),
        days,
      };
    },
    staleTime: 30_000,
  });
}

export function useGetInsights(params: { date: string }) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["insights", params.date],
    queryFn: async (): Promise<Insight[]> => {
      const today = params.date;
      const sevenAgo = addDays(today, -6);
      const fourteenAgo = addDays(today, -13);
      const [settings, last7, prev7] = await Promise.all([
        ensureSettings(qc),
        fetchAppointmentsRange(sevenAgo, today),
        fetchAppointmentsRange(fourteenAgo, addDays(today, -7)),
      ]);

      const insights: Insight[] = [];

      const todayRows = last7.filter(
        (r) =>
          new Date(r.startedAt) >= dayStart(today) &&
          new Date(r.startedAt) <= dayEnd(today)
      );
      const todayRevenue = todayRows.reduce((s, r) => s + r.price, 0);
      const now = new Date();
      const elapsedHours = Math.max(0.5, (now.getTime() - dayStart(today).getTime()) / 3600000);
      const goal = settings.dailyGoal;

      if (todayRevenue > 0 && elapsedHours > 1) {
        const dayLengthHours = 10;
        const projection = (todayRevenue / elapsedHours) * Math.min(dayLengthHours, elapsedHours + 6);
        insights.push({
          id: "projection",
          kind: "projection",
          title: "Projeção do dia",
          body: `Mantendo o ritmo atual, você fatura cerca de ${brl(projection)} hoje.${
            goal > 0 ? ` Meta: ${brl(goal)}.` : ""
          }`,
          tone: goal > 0 && projection >= goal ? "positive" : "neutral",
        });
      } else if (goal > 0 && todayRevenue >= goal) {
        insights.push({
          id: "goal_hit",
          kind: "milestone",
          title: "Meta batida",
          body: `Você já atingiu sua meta diária de ${brl(goal)}. Excelente.`,
          tone: "positive",
        });
      }

      const last7Revenue = last7.reduce((s, r) => s + r.price, 0);
      const last7Count = last7.length;
      const prev7Revenue = prev7.reduce((s, r) => s + r.price, 0);
      const prev7Count = prev7.length;
      if (last7Count > 0 && prev7Count > 0) {
        const last7Avg = last7Revenue / last7Count;
        const prev7Avg = prev7Revenue / prev7Count;
        const diff = ((last7Avg - prev7Avg) / prev7Avg) * 100;
        if (Math.abs(diff) >= 3) {
          insights.push({
            id: "ticket_trend",
            kind: "trend",
            title: diff > 0 ? "Ticket médio em alta" : "Ticket médio em queda",
            body: `Seu ticket médio variou ${diff > 0 ? "+" : ""}${diff.toFixed(1)}% nesta semana (${brl(
              last7Avg
            )} contra ${brl(prev7Avg)}).`,
            tone: diff > 0 ? "positive" : "warning",
          });
        }
      }

      const todayIdle = idleSecondsFor(todayRows, settings);
      const todayWorked = todayRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
      const todayTotal = todayIdle + todayWorked;
      if (todayTotal > 0) {
        const idlePct = (todayIdle / todayTotal) * 100;
        let weekIdle = 0;
        let weekWorked = 0;
        let cursor = sevenAgo;
        while (cursor <= today) {
          const dayRows = last7.filter(
            (r) =>
              new Date(r.startedAt) >= dayStart(cursor) &&
              new Date(r.startedAt) <= dayEnd(cursor)
          );
          weekIdle += idleSecondsFor(dayRows, settings);
          weekWorked += dayRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
          cursor = addDays(cursor, 1);
        }
        const weekTotal = weekIdle + weekWorked;
        if (weekTotal > 0) {
          const weekIdlePct = (weekIdle / weekTotal) * 100;
          const delta = idlePct - weekIdlePct;
          if (Math.abs(delta) >= 5) {
            insights.push({
              id: "idle_ratio",
              kind: "comparison",
              title: delta < 0 ? "Dia mais produtivo" : "Mais ociosidade hoje",
              body:
                delta < 0
                  ? `Sua ociosidade hoje (${idlePct.toFixed(0)}%) está abaixo da média da semana (${weekIdlePct.toFixed(0)}%).`
                  : `Sua ociosidade hoje (${idlePct.toFixed(0)}%) está acima da média da semana (${weekIdlePct.toFixed(0)}%).`,
              tone: delta < 0 ? "positive" : "warning",
            });
          }
        }
      }

      if (last7.length > 0) {
        const byDay = new Map<string, number>();
        for (const r of last7) {
          const key = new Date(r.startedAt).toISOString().slice(0, 10);
          byDay.set(key, (byDay.get(key) ?? 0) + r.price);
        }
        const best = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
        if (best) {
          const weekday = new Date(`${best[0]}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            timeZone: "America/Sao_Paulo",
          });
          insights.push({
            id: "best_day",
            kind: "trend",
            title: "Melhor dia da semana",
            body: `Seu dia mais forte foi ${weekday} com ${brl(best[1])} faturado.`,
            tone: "neutral",
          });
        }
      }

      if (insights.length === 0) {
        insights.push({
          id: "empty",
          kind: "comparison",
          title: "Sem dados suficientes ainda",
          body: "Registre alguns atendimentos e seus insights aparecerão aqui em breve.",
          tone: "neutral",
        });
      }

      return insights;
    },
    staleTime: 60_000,
  });
}
