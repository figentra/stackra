/**
 * Stackra file contract:
 * Purpose: `aggregateOf()`, the sum, average, least, greatest or count of a column's values; values that are not
 *          numbers count toward `count` only.
 * Boundary: a pure function; null for an average, least or greatest of no numbers.
 * Runtime: isomorphic
 * Governing contract: product audit 2026-10-28 (DataTable aggregates).
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";

/**
 * The aggregate of `values`.
 * @param values - the column's cell values
 * @param kind - which aggregate
 * @returns the number, or null where there is none
 */
export function aggregateOf(values: readonly unknown[], kind: AggregateKind): number | null {
  if (kind === "count") return values.length;
  const numbers = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (kind === "sum") return numbers.reduce((total, value) => total + value, 0);
  if (numbers.length === 0) return null;
  if (kind === "avg") return numbers.reduce((total, value) => total + value, 0) / numbers.length;
  return kind === "min" ? Math.min(...numbers) : Math.max(...numbers);
}
