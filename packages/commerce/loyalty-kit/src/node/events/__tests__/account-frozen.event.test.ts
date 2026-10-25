/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountFrozen`: an integration event named `account.frozen` carrying the flag after the
 *          change.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19).
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AccountFrozen } from "#node/events/account-frozen.event";

describe("AccountFrozen", () => {
  it("is the account.frozen integration event carrying the new flag", () => {
    expect(kindOf(AccountFrozen)?.options).toMatchObject({ name: "account.frozen", version: 1 });
    const event = AccountFrozen.create({
      accountId: "lac_01ja0000000000000000000011" as PublicId<"lac">,
      memberId: "usr_1",
      isFrozen: true,
    });
    expect(event.isFrozen).toBe(true);
  });
});
