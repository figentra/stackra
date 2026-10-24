/**
 * Stackra file contract:
 * Purpose: `mergeCatalogues(catalogues)`, the overlay merge gen's `loadMessages` runs along a locale's fallback chain:
 *          farthest first, so each nearer catalogue's keys win (`en`, then `ar`, then the `ar-SA` overlay that holds
 *          only the keys that differ).
 * Boundary: pure; never mutates an input. Objects merge key by key at every depth; any other value (a message string,
 *           an intent phrase list) replaces the earlier one whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1: regional overlays fall back to their base language),
 *                     ADR 0234.
 */
import type { Catalogue } from "#core/types/catalogue.type";

/** Whether `value` is a nested branch (a plain object), not a leaf. */
function isBranch(value: unknown): value is Catalogue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `over` merged onto `base` into a new object. */
function mergeTwo(base: Catalogue, over: Catalogue): Catalogue {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) {
    if (key === "__proto__") continue; // a JSON-parsed key; assigning it would replace the prototype
    const current = out[key];
    out[key] = isBranch(current) && isBranch(value) ? mergeTwo(current, value) : value;
  }
  return out;
}

/**
 * One catalogue: the later ones' keys over the earlier ones'.
 *
 * @param catalogues - farthest fallback first, the requested locale's own catalogue last.
 * @example
 * mergeCatalogues([{ nav: { home: "Home", help: "Help centre" } }, { nav: { help: "Help center" } }]);
 * // { nav: { home: "Home", help: "Help center" } }
 */
export function mergeCatalogues(catalogues: readonly Catalogue[]): Catalogue {
  return catalogues.reduce<Catalogue>(mergeTwo, {});
}
