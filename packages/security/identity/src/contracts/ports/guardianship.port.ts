/**
 * Stackra file contract:
 * Purpose: the `Guardianship` port: the guardian link between two principals, as the parties service keeps it.
 * Boundary: an abstract class that is its own token. The OS parties service implements it; a guardian claim and its
 *           checks are that service's workflow. An unreachable source throws, so acting for a minor fails closed.
 * Runtime: isomorphic
 * Governing contract: OS-284; ADR 0361 (decision 3); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { GuardianLink } from "#contracts/types/guardian-link.type";

/**
 * Reads guardian links.
 *
 * @example
 * const link = await guardianship.link(parent.id, child.id);
 */
export abstract class Guardianship extends Port {
  /**
   * The link from `guardian` to `minor`, or `undefined`.
   *
   * @throws Error when the source cannot be reached.
   */
  abstract link(guardian: PublicId, minor: PublicId): Promise<GuardianLink | undefined>;
}
