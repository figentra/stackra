/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardGranted`: an integration event named `award.granted`, version 1 and no webhook, built
 *          frozen from its shipped schema, refusing a malformed award id, model key or empty level.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 7); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AWARD_GRANTED_SCHEMA } from "#core/constants/award-granted-schema.constant";
import { AwardGranted } from "#core/events/award-granted.event";

/** A valid payload. */
const values = {
  awardId: "awd_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awd">,
  kindId: "awk_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awk">,
  recipientModel: "workforce.member",
  recipientId: "mem_01j9z3k4m5n6p7q8r9s0t1v2w4",
  level: "blue",
  period: null,
};

describe("AwardGranted", () => {
  it("is the award.granted integration event built frozen from its shipped schema", () => {
    const record = kindOf(AwardGranted);
    expect(record?.kind).toBe("integration_event");
    expect(record?.options).toMatchObject({ name: "award.granted", version: 1, webhook: false });
    expect(schemaOf(AwardGranted)).toBe(AWARD_GRANTED_SCHEMA);
    const event = AwardGranted.create(values);
    expect(event).toBeInstanceOf(AwardGranted);
    expect(event).toEqual(values);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("refuses a malformed award id, model key or empty level", () => {
    expect(() => AwardGranted.create({ ...values, awardId: "seg_1" as PublicId<"awd"> })).toThrow();
    expect(() => AwardGranted.create({ ...values, recipientModel: "Member" })).toThrow();
    expect(() => AwardGranted.create({ ...values, level: "" })).toThrow();
  });
});
