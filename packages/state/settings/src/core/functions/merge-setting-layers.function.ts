/**
 * Stackra file contract:
 * Purpose: `mergeSettingLayers`, the cascade over stored layers: walking outermost first, an inner holder's value
 *          replaces an outer one's, except for a path an outer holder locked, whose value stays pinned for every
 *          holder below.
 * Boundary: pure; paths stay flat and relative to the group. A path no layer stores is absent, so the class schema's
 *           default applies. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: the cascade, locks); ADR 0307 (rule 22: `lockable`).
 */
import type { SettingLayer, SettingValue } from "#contracts/index";

/**
 * The resolved values and the paths locked by any holder.
 *
 * @example
 * mergeSettingLayers([
 *   { values: { a: 1 }, locked: ["a"] },
 *   { values: { a: 2, b: 3 }, locked: [] },
 * ]); // { values: { a: 1, b: 3 }, locked: ["a"] }
 */
export function mergeSettingLayers(layers: readonly SettingLayer[]): SettingLayer {
  const values: Record<string, SettingValue> = {};
  const locked = new Set<string>();
  for (const layer of layers) {
    for (const [path, value] of Object.entries(layer.values))
      if (!locked.has(path)) values[path] = value;
    // A lock pins what the path resolves to so far, stored here or inherited from above.
    for (const path of layer.locked) locked.add(path);
  }
  return { values, locked: [...locked] };
}
