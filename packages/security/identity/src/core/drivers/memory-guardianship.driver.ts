/**
 * Stackra file contract:
 * Purpose: `MemoryGuardianshipDriver`, a `Guardianship` over links held in memory, for tests and local runs.
 * Boundary: process-local; never a production source (the OS parties service is). Holds no link until `seed`, so the
 *           container builds it with no arguments.
 * Runtime: isomorphic
 * Governing contract: OS-284; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { Guardianship } from "#contracts/index";
import type { GuardianLink } from "#contracts/index";

/**
 * Guardian links held in memory.
 *
 * @example
 * const guardianship = new MemoryGuardianshipDriver().seed([
 *   { guardian, minor, relationship: "parent", restrictions: [] },
 * ]);
 */
export class MemoryGuardianshipDriver extends Driver(Guardianship) {
  /** The links. */
  private links: readonly GuardianLink[] = [];

  /**
   * Sets the links this source knows, replacing any before.
   *
   * @returns this source, to chain.
   */
  seed(links: readonly GuardianLink[]): this {
    this.links = [...links];
    return this;
  }

  /** The link from `guardian` to `minor`, or `undefined`. */
  link(guardian: PublicId, minor: PublicId): Promise<GuardianLink | undefined> {
    return Promise.resolve(
      this.links.find((link) => link.guardian === guardian && link.minor === minor),
    );
  }
}
