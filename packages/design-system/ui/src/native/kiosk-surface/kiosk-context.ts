/**
 * Stackra file contract:
 * Purpose: `KioskContext`, the state of the nearest native `KioskSurface`, or null outside one.
 * Boundary: internal to the kiosk surface; read through `useKiosk()`.
 * Runtime: react-native
 * Governing contract: ADR 0428 (decision 1).
 */
import { createContext } from "react";

import type { KioskState } from "#contracts/types/kiosk-state.type";

/** The kiosk state, or null outside a kiosk surface. */
export const KioskContext = createContext<KioskState | null>(null);
