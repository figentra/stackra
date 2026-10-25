/**
 * Stackra file contract:
 * Purpose: `PathParams<P>`, the params a path pattern names: `"/store/:slug"` gives `{ slug: string }`, `"/m/*"` gives
 *          `{ "*": string }`, `"/"` gives none.
 * Boundary: a type only; a route with a `params` shape class is typed by that class instead (`ParamsOf`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */

/** The param named by one segment, or none. */
type SegmentParam<S extends string> = S extends `:${infer Name}`
  ? Name extends `${infer Optional}?`
    ? Optional
    : Name
  : S extends "*"
    ? "*"
    : never;

/** Every param named by a path. */
type ParamNames<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? SegmentParam<Head> | ParamNames<Tail>
  : SegmentParam<P>;

/** The params of path pattern `P`. */
export type PathParams<P extends string> = { readonly [Name in ParamNames<P>]: string };
