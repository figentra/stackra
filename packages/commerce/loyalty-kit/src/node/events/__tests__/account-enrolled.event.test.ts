/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountEnrolled`: an integration event named `account.enrolled` at version 1, built frozen
 *          with `create`, which refuses an account id of another prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19).
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { AccountEnrolled } from "#node/events/account-enrolled.event";

const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;

describe("AccountEnrolled", () => {
  it("is the account.enrolled integration event at version 1", () => {
    expect(kindOf(AccountEnrolled)?.kind).toBe("integration_event");
    expect(kindOf(AccountEnrolled)?.options).toMatchObject({
      name: "account.enrolled",
      version: 1,
    });
  });

  it("is built frozen and refuses another prefix", () => {
    const event = AccountEnrolled.create({
      accountId,
      memberId: "usr_1",
      tier: LoyaltyTier.Bronze,
    });
    expect(Object.isFrozen(event)).toBe(true);
    expect(event.tier).toBe(LoyaltyTier.Bronze);
    expect(() =>
      AccountEnrolled.create({
        accountId: "usr_1" as PublicId<"lac">,
        memberId: "usr_1",
        tier: LoyaltyTier.Bronze,
      }),
    ).toThrow();
  });
});
