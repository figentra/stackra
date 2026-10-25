/**
 * Stackra file contract:
 * Purpose: `LayoutData<T>`, what the layout of route instance `T` resolved for it: its loader's object data (`{ site }`
 *          from `SiteLayout`), spread into the route's `RouteContext` and `MetaContext`.
 * Boundary: a type only; `unknown` (no members) for a route without a layout or a layout that returns no object.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";

import type { LoaderData } from "#core/types/loader-data.type";
import type { OptionsOf } from "#core/types/options-of.type";

/** The object part of `D`, or `unknown`. */
type ObjectPart<D> = [D] extends [never] ? unknown : D extends object ? D : unknown;

/** The data the layout of route instance `T` shares with it. */
export type LayoutData<T> =
  OptionsOf<T> extends { readonly layout: AnyClass<infer L> }
    ? ObjectPart<Exclude<LoaderData<L>, null | undefined>>
    : unknown;
