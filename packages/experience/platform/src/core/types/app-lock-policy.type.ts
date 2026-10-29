/**
 * Stackra file contract:
 * Purpose: `AppLockPolicy`, the app lock as it applies to one session: on or off, and the background time before it
 *          locks again, after the role's override.
 * Boundary: a plain value `appLockPolicy` returns; the passcode fallback stays on the configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note).
 */
import type { Duration } from "@stackra/contracts";

/** The app lock for one session. */
export interface AppLockPolicy {
  /** Whether this session locks. */
  readonly isEnabled: boolean;
  /** How long it may stay in the background before it locks again. */
  readonly lockAfter: Duration;
}
