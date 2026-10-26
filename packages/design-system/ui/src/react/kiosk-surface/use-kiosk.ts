/**
 * Stackra file contract:
 * Purpose: `useKiosk()`, the state of the nearest react `KioskSurface`: reach, high contrast, audio, `announce` and
 *          `resetIdle`; null outside a kiosk, so a component used on a till and on a kiosk can ask.
 * Boundary: a hook; reads the context only.
 * Runtime: browser
 * Governing contract: ADR 0428 (decision 1).
 */
import { use } from "react";

import type { KioskState } from "#contracts/types/kiosk-state.type";
import { KioskContext } from "#react/kiosk-surface/kiosk-context";

/**
 * The kiosk state, or null outside a kiosk.
 *
 * @example
 * const kiosk = useKiosk();
 * kiosk?.announce(t(keys.added, { name }));
 */
export function useKiosk(): KioskState | null {
  return use(KioskContext);
}
