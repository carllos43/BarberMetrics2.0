export function getErrorMessage(err: unknown, fallback = "Algo deu errado"): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  const anyErr = err as { message?: string; error_description?: string; details?: string; hint?: string };
  return (
    anyErr.message ||
    anyErr.error_description ||
    anyErr.details ||
    anyErr.hint ||
    fallback
  );
}

export function logAndExtract(err: unknown, fallback = "Algo deu errado"): string {
  console.error("[BarberMetrics]", err);
  return getErrorMessage(err, fallback);
}
