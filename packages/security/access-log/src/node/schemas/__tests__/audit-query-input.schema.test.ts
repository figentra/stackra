/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditQueryInput`: a cursor page input whose filters are all optional, whose cursor is a
 *          positive sequence and whose dates are read from text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { CursorInput, validate } from "@stackra/validation";

import { AuditQueryInput } from "#node/schemas/audit-query-input.schema";

describe("AuditQueryInput", () => {
  it("is a cursor input with no required filter", () => {
    const input = AuditQueryInput.create({ limit: 20 });
    expect(input).toBeInstanceOf(CursorInput);
    expect(input.callId).toBeUndefined();
  });

  it("reads a cursor and dates from text and refuses a bad cursor or outcome", () => {
    const parsed = validate(AuditQueryInput, { cursor: "41", from: "2026-10-01T00:00:00Z" });
    expect(parsed.success).toBe(true);
    expect(validate(AuditQueryInput, { cursor: "0" }).success).toBe(false);
    expect(validate(AuditQueryInput, { cursor: "abc" }).success).toBe(false);
    expect(validate(AuditQueryInput, { outcome: "maybe" }).success).toBe(false);
  });
});
