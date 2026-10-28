/**
 * Stackra file contract:
 * Purpose: `MemoryAppApprovalChallengesDriver`, an `AppApprovalChallenges` held in memory, for tests, previews and
 *          `stackra dev`.
 * Boundary: process-local, so a challenge made on one instance is unknown to another; a host runs a database driver.
 *           It stores each challenge as given (the object, so the events recorded on it stay reachable) and keeps no
 *           event itself.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0266 (memory drivers first); ADR 0263.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { AppApprovalChallenges, AppApprovalStatus } from "#contracts/index";
import type { AppApprovalChallenge } from "#contracts/index";

/**
 * Challenges and bound devices in memory.
 *
 * @example
 * const challenges = new MemoryAppApprovalChallengesDriver();
 * await challenges.bindDevice(user.id, phone.id);
 */
export class MemoryAppApprovalChallengesDriver extends Driver(AppApprovalChallenges) {
  /** Id to challenge. */
  private readonly challenges = new Map<string, AppApprovalChallenge>();

  /** Principal to its bound devices. */
  private readonly devices = new Map<string, Set<string>>();

  /** Stores `challenge`, replacing one with the same id. */
  put(challenge: AppApprovalChallenge): Promise<void> {
    this.challenges.set(challenge.id, challenge);
    return Promise.resolve();
  }

  /** The challenge, or `undefined`. */
  get(id: string): Promise<AppApprovalChallenge | undefined> {
    return Promise.resolve(this.challenges.get(id));
  }

  /** The challenge with that QR token hash, or `undefined`. */
  byToken(tokenHash: string): Promise<AppApprovalChallenge | undefined> {
    return Promise.resolve(
      [...this.challenges.values()].find((challenge) => challenge.tokenHash === tokenHash),
    );
  }

  /** `principal`'s live pending challenges, newest first. */
  pending(principal: PublicId<"usr">, now: Date): Promise<readonly AppApprovalChallenge[]> {
    return Promise.resolve(
      [...this.challenges.values()]
        .filter(
          (challenge) =>
            challenge.principal === principal &&
            challenge.status === AppApprovalStatus.Pending &&
            challenge.expiresAt.getTime() > now.getTime(),
        )
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  /** How many were created since `since` matching `filter`. */
  countSince(
    filter: { readonly device?: string; readonly target?: string },
    since: Date,
  ): Promise<number> {
    let count = 0;
    for (const challenge of this.challenges.values())
      if (
        challenge.createdAt.getTime() >= since.getTime() &&
        (filter.device === undefined || challenge.requester.device === filter.device) &&
        (filter.target === undefined || challenge.target === filter.target)
      )
        count += 1;
    return Promise.resolve(count);
  }

  /** Expires the lapsed pending challenges. */
  expire(now: Date): Promise<number> {
    let count = 0;
    for (const challenge of this.challenges.values())
      if (
        challenge.status === AppApprovalStatus.Pending &&
        challenge.expiresAt.getTime() <= now.getTime()
      ) {
        this.challenges.set(challenge.id, { ...challenge, status: AppApprovalStatus.Expired });
        count += 1;
      }
    return Promise.resolve(count);
  }

  /** Binds `device` to `principal`. */
  bindDevice(principal: PublicId<"usr">, device: string): Promise<void> {
    const bound = this.devices.get(principal) ?? new Set<string>();
    bound.add(device);
    this.devices.set(principal, bound);
    return Promise.resolve();
  }

  /** Unbinds `device` from `principal`; false when it was not bound. */
  unbindDevice(principal: PublicId<"usr">, device: string): Promise<boolean> {
    return Promise.resolve(this.devices.get(principal)?.delete(device) ?? false);
  }

  /** Whether it is bound. */
  isBound(principal: PublicId<"usr">, device: string): Promise<boolean> {
    return Promise.resolve(this.devices.get(principal)?.has(device) ?? false);
  }
}
