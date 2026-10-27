/**
 * Stackra file contract:
 * Purpose: the `AppApprovalChallenges` port: where app approval challenges and the devices bound to a principal live:
 *          write a challenge (create, approve, deny and complete are writes of the next state), read one by id or by
 *          its QR token hash, list a principal's pending ones, count recent ones for the rate limits, expire the
 *          lapsed ones, and bind, unbind and check an approving device.
 * Boundary: an abstract class that is its own token; storage only. The rules (number matching, one pending per device,
 *           the bound-device check, the rate limits, what a requester may learn) are `AppApprovalService`'s. A
 *           driver keeps the events recorded on a written challenge for its unit of work.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0263 (ports and drivers).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { AppApprovalChallenge } from "#contracts/types/app-approval-challenge.type";

/**
 * Keeps app approval challenges.
 *
 * @example
 * const waiting = await challenges.pending(user.id, clock.now());
 */
export abstract class AppApprovalChallenges extends Port {
  /** Writes `challenge`, replacing the one with its id. */
  abstract put(challenge: AppApprovalChallenge): Promise<void>;

  /** The challenge with `id`, or `undefined`. */
  abstract get(id: string): Promise<AppApprovalChallenge | undefined>;

  /** The challenge whose QR token hashes to `tokenHash`, or `undefined`. */
  abstract byToken(tokenHash: string): Promise<AppApprovalChallenge | undefined>;

  /** `principal`'s pending challenges that have not lapsed at `now`, newest first. */
  abstract pending(principal: PublicId<"usr">, now: Date): Promise<readonly AppApprovalChallenge[]>;

  /** How many challenges were created since `since` by the requesting device and, or, for the target. */
  abstract countSince(
    filter: { readonly device?: string; readonly target?: string },
    since: Date,
  ): Promise<number>;

  /** Marks every pending challenge lapsed at `now` expired; answers how many. */
  abstract expire(now: Date): Promise<number>;

  /** Binds `device`'s credential to `principal`: the device may approve that principal's challenges. */
  abstract bindDevice(principal: PublicId<"usr">, device: string): Promise<void>;

  /** Unbinds it; `false` when it was not bound. */
  abstract unbindDevice(principal: PublicId<"usr">, device: string): Promise<boolean>;

  /** Whether `device` holds a credential bound to `principal`. */
  abstract isBound(principal: PublicId<"usr">, device: string): Promise<boolean>;
}
