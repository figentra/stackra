/**
 * Stackra file contract:
 * Purpose: `AppLockGateProps`, the props of `AppLockGate`: the signed-in role, the translated prompt and button
 *          text, the cover and label colours and the app it guards.
 * Boundary: a props shape; the strings come translated from the app (`platform::app_lock.*`).
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0007.
 */
import type { ReactNode } from "react";

/** The props of `AppLockGate`. */
export interface AppLockGateProps {
  /** The signed-in person's role, whose override `AppLockConfig.roles` may hold; null before sign-in. */
  readonly roleName: string | null;
  /** The translated reason the OS prompt shows (`platform::app_lock.reason`). */
  readonly reason: string;
  /** The translated label of the unlock button after a cancelled prompt (`platform::app_lock.unlock`). */
  readonly unlockLabel: string;
  /** The colour that covers the app while it is locked or in the app switcher; the theme's background. */
  readonly coverColor: string;
  /** The colour of the unlock button's label on the cover; the theme's foreground. */
  readonly textColor: string;
  /** The app the gate guards; it stays mounted while covered. */
  readonly children: ReactNode;
}
