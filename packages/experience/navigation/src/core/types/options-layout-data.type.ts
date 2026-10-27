/**
 * Stackra file contract:
 * Purpose: `OptionsLayoutData<O>`, the data the layout named in route options `O` shares with the route: its loader's
 *          object data (`{ site }` from `SiteLayout`). `Route<O>` carries it as its type-only `~layoutData`.
 * Boundary: a type only; `unknown` (no members) for options without a layout or a layout that returns no object.
 *           Computed on the declared options, which are concrete, so the `[D] extends [never]` check below never runs
 *           while TS reads a deferred `LayoutData<this>` through its class (it would answer `unknown` there).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";

import type { LoaderData } from "#core/types/loader-data.type";

/** The object part of `D`, or `unknown`. */
type ObjectPart<D> = [D] extends [never] ? unknown : D extends object ? D : unknown;

/** The data the layout of route options `O` shares with the route. */
export type OptionsLayoutData<O> = O extends { readonly layout: AnyClass<infer L> }
  ? ObjectPart<Exclude<LoaderData<L>, null | undefined>>
  : unknown;
