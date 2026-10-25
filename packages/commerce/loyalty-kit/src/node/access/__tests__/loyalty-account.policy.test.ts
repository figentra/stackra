/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccountPolicy`: a frozen account denies every redeemer, a customer (or anyone acting
 *          for one) sees only their own account, and a deleted account cannot be frozen.
 * Boundary: test only; the policy is constructed directly and called with unsaved factory records (`make`); actors
 *           come from @stackra/iam/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0132 (decision 4); ADR 0294 (decision 16).
 */
import { kindOf } from "@stackra/container";
import { registerModelPartners } from "@stackra/database";
import { Decision } from "@stackra/iam";
import { actors } from "@stackra/iam/testing";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyAccountPolicy } from "#node/access/loyalty-account.policy";
import { LoyaltyAccountFactory } from "#node/database/factories/loyalty-account.factory";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";

registerModelPartners([[LoyaltyAccountFactory, LoyaltyAccount]]);

/** The customer whose account the cases judge. */
const OWNER = "usr_01ja0000000000000000000001";

/** Another customer. */
const STRANGER = "usr_01ja0000000000000000000002";

describe("LoyaltyAccountPolicy", () => {
  const policy = new LoyaltyAccountPolicy();

  it("is a policy", () => {
    expect(kindOf(LoyaltyAccountPolicy)?.kind).toBe("policy");
  });

  it("denies redemption from a frozen account, whoever asks", () => {
    const frozen = LoyaltyAccountFactory.new().frozen().make({ memberId: OWNER });
    expect(policy.redeem(actors.staff(), frozen)).toBe(Decision.Deny);
    expect(policy.redeem(actors.customer(OWNER), frozen)).toBe(Decision.Deny);
  });

  it("lets a customer act only on their own account", () => {
    const own = LoyaltyAccountFactory.new().make({ memberId: OWNER });
    expect(policy.read(actors.customer(OWNER), own)).toBe(Decision.Abstain);
    expect(policy.read(actors.customer(STRANGER), own)).toBe(Decision.Deny);
    expect(policy.redeem(actors.customer(OWNER), own)).toBe(Decision.Abstain);
    expect(policy.read(actors.staff(), own)).toBe(Decision.Abstain);
  });

  it("holds a service acting for a customer to that customer", () => {
    const own = LoyaltyAccountFactory.new().make({ memberId: OWNER });
    const forStranger = actors.service("checkout", { onBehalfOf: actors.customer(STRANGER) });
    expect(policy.redeem(forStranger, own)).toBe(Decision.Deny);
  });

  it("refuses to freeze a deleted account and leaves a live one to the permission", () => {
    const live = LoyaltyAccountFactory.new().make();
    const deleted = LoyaltyAccountFactory.new().make({
      deletedAt: new Date("2026-10-01T00:00:00Z"),
    });
    expect(policy.freeze(actors.staff(), live)).toBe(Decision.Abstain);
    expect(policy.freeze(actors.staff(), deleted)).toBe(Decision.Deny);
  });
});
