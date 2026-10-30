/**
 * Stackra file contract:
 * Purpose: unit tests of `actionFormKeys`: the record id alone, or only optional extras, opens no form; a required
 *          extra opens a form over every key but the id; a schema without a shape opens none.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { actionFormKeys } from "#core/functions/action-form-keys.function";

describe("actionFormKeys", () => {
  it("opens no form when the record id is all the action needs", () => {
    expect(actionFormKeys(z.object({ reviewId: z.string() }), "reviewId")).toEqual([]);
  });

  it("opens no form when the other fields are optional or defaulted", () => {
    const input = z.object({
      reviewId: z.string(),
      note: z.string().optional(),
      notify: z.boolean().default(true),
    });
    expect(actionFormKeys(input, "reviewId")).toEqual([]);
  });

  it("asks for every key but the id once one of them is required", () => {
    const input = z.object({
      reviewId: z.string(),
      decision: z.enum(["approve", "reject"]),
      note: z.string().optional(),
      reason: z.string().nullable(),
    });
    expect(actionFormKeys(input, "reviewId")).toEqual(["decision", "note", "reason"]);
  });

  it("opens no form for a schema without a shape", () => {
    expect(actionFormKeys(undefined, "id")).toEqual([]);
    expect(actionFormKeys(z.string(), "id")).toEqual([]);
  });
});
