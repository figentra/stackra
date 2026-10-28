/**
 * Stackra file contract:
 * Purpose: `ShareTargetCapability`, the `shareTarget` facet (capability `share_target`): takes, once, the payload the
 *          service worker kept in the share inbox under the id it redirected with (`/share?shared=<id>`).
 * Boundary: a type only. `take` removes the payload, so a reload or a second tab gets `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target); ADR 0250.
 */
import type { SharedPayload } from "#contracts/types/shared-payload.type";

/** The PWA share inbox. */
export interface ShareTargetCapability {
  /** The payload kept under `id`, removed as it is read; `null` for an unknown or used id. */
  take: (id: string) => Promise<SharedPayload | null>;
}
