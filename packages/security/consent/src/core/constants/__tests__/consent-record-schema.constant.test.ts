/**
 * Stackra file contract:
 * Purpose: unit tests of `CONSENT_RECORD_SCHEMA`: a stored decision parses, unknown keys are dropped, and a record
 *          missing a field, with a bad instant or a non-boolean choice is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CONSENT_RECORD_SCHEMA } from "#core/constants/consent-record-schema.constant";

/** A valid stored decision. */
const RECORD = {
  policyVersion: "2026-10",
  decidedAt: "2026-10-24T09:00:00.000Z",
  categories: { analytics: true, crash_replay: false },
};

describe("CONSENT_RECORD_SCHEMA", () => {
  it("parses a stored decision and drops unknown keys", () => {
    expect(CONSENT_RECORD_SCHEMA.parse({ ...RECORD, extra: 1 })).toEqual(RECORD);
  });

  it("accepts an instant with an offset", () => {
    expect(
      CONSENT_RECORD_SCHEMA.safeParse({ ...RECORD, decidedAt: "2026-10-24T12:00:00+03:00" })
        .success,
    ).toBe(true);
  });

  it.each([
    ["no policy version", { decidedAt: RECORD.decidedAt, categories: {} }],
    ["an empty policy version", { ...RECORD, policyVersion: "" }],
    ["a date that is not an instant", { ...RECORD, decidedAt: "yesterday" }],
    ["a choice that is not a boolean", { ...RECORD, categories: { analytics: "yes" } }],
    ["no categories", { policyVersion: "1", decidedAt: RECORD.decidedAt }],
  ])("refuses %s", (_case, value) => {
    expect(CONSENT_RECORD_SCHEMA.safeParse(value).success).toBe(false);
  });
});
