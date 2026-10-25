/**
 * Stackra file contract:
 * Purpose: the `PushTokenStore` port: forgets a device the push service reports dead (an uninstalled app, an
 *          unsubscribed browser), so it is never pushed again.
 * Boundary: an abstract class that is its own token; the notifications service, which stores the targets, implements
 *           it. Revoking an unknown target does nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); row "dead-token revocation" of the package needs (2026-10-25).
 */
import { Port } from "@stackra/contracts";

import type { PushTarget } from "#contracts/types/push-target.type";

/**
 * Forgets dead devices.
 *
 * @example
 * await tokens.revoke({ kind: "expo", token });
 */
export abstract class PushTokenStore extends Port {
  /** Forgets `target`. */
  abstract revoke(target: PushTarget): Promise<void>;
}
