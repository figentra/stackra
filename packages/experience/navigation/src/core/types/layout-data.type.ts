/**
 * Stackra file contract:
 * Purpose: `LayoutData<T>`, what the layout of route instance `T` resolved for it: its loader's object data (`{ site }`
 *          from `SiteLayout`), spread into the route's `RouteContext` and `MetaContext`.
 * Boundary: a type only; `unknown` (no members) for a route without a layout or a layout that returns no object. It
 *           reads the route's type-only `~layoutData` (`OptionsLayoutData` of its options), distributive over `T`, so
 *           inside a class TS reads `LayoutData<this>` through the class it is declared on and `ctx.site` resolves.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
/** The data the layout of route instance `T` shares with it. */
export type LayoutData<T> = T extends { readonly "~layoutData": infer D } ? D : unknown;
