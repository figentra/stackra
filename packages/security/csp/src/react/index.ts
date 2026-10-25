/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/csp (`NonceProvider`, `useNonce`, `Style`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `NonceContext` stays internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { NonceProvider } from "#react/nonce/nonce-provider";
export type { NonceProviderProps } from "#react/nonce/nonce-provider-props.type";
export { useNonce } from "#react/nonce/use-nonce";
export { Style } from "#react/style/style";
export type { StyleProps } from "#react/style/style-props.type";
