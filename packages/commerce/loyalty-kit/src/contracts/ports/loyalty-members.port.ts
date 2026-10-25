/**
 * Stackra file contract:
 * Purpose: `LoyaltyMembers`, the port of who may redeem: the kit asks the question, the host answers it from its own
 *          customer data, so the kit never imports the host.
 * Boundary: an abstract class that is its own token, key `loyalty_kit.LoyaltyMembers`. The kit ships no driver for it:
 *           a host writes one in its own `drivers/` folder, which is the port's only candidate, so no config field
 *           selects it, and gen fails the host's build when none exists (unresolved port). Earning does not ask: the
 *           first earn enrolls. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0260 (decision 9: a package needing host data defines a
 *                     port); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Answers membership questions the kit cannot answer itself.
 *
 * @example
 * export class CommerceLoyaltyMembersDriver extends Driver(LoyaltyMembers) {
 *   async isMember(principalId: MemberId): Promise<boolean> { … }
 * }
 */
export abstract class LoyaltyMembers extends Port {
  /** Type-only port key; the host's driver is the one candidate. */
  declare readonly "~key": "loyalty_kit.LoyaltyMembers";

  /** Whether this principal may take part; a redemption by a non-member is refused. */
  abstract isMember(principalId: MemberId): Promise<boolean>;
}
