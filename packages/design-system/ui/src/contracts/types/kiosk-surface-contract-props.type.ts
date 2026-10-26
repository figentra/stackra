/**
 * Stackra file contract:
 * Purpose: the props both `KioskSurface`s take: the unattended screen's idle reset (the timeout and what resetting
 *          does), its reach layout, high contrast, and audio guidance (spoken announcements).
 * Boundary: types only. Every value is the caller's: the idle timeout and the accessibility defaults are settings of
 *           the device (ADR 0428), never constants here.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 1); R3-SO-10; WCAG 2.2 SC 1.4.6, 2.2.1, 2.5.8 and 4.1.3.
 */
import type { ReactNode } from "react";

import type { KioskReach } from "#contracts/enums/kiosk-reach.enum";

/** Props of the web and native `KioskSurface`. */
export interface KioskSurfaceContractProps {
  /** The kiosk's screens. */
  readonly children: ReactNode;
  /** How long, in milliseconds, without a touch, a key or a pointer before the kiosk resets (a device setting). */
  readonly idleTimeoutMs: number;
  /** Resets the kiosk: drops the session and the basket and shows the attract screen. */
  readonly onIdle: () => void;
  /** The reach layout; `standing` when left out. */
  readonly reach?: KioskReach | undefined;
  /** True for the high-contrast presentation. */
  readonly isHighContrast?: boolean | undefined;
  /** True to speak announcements aloud (audio guidance through the kiosk's speaker or headphone jack). */
  readonly isAudioOn?: boolean | undefined;
  /**
   * Speaks a text aloud in the kiosk's language. On web the browser's speech synthesis speaks when this is left out;
   * on native the caller passes the platform's speech, since React Native has none of its own.
   */
  readonly speak?: ((text: string) => void) | undefined;
}
