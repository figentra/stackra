/**
 * Stackra file contract:
 * Purpose: `readRouteKey(context, key)`, one value of a request's React Router context, or `undefined` when the
 *          context is not a `RouterContextProvider`, no key is given, or nothing was set for it.
 * Boundary: internal; never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Router 7).
 */
import { RouterContextProvider, type RouterContext } from "react-router";

/**
 * The value of `key` in `context`.
 *
 * @example
 * const container = readRouteKey(args.context, keys.container);
 */
export function readRouteKey<T>(
  context: unknown,
  key: RouterContext<T> | undefined,
): T | undefined {
  if (key === undefined || !(context instanceof RouterContextProvider)) return undefined;
  try {
    return context.get(key);
  } catch {
    return undefined; // no value set and no default
  }
}
