/**
 * Stackra file contract:
 * Purpose: `I18nNode`, one node of the merged key tree behind `#stackra/i18n`: a leaf list, or children by segment
 *          with the leaves under `_`.
 * Boundary: a type only; `i18nTree` builds it and `emitI18n` prints it as a `keys(...)` call.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>` lookups); STA-1293.
 */

/** A `keys(...)` node: a leaf list, or children by segment with the leaves under `_`. */
export type I18nNode = readonly string[] | { readonly [segment: string]: I18nNode };
