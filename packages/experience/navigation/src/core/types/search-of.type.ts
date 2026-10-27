/**
 * Stackra file contract:
 * Purpose: `SearchOf<T>`, the query of a route or layout instance: the data fields of its `search` shape class, else
 *          any string entry.
 * Boundary: a type only; behind `ctx.search` and the page's `search`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";
import type { Fields } from "@stackra/validation";

// Distributive over `T` (checked naked, not through `OptionsOf`), so inside a class TS reads `X<this>` through the
// class it is declared on and `ctx.search` keeps its fields; a check through `OptionsOf<T>` stays deferred there.
/** The query of route or layout instance `T`. */
export type SearchOf<T> = T extends { readonly "~options": { readonly search: AnyClass<infer S> } }
  ? Fields<S>
  : Readonly<Record<string, string | undefined>>;
