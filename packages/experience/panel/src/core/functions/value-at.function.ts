/**
 * Stackra file contract:
 * Purpose: `valueAt(record, path)`, the value at a dotted path of a query answer (`totals.totalMinor`), as a display or
 *          a metric binding reads it.
 * Boundary: internal: pure; the renderers import it by path. Undefined for a path the value does not have.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: dotted wire paths).
 */

/**
 * The value at `path` in `record`.
 *
 * @example
 * valueAt({ totals: { totalMinor: 900 } }, "totals.totalMinor"); // 900
 */
export function valueAt(record: unknown, path: string): unknown {
  let value = record;
  for (const segment of path.split(".")) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Readonly<Record<string, unknown>>)[segment];
  }
  return value;
}
