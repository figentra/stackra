/**
 * Stackra file contract:
 * Purpose: unit tests of `MembershipLeft`: an integration event named `membership.left`, version 1 and no webhook,
 *          built frozen from the same shipped schema as `MembershipEntered`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 4); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { MEMBERSHIP_CHANGE_SCHEMA } from "#core/constants/membership-change-schema.constant";
import { MembershipLeft } from "#core/events/membership-left.event";

/** A valid payload. */
const values = {
  segmentId: "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"seg">,
  subjectModel: "identity.user",
  subjectId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w4",
};

describe("MembershipLeft", () => {
  it("is the membership.left integration event built frozen from its shipped schema", () => {
    const record = kindOf(MembershipLeft);
    expect(record?.kind).toBe("integration_event");
    expect(record?.options).toMatchObject({ name: "membership.left", version: 1, webhook: false });
    expect(schemaOf(MembershipLeft)).toBe(MEMBERSHIP_CHANGE_SCHEMA);
    const event = MembershipLeft.create(values);
    expect(event).toBeInstanceOf(MembershipLeft);
    expect(event).toEqual(values);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("refuses a subject id longer than a public id", () => {
    expect(() => MembershipLeft.create({ ...values, subjectId: "x".repeat(34) })).toThrow();
  });
});
