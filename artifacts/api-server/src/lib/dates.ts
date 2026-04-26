// Treat all "date" query params as Brazil/local dates (America/Sao_Paulo, UTC-3, no DST).
// We compute the day boundaries as -03:00 ranges so the SQL filters match
// what the barber sees in the app, without depending on TZ env config.

const TZ_OFFSET = "-03:00";

export function dayStart(dateYYYYMMDD: string): Date {
  return new Date(`${dateYYYYMMDD}T00:00:00${TZ_OFFSET}`);
}

export function dayEnd(dateYYYYMMDD: string): Date {
  return new Date(`${dateYYYYMMDD}T23:59:59.999${TZ_OFFSET}`);
}

export function todayInTz(): string {
  const now = new Date();
  // shift now into UTC-3 then format YYYY-MM-DD
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function addDays(dateYYYYMMDD: string, n: number): string {
  const d = new Date(`${dateYYYYMMDD}T12:00:00${TZ_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return formatDate(d);
}

export function formatDate(d: Date): string {
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function dateOfTimestampInTz(d: Date): string {
  return formatDate(d);
}
