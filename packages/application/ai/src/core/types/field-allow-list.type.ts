/**
 * Stackra file contract:
 * Purpose: `FieldAllowList`, the fields of each data class that may reach a model, as dotted paths per class.
 * Boundary: a type only; product data, per data class. A class it does not list reaches a model with no field at all.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 15: a field allow-list per data class); ADR 0341.
 */

/** Data class → the dotted field paths allowed to reach a model. */
export type FieldAllowList = Readonly<Record<string, readonly string[]>>;
