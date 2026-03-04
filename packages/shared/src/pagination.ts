export function normalizeLimit(value: number | undefined, defaultValue = 20, min = 1, max = 100) {
  if (!Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(Number(value), max));
}

export function nextCursor<T extends { id: string }>(rows: T[], limit: number): string | null {
  if (rows.length < limit) {
    return null;
  }

  return rows[rows.length - 1]?.id ?? null;
}