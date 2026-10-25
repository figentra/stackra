/**
 * Stackra file contract:
 * Purpose: `readPath`, the value at a dotted path (`order.lines.0.name`) in render data.
 * Boundary: internal to this package; not exported from the entry. Walks own properties of plain objects and array
 *           indexes only, so a path can never reach a prototype (`__proto__`, `constructor`). Answers `undefined` when
 *           any step is missing.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The value at `path` in `data`, or `undefined`. */
export function readPath(data: unknown, path: string): unknown {
  let current = data;
  for (const step of path.split(".")) {
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, step))
      return undefined;
    current = (current as Record<string, unknown>)[step];
  }
  return current;
}
