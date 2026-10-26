/**
 * Stackra file contract:
 * Purpose: `MemoryPublisherAccessDriver`, the in-process `PublisherAccess` driver: it answers from grants held in
 *          memory, given per publisher and block, and taken back with `revoke`.
 * Boundary: fail closed: a publisher holds no block until `grant` gives it one, in every scope. For tests and
 *           single-process tools only; a service binds @stackra/iam's driver, which reads the real grants.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0423 (decision 1).
 */
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";

import { PublisherAccess } from "#core/ports/publisher-access.port";

/**
 * Grants held in memory.
 *
 * @example
 * const access = new MemoryPublisherAccessDriver();
 * access.grant("usr_01j9z3k4m5n6p7q8r9s0t1v2w3", ["sms.send"]);
 */
export class MemoryPublisherAccessDriver extends Driver(PublisherAccess) {
  /** Block keys by publisher id. */
  private readonly grants = new Map<string, Set<string>>();

  /** Gives `publisherId` every block of `blocks`. */
  grant(publisherId: string, blocks: readonly string[]): void {
    const held = this.grants.get(publisherId) ?? new Set<string>();
    for (const block of blocks) held.add(block);
    this.grants.set(publisherId, held);
  }

  /** Takes `blocks` back from `publisherId`; every block when left out. */
  revoke(publisherId: string, blocks?: readonly string[]): void {
    if (blocks === undefined) this.grants.delete(publisherId);
    else for (const block of blocks) this.grants.get(publisherId)?.delete(block);
  }

  /** See `PublisherAccess.missing`. */
  missing(
    publisher: Actor,
    _scope: ScopeRef,
    blocks: readonly string[],
  ): Promise<readonly string[]> {
    const held = this.grants.get(publisher.id);
    return Promise.resolve(blocks.filter((block) => held?.has(block) !== true));
  }
}
