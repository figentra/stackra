/**
 * Stackra file contract:
 * Purpose: `NonceContext`, the React context `NonceProvider` fills with the request's CSP nonce and `useNonce` reads.
 * Boundary: holds the nonce only; `undefined` outside a provider, which is the browser after hydration, where no
 *           nonce exists and none is needed. Not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: a Provider is a React context component only); ADR 0237.
 */
import { createContext } from "react";

/** The nonce of the nearest `NonceProvider`, or undefined. */
export const NonceContext = createContext<string | undefined>(undefined);
