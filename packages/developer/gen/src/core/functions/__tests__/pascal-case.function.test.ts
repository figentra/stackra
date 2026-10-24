/**
 * Stackra file contract:
 * Purpose: unit tests of `pascalCase`, which names the generated `<Key>Module`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { pascalCase } from "#core/functions/pascal-case.function";

describe("pascalCase", () => {
  it("converts keys to class names", () => {
    expect(pascalCase("loyalty_kit")).toBe("LoyaltyKit");
    expect(pascalCase("commerce")).toBe("Commerce");
    expect(pascalCase("access-log")).toBe("AccessLog");
  });
});
