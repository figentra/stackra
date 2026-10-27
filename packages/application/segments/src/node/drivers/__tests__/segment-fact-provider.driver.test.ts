/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentFactProviderDriver`: it is a `FactProvider` of `SEGMENT_FACTS`, answers the subject's
 *          segment ids from the membership service, and through `factsFrom` a rule on `segments.ids` matches a member
 *          and not a non-member.
 * Boundary: test only; the membership service is an in-test stand-in recording every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 4); ADR 0462 (decision 1).
 */
import { evaluate, FactProvider, factsFrom, Rules } from "@stackra/rules";
import { Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { SegmentRef, SubjectRef } from "#contracts/index";
import { SEGMENT_FACTS } from "#core/index";
import { SegmentFactProviderDriver } from "#node/drivers/segment-fact-provider.driver";
import type { SegmentMembershipService } from "#node/services/segment-membership.service";

const VIP: SegmentRef = { kind: "segment", id: "seg_01j9z3k4m5n6p7q8r9s0t1v2v1" };
const ANN: SubjectRef = { model: "commerce.customer", id: "cus_01j9z3k4m5n6p7q8r9s0t1v2a1" };
const BOB: SubjectRef = { model: "commerce.customer", id: "cus_01j9z3k4m5n6p7q8r9s0t1v2b1" };

/** A driver over a membership stand-in where only Ann is a VIP; `asked` records every call's arguments. */
function driverOver(): { driver: SegmentFactProviderDriver; asked: unknown[][] } {
  const asked: unknown[][] = [];
  const memberships = {
    segmentsOf: (...args: [SubjectRef]) => {
      asked.push(args);
      return Promise.resolve(args[0].id === ANN.id ? [VIP] : []);
    },
  } as unknown as SegmentMembershipService;
  return { driver: new SegmentFactProviderDriver(memberships), asked };
}

describe("SegmentFactProviderDriver", () => {
  it("is a FactProvider of SEGMENT_FACTS", () => {
    const { driver } = driverOver();
    expect(driver).toBeInstanceOf(FactProvider);
    expect(driver.source).toBe(SEGMENT_FACTS);
  });

  it("answers the subject's segment ids", async () => {
    const { driver, asked } = driverOver();
    expect(await driver.factsOf(ANN)).toEqual({ ids: [VIP.id] });
    expect(await driver.factsOf(BOB)).toEqual({ ids: [] });
    expect(asked).toEqual([[ANN], [BOB]]);
  });

  it("lets a business rule target the segment through the rules engine", async () => {
    const { driver } = driverOver();
    const rules = Rules.create({ key: "orders.cancel", sources: [SEGMENT_FACTS] });
    const inVip = rules.check({
      field: "segments.ids",
      operator: Operator.Includes,
      value: VIP.id,
    });
    const now = new Date("2026-10-28T09:00:00Z");
    expect(evaluate(rules, inVip, await factsFrom([driver], ANN), { now }).matched).toBe(true);
    expect(evaluate(rules, inVip, await factsFrom([driver], BOB), { now }).matched).toBe(false);
  });
});
