// Treat date-only strings (YYYY-MM-DD) as the local day in São Paulo time.
// Internally we just use ISO strings; the daily window is the full UTC day
// surrounding the local day to avoid edge cases.
export function dayStart(d: string): Date {
  return new Date(`${d}T00:00:00.000-03:00`);
}
export function dayEnd(d: string): Date {
  return new Date(`${d}T23:59:59.999-03:00`);
}
export function addDays(d: string, n: number): string {
  const date = new Date(`${d}T12:00:00.000-03:00`);
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
}
