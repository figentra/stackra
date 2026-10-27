/**
 * Stackra file contract:
 * Purpose: unit tests of `kebabCase`, the URL segment and file stem form, which agrees with `snakeCase` on breaks.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (URL paths are kebab-case); stackra-224
 *                     (moved from gen).
 */
import { describe, expect, it } from "@stackra/testing";

import { kebabCase } from "#core/functions/kebab-case.function";

describe("kebabCase", () => {
  it("converts names to kebab-case", () => {
    expect(kebabCase("attach_image")).toBe("attach-image");
    expect(kebabCase("LoyaltyLedger")).toBe("loyalty-ledger");
    expect(kebabCase("orders")).toBe("orders");
  });
});
