/**
 * Stackra file contract:
 * Purpose: unit tests of `IntegrationCategory`: the marketplace shelves, with the `email` code the template's
 *          integration uses, all snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IntegrationCategory } from "#core/enums/integration-category.enum";

describe("IntegrationCategory", () => {
  it("has the email shelf the template lists Resend under", () => {
    expect(IntegrationCategory.Email).toBe("email");
  });

  it("keeps every code snake_case and unique", () => {
    const codes = Enum.values(IntegrationCategory);
    expect(codes.every((code) => /^[a-z]+(?:_[a-z]+)*$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
