/**
 * Stackra file contract:
 * Purpose: unit tests of `EarnVisitInput`: it holds the principal and the visit reference, and refuses an empty or
 *          over-long reference.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { EarnVisitInput } from "#node/schemas/earn-visit-input.schema";

describe("EarnVisitInput", () => {
  it("holds the principal and the visit", () => {
    expect({ ...EarnVisitInput.create({ principalId: "usr_1", reference: "apt_42" }) }).toEqual({
      principalId: "usr_1",
      reference: "apt_42",
    });
  });

  it("refuses an empty principal and a bad reference", () => {
    const schema = schemaOf(EarnVisitInput);
    expect(schema.safeParse({ principalId: "", reference: "apt_1" }).success).toBe(false);
    expect(schema.safeParse({ principalId: "usr_1", reference: "" }).success).toBe(false);
    expect(schema.safeParse({ principalId: "usr_1", reference: "x".repeat(129) }).success).toBe(
      false,
    );
  });
});
