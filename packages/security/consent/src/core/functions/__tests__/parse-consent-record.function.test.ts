/**
 * Stackra file contract:
 * Purpose: unit tests of `parseConsentRecord`: JSON text and a parsed value both give the record, and anything else
 *          (bad JSON, the wrong shape, nothing) gives `null` without throwing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decisions 1 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseConsentRecord } from "#core/functions/parse-consent-record.function";

/** A valid stored decision. */
const RECORD = {
  policyVersion: "1",
  decidedAt: "2026-10-24T09:00:00.000Z",
  categories: { analytics: true },
};

describe("parseConsentRecord", () => {
  it("reads JSON text", () => {
    expect(parseConsentRecord(JSON.stringify(RECORD))).toEqual(RECORD);
  });

  it("reads a parsed value", () => {
    expect(parseConsentRecord(RECORD)).toEqual(RECORD);
  });

  it.each([
    ["bad JSON", "{not json"],
    ["JSON of another shape", '{"granted":true}'],
    ["undefined", undefined],
    ["null", null],
    ["a number", 42],
  ])("answers null for %s", (_case, value) => {
    expect(parseConsentRecord(value)).toBeNull();
  });
});
