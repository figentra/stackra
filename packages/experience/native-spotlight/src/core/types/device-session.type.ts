/**
 * Stackra file contract:
 * Purpose: `DeviceSession`, what `SpotlightIndexer.clearOnSignOut` reads of the device's session: whether someone is
 *          signed in and whether identity revoked the session (a sign-out elsewhere, a disabled or erased account).
 * Boundary: a type only, the structural half of `@stackra/query`'s `OfflineSession`, so the app hands that port's
 *           driver in as it is and this package depends on neither query nor identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 4: a revoked session is the wipe signal); ADR 0189 (decision 2).
 */
import type { ReadonlySignal } from "@stackra/platform/contracts";

/** The device's session, as the phone's search needs it. */
export interface DeviceSession {
  /** True while someone is signed in on the device. */
  readonly isSignedIn: ReadonlySignal<boolean>;

  /** True while identity reports the device's session revoked. */
  readonly isRevoked: ReadonlySignal<boolean>;
}
