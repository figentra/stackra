/**
 * Stackra file contract:
 * Purpose: `sqlStateOf(error)`, the Postgres SQLSTATE a database error carries (`40001`, `23505`), read from the
 *          driver exception or the error it wraps.
 * Boundary: internal to `translateDbError` and `runTransaction`. Looks at `sqlState`, then `code`, on the error and up
 *           to two causes below it; anything else (a refusal, a `TypeError`) has none.
 * Runtime: node
 * Governing contract: ADR 0140 (refusals); data-layer gap mo6.
 */

/** A string field of `error` or of one of its first two causes. */
function fieldOf(error: unknown, name: string): string | undefined {
  for (
    let current = error, depth = 0;
    current !== null && typeof current === "object" && depth < 3;
    depth += 1
  ) {
    const value = (current as Record<string, unknown>)[name];
    if (typeof value === "string" && value !== "") return value;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * The SQLSTATE of `error`, or `undefined`.
 *
 * @example
 * sqlStateOf(deadlock); // "40P01"
 */
export function sqlStateOf(error: unknown): string | undefined {
  return fieldOf(error, "sqlState") ?? fieldOf(error, "code");
}
