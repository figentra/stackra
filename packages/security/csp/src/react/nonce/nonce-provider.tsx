/**
 * Stackra file contract:
 * Purpose: `NonceProvider`, the React context component that puts the request's CSP nonce under a server render, so
 *          `useNonce` and `Style` stamp it on the scripts and `<style>` elements they write.
 * Boundary: provides the nonce and renders its children; it mints nothing. Mounted by the generated server entry
 *           (`entry.server.tsx`) with the nonce the root middleware minted, never by hand in app code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: a Provider is a React context component only); ADR 0237.
 */
import type { ReactNode } from "react";

import { NonceContext } from "./nonce-context";
import type { NonceProviderProps } from "./nonce-provider-props.type";

/**
 * Makes `value` the nonce of everything under it.
 *
 * @example
 * <NonceProvider value={nonce}>
 *   <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
 * </NonceProvider>
 */
export function NonceProvider({ value, children }: NonceProviderProps): ReactNode {
  return <NonceContext value={value}>{children}</NonceContext>;
}
