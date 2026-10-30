/**
 * Stackra file contract:
 * Purpose: `forecastRowsOf`, the forecast image's reply read as rows: an array whose every element carries a string id
 *          and model and number arrays of one length for the mean, lo80 and hi80, matching its timestamps.
 * Boundary: pure; returns `undefined` for any other shape so the driver can say the service answered an unreadable
 *           shape without echoing it.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */
import type { ForecastRow } from "#contracts/types/forecast-row.type";

/** Whether `item` is a finite number. */
function isNumber(item: unknown): boolean {
  return typeof item === "number" && Number.isFinite(item);
}

/** Whether `item` is a string. */
function isText(item: unknown): boolean {
  return typeof item === "string";
}

/** Whether `value` is an array of `length` items that pass `test`. */
function listOf(value: unknown, length: number, test: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.length === length && value.every(test);
}

/**
 * The rows of `reply`, or `undefined` when it is not the contract's shape.
 *
 * @example
 * const rows = forecastRowsOf(await response.json());
 */
export function forecastRowsOf(reply: unknown): readonly ForecastRow[] | undefined {
  if (!Array.isArray(reply)) return undefined;
  const ok = reply.every((row: unknown) => {
    if (typeof row !== "object" || row === null) return false;
    const { id, model, timestamps, mean, lo80, hi80 } = row as Record<string, unknown>;
    const steps = Array.isArray(timestamps) ? timestamps.length : -1;
    return (
      typeof id === "string" &&
      typeof model === "string" &&
      listOf(timestamps, steps, isText) &&
      listOf(mean, steps, isNumber) &&
      listOf(lo80, steps, isNumber) &&
      listOf(hi80, steps, isNumber)
    );
  });
  return ok ? (reply as readonly ForecastRow[]) : undefined;
}
