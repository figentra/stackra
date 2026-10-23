/**
 * Stackra file contract:
 * Purpose: the React context the native `RouterProvider` fills and `Link` reads: the app's navigate function.
 * Boundary: the context object only; null outside a provider, where Link falls back to `Linking`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 5); owner decision 1 of STA-350 (router-aware UI
 *          lives in @stackra/navigation).
 */
import { createContext } from "react";

/** The navigate function of the nearest `RouterProvider`, or null when there is none. */
export const RouterContext = createContext<((href: string) => void) | null>(null);
