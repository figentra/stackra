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

import type { OptionsOf } from "#core/types/options-of.type";
import type { PathParams } from "#core/types/path-params.type";

/** The params of route or layout instance `T`. */
export type ParamsOf<T> =
  OptionsOf<T> extends { readonly params: AnyClass<infer S> }
    ? Fields<S>
    : OptionsOf<T> extends { readonly path: infer P extends string }
      ? PathParams<P>
      : Readonly<Record<string, string | undefined>>;
