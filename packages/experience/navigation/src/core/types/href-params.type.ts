/**
 * Stackra file contract:
 * Purpose: `HrefParams`, the second argument of `ctx.href`, `ctx.redirect` and `useHref`: the target's path params
 *          (`{ slug }`, `{ "*": "help" }`), plus `search` for the query string and `hash` for the fragment.
 * Boundary: a type only. A param the path does not name is left out of the URL (on native it travels as a screen
 *           param); `search` entries that are `undefined` are dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0297 (decision 4: locale URLs).
 */

/** Path params of a target, with its query and fragment. */
export interface HrefParams {
  /** The query string, entry by entry. */
  readonly search?: Readonly<Record<string, string | number | boolean | undefined>> | undefined;

  /** The fragment, without `#`. */
  readonly hash?: string | undefined;

  /** A path param (`slug`, `orderId`, `*`), or a screen param on native. */
  readonly [param: string]: unknown;
}
