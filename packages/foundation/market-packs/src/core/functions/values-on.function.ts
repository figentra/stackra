/**
 * Stackra file contract:
 * Purpose: `valuesOn`, every value in force for a resolved market on one date, by key: within one pack the entry whose
 *          days cover the date (the latest start when several do), and across layers the overlay over its parent.
 * Boundary: pure. An overlay replaces a parent's value only where it has an entry in force that day; otherwise the
 *           parent's value shows through. Throws a `RangeError` for a date that is not `YYYY-MM-DD`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 3 and 5).
 */
import type { PackEntry } from "#core/types/pack-entry.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";
import type { ResolvedValue } from "#core/types/resolved-value.type";

/**
 * The values of `resolved` on `on`.
 *
 * @example
 * valuesOn(resolved, "2026-07-01").get("tax.vat.standard")?.value;
 */
export function valuesOn(resolved: ResolvedPack, on: string): ReadonlyMap<string, ResolvedValue> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(on)) throw new RangeError(`${on} is not a YYYY-MM-DD date`);
  const values = new Map<string, ResolvedValue>();
  for (const layer of resolved.layers) {
    const current = new Map<string, PackEntry>();
    for (const entry of layer.entries) {
      if (entry.from > on || (entry.until !== undefined && entry.until < on)) continue;
      const held = current.get(entry.key);
      if (held === undefined || held.from < entry.from) current.set(entry.key, entry);
    }
    for (const [key, entry] of current)
      values.set(key, {
        key,
        value: entry.value,
        market: layer.market,
        version: layer.version,
        ...(entry.floor === undefined ? {} : { floor: entry.floor }),
      });
  }
  return values;
}
