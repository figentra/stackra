/**
 * Stackra file contract:
 * Purpose: `ParamsOf<T>`, the path params of a route or layout instance: the data fields of its `params` shape class,
 *          else the params its path names, else any string param (a layout, a route with no path).
 * Boundary: a type only; behind `ctx.params`, the page's `params` and `InferParams`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";
import type { Fields } from "@stackra/validation";

import type { PathParams } from "#core/types/path-params.type";

// Distributive over `T` (checked naked, not through `OptionsOf`), so inside a class TS reads `X<this>` through the
// class it is declared on and `ctx.params` keeps its fields; a check through `OptionsOf<T>` stays deferred there.
/** The params of route or layout instance `T`. */
export type ParamsOf<T> = T extends { readonly "~options": { readonly params: AnyClass<infer S> } }
  ? Fields<S>
  : T extends { readonly "~options": { readonly path: infer P extends string } }
    ? PathParams<P>
    : Readonly<Record<string, string | undefined>>;
