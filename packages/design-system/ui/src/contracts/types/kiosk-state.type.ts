/**
 * Stackra file contract:
 * Purpose: `KioskState`, what `useKiosk()` answers inside a `KioskSurface`: the reach layout, whether high contrast and
 *          audio are on, `announce` (spoken when audio is on), and `resetIdle` (a screen that keeps working without
 *          touches, such as a payment in progress, holds the idle reset off with it).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 1); WCAG 2.2 SC 2.2.1 and 4.1.3.
 */
import type { KioskReach } from "#contracts/enums/kiosk-reach.enum";

/** The kiosk surface's state. */
export interface KioskState {
  /** The reach layout. */
  readonly reach: KioskReach;
  /** Whether high contrast is on. */
  readonly isHighContrast: boolean;
  /** Whether audio guidance is on. */
  readonly isAudioOn: boolean;
  /** Speaks `text` when audio is on; does nothing otherwise. */
  readonly announce: (text: string) => void;
  /** Restarts the idle countdown, as a touch does. */
  readonly resetIdle: () => void;
}
