/**
 * Stackra file contract:
 * Purpose: `LoyaltyMembersFake`, a `LoyaltyMembers` fake for hosts' tests: everyone in `ids` is a member; records every
 *          call for assertions.
 * Boundary: built on the generic `Fake` base of @stackra/testing (call recording); the port it fakes is this package's
 *           abstract class, which is why the fake lives here and not in @stackra/testing (ADR 0269).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0266 (decision 2: a fake per capability); ADR 0269.
 */
import { Fake } from "@stackra/testing";

import { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Answers `isMember` from a fixed set; `calls("isMember")` lists what was asked. The shorthand is the static `with`.
 *
 * @example
 * createTestingModule(LoyaltyKitModule).override(LoyaltyMembers, LoyaltyMembersFake.with(["usr_1"]));
 */
export class LoyaltyMembersFake extends Fake.of(LoyaltyMembers) {
  /** Principal public ids treated as enrolled. */
  private readonly ids: ReadonlySet<string>;

  /**
   * @param ids - principal public ids treated as enrolled.
   */
  constructor(ids: ReadonlySet<string>) {
    super();
    this.ids = ids;
  }

  /** Shorthand for `new LoyaltyMembersFake(new Set(ids))`. */
  static with(ids: readonly string[]): LoyaltyMembersFake {
    return new LoyaltyMembersFake(new Set(ids));
  }

  /** Recorded, then answered from `ids`. */
  async isMember(principalId: MemberId): Promise<boolean> {
    this.record("isMember", principalId);
    return this.ids.has(principalId);
  }
}
