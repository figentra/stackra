/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardRevoked`: an integration event named `award.revoked`, version 1 and no webhook, built
 *          frozen from its shipped schema, refusing a malformed kind id or an empty recipient id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 7); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AWARD_REVOKED_SCHEMA } from "#core/constants/award-revoked-schema.constant";
import { AwardRevoked } from "#core/events/award-revoked.event";

/** A valid payload. */
const values = {
  awardId: "awd_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awd">,
  kindId: "awk_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awk">,
  recipientModel: "workforce.member",
  recipientId: "mem_01j9z3k4m5n6p7q8r9s0t1v2w4",
};

describe("AwardRevoked", () => {
  it("is the award.revoked integration event built frozen from its shipped schema", () => {
    const record = kindOf(AwardRevoked);
    expect(record?.kind).toBe("integration_event");
    expect(record?.options).toMatchObject({ name: "award.revoked", version: 1, webhook: false });
    expect(schemaOf(AwardRevoked)).toBe(AWARD_REVOKED_SCHEMA);
    const event = AwardRevoked.create(values);
    expect(event).toEqual(values);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("refuses a malformed kind id or an empty recipient id", () => {
    expect(() => AwardRevoked.create({ ...values, kindId: "rset_1" as PublicId<"awk"> })).toThrow();
    expect(() => AwardRevoked.create({ ...values, recipientId: "" })).toThrow();
  });
});
