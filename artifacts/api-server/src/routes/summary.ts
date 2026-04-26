import { Router, type IRouter } from "express";
import { db, appointmentsTable, settingsTable } from "@workspace/db";
import {
  GetDailySummaryQueryParams,
  GetRangeSummaryQueryParams,
  GetInsightsQueryParams,
} from "@workspace/api-zod";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { serializeSettings } from "../lib/serializers";
import { dayStart, dayEnd, addDays } from "../lib/dates";

const router: IRouter = Router();

const SETTINGS_ID = 1;

async function getSettingsRow() {
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, SETTINGS_ID));
  if (existing[0]) return existing[0];
  const [row] = await db.insert(settingsTable).values({ id: SETTINGS_ID }).returning();
  if (!row) throw new Error("settings bootstrap failed");
  return row;
}

function aggregateDay(rows: { price: string; durationSeconds: number | null; startedAt: Date }[]) {
  let revenue = 0;
  let worked = 0;
  for (const r of rows) {
    revenue += Number(r.price);
    worked += r.durationSeconds ?? 0;
  }
  const count = rows.length;
  const avg = count > 0 ? revenue / count : 0;
  return { revenue, count, avgTicket: avg, workedSeconds: worked };
}

function idleSecondsFor(rows: { startedAt: Date; endedAt: Date | null; durationSeconds: number | null }[], settings: { workStartTime: string; workEndTime: string }) {
  if (rows.length === 0) return 0;
  // Sum gaps between appointments within the day's working window
  const sorted = [...rows].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  let idle = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const prevEnd = prev.endedAt ?? new Date(prev.startedAt.getTime() + (prev.durationSeconds ?? 0) * 1000);
    const gap = (cur.startedAt.getTime() - prevEnd.getTime()) / 1000;
    if (gap > 0) idle += gap;
  }
  // Cap idle at the configured work window length
  const [sh, sm] = settings.workStartTime.split(":").map(Number);
  const [eh, em] = settings.workEndTime.split(":").map(Number);
  const windowSeconds = Math.max(0, ((eh ?? 0) * 3600 + (em ?? 0) * 60) - ((sh ?? 0) * 3600 + (sm ?? 0) * 60));
  return Math.min(idle, windowSeconds);
}

router.get("/summary/daily", async (req, res) => {
  const query = GetDailySummaryQueryParams.parse(req.query);
  const settings = await getSettingsRow();
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(and(gte(appointmentsTable.startedAt, dayStart(query.date)), lte(appointmentsTable.startedAt, dayEnd(query.date))))
    .orderBy(asc(appointmentsTable.startedAt));

  const agg = aggregateDay(rows);
  const idle = idleSecondsFor(rows, settings);
  const goal = Number(settings.dailyGoal);
  const goalProgressPct = goal > 0 ? Math.min(100, (agg.revenue / goal) * 100) : 0;
  const revenuePerHour = agg.workedSeconds > 0 ? (agg.revenue / (agg.workedSeconds / 3600)) : 0;

  res.json({
    date: query.date,
    totalRevenue: round2(agg.revenue),
    totalAppointments: agg.count,
    avgTicket: round2(agg.avgTicket),
    goalProgressPct: round2(goalProgressPct),
    goal: round2(goal),
    workedSeconds: agg.workedSeconds,
    idleSeconds: Math.round(idle),
    revenuePerHour: round2(revenuePerHour),
  });
});

router.get("/summary/range", async (req, res) => {
  const query = GetRangeSummaryQueryParams.parse(req.query);
  const settings = await getSettingsRow();
  const allRows = await db
    .select()
    .from(appointmentsTable)
    .where(and(gte(appointmentsTable.startedAt, dayStart(query.startDate)), lte(appointmentsTable.startedAt, dayEnd(query.endDate))))
    .orderBy(asc(appointmentsTable.startedAt));

  const days: { date: string; revenue: number; appointments: number; workedSeconds: number }[] = [];
  let cur = query.startDate;
  let totalIdle = 0;
  while (cur <= query.endDate) {
    const dayRows = allRows.filter(
      (r) => r.startedAt >= dayStart(cur) && r.startedAt <= dayEnd(cur),
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

  res.json({
    startDate: query.startDate,
    endDate: query.endDate,
    totalRevenue: round2(totalRevenue),
    totalAppointments,
    avgTicket: round2(avgTicket),
    workedSeconds,
    idleSeconds: Math.round(totalIdle),
    revenuePerHour: round2(revenuePerHour),
    days,
  });
});

router.get("/summary/insights", async (req, res) => {
  const query = GetInsightsQueryParams.parse(req.query);
  const settings = await getSettingsRow();

  const today = query.date;
  const sevenAgo = addDays(today, -6);
  const fourteenAgo = addDays(today, -13);

  const last7 = await db
    .select()
    .from(appointmentsTable)
    .where(and(gte(appointmentsTable.startedAt, dayStart(sevenAgo)), lte(appointmentsTable.startedAt, dayEnd(today))));
  const prev7 = await db
    .select()
    .from(appointmentsTable)
    .where(and(gte(appointmentsTable.startedAt, dayStart(fourteenAgo)), lte(appointmentsTable.startedAt, dayEnd(addDays(today, -7)))));

  const insights: { id: string; kind: string; title: string; body: string; tone: string }[] = [];

  // 1) Today's projection
  const todayRows = last7.filter(
    (r) => r.startedAt >= dayStart(today) && r.startedAt <= dayEnd(today),
  );
  const todayRevenue = todayRows.reduce((s, r) => s + Number(r.price), 0);
  const now = new Date();
  const elapsedHours = Math.max(0.5, (now.getTime() - dayStart(today).getTime()) / 3600000);
  const goal = Number(settings.dailyGoal);
  if (todayRevenue > 0 && elapsedHours > 1) {
    const dayLengthHours = 10;
    const projection = (todayRevenue / elapsedHours) * Math.min(dayLengthHours, elapsedHours + 6);
    insights.push({
      id: "projection",
      kind: "projection",
      title: "Projeção do dia",
      body: `Mantendo o ritmo atual, você fatura cerca de ${brl(projection)} hoje.${goal > 0 ? ` Meta: ${brl(goal)}.` : ""}`,
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

  // 2) Avg ticket trend last 7 vs prior 7
  const last7Revenue = last7.reduce((s, r) => s + Number(r.price), 0);
  const last7Count = last7.length;
  const prev7Revenue = prev7.reduce((s, r) => s + Number(r.price), 0);
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
        body: `Seu ticket médio variou ${diff > 0 ? "+" : ""}${diff.toFixed(1)}% nesta semana (${brl(last7Avg)} contra ${brl(prev7Avg)}).`,
        tone: diff > 0 ? "positive" : "warning",
      });
    }
  }

  // 3) Idle ratio today vs week avg
  const todayIdle = idleSecondsFor(todayRows, settings);
  const todayWorked = todayRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);
  const todayTotal = todayIdle + todayWorked;
  if (todayTotal > 0) {
    const idlePct = (todayIdle / todayTotal) * 100;
    // weekly idle pct
    let weekIdle = 0;
    let weekWorked = 0;
    let cursor = sevenAgo;
    while (cursor <= today) {
      const dayRows = last7.filter((r) => r.startedAt >= dayStart(cursor) && r.startedAt <= dayEnd(cursor));
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

  // 4) Best day in last 7
  if (last7.length > 0) {
    const byDay = new Map<string, number>();
    for (const r of last7) {
      const key = r.startedAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(r.price));
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

  res.json(insights);
  // settings unused alias removal
  void serializeSettings;
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function brl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default router;
