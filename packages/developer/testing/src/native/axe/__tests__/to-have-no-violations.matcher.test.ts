/**
 * Stackra file contract:
 * Purpose: unit tests of `toHaveNoViolations`: it passes an empty result, fails one with violations listing each rule
 *          and message, and `.not` inverts it.
 * Boundary: test only; the results are written by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decisions 3 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { AxeResult } from "#native/axe/axe-result.type";
import { toHaveNoViolations } from "#native/axe/to-have-no-violations.matcher";

const CLEAN: AxeResult = { violations: [] };
const DIRTY: AxeResult = {
  violations: [
    {
      rule: "image-alt",
      message: "Image has no accessibilityLabel, aria-label or alt",
      node: { type: "Image", props: {}, children: [] },
    },
  ],
};

describe(toHaveNoViolations, () => {
  it("is registered under its name", () => {
    expect(toHaveNoViolations.name).toBe("toHaveNoViolations");
  });

  it("passes a result without violations and .not inverts it", () => {
    expect(CLEAN).toHaveNoViolations();
    expect(DIRTY).not.toHaveNoViolations();
  });

  it("fails with each violation's rule and message", () => {
    expect(() => expect(DIRTY).toHaveNoViolations()).toThrow(
      "- image-alt: Image has no accessibilityLabel, aria-label or alt",
    );
  });
});
