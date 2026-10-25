/**
 * Stackra file contract:
 * Purpose: unit tests of `MembershipEntered`: an integration event named `membership.entered`, version 1 and no
 *          webhook, built frozen from its shipped schema, refusing a malformed segment id or model key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 4); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { MEMBERSHIP_CHANGE_SCHEMA } from "#core/constants/membership-change-schema.constant";
import { MembershipEntered } from "#core/events/membership-entered.event";

/** A valid payload. */
const values = {
  segmentId: "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"seg">,
  subjectModel: "commerce.customer",
  subjectId: "cus_01j9z3k4m5n6p7q8r9s0t1v2w4",
};

describe("MembershipEntered", () => {
  it("is the membership.entered integration event built frozen from its shipped schema", () => {
    const record = kindOf(MembershipEntered);
    expect(record?.kind).toBe("integration_event");
    expect(record?.options).toMatchObject({
      name: "membership.entered",
      version: 1,
      webhook: false,
    });
    expect(schemaOf(MembershipEntered)).toBe(MEMBERSHIP_CHANGE_SCHEMA);
    const event = MembershipEntered.create(values);
    expect(event).toBeInstanceOf(MembershipEntered);
    expect(event).toEqual(values);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("refuses a malformed segment id, model key or subject id", () => {
    expect(() =>
      MembershipEntered.create({ ...values, segmentId: "rset_1" as PublicId<"seg"> }),
    ).toThrow();
    expect(() => MembershipEntered.create({ ...values, subjectModel: "Customer" })).toThrow();
    expect(() => MembershipEntered.create({ ...values, subjectId: "" })).toThrow();
  });
});
