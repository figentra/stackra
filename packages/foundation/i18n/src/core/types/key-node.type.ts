/**
 * Stackra file contract:
 * Purpose: `KeyNode`, one branch of the tree `keys(...)` takes: a list of leaf names, or child branches by segment,
 *          where the `_` child lists the leaves of a branch that also has children.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); registry v3.1 section 5 item 7 (`#stackra/i18n`).
 */

/** `["home", "shop"]`, or `{ _: ["title"], catalogue: ["title", "body"] }`. */
export type KeyNode = readonly string[] | { readonly [segment: string]: KeyNode };
