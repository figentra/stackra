/**
 * Stackra file contract:
 * Purpose: `useNonce()`, the hook the document shell and `Style` read the request's CSP nonce with, to pass it to
 *          `<Scripts nonce>`, `<ScrollRestoration nonce>` and every inline element they render.
 * Boundary: reads the context. Unlike `useContainer` it does not throw outside a provider: the browser renders the
 *           same shell after hydration with no nonce, so `undefined` there is the correct answer, not a silent default.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23); ADR 0237.
 */
import { use } from "react";

import { NonceContext } from "./nonce-context";

/**
 * The nonce of the nearest `NonceProvider`, or `undefined` outside one.
 *
 * @example
 * const nonce = useNonce();
 * return <Scripts nonce={nonce} />;
 */
export function useNonce(): string | undefined {
  return use(NonceContext);
}
