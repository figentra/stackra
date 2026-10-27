/**
 * Stackra file contract:
 * Purpose: `AppApprover`, the signed-in app answering a challenge: its principal (from the app's session) and its
 *          device (from the device credential the host verified on the call).
 * Boundary: a type only. The host fills it from the authenticated call, never from the request body.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { PublicId } from "@stackra/contracts";

/** The approving app. */
export interface AppApprover {
  /** The app's signed-in principal. */
  readonly principal: PublicId<"usr">;

  /** The app's device. */
  readonly device: string;
}
