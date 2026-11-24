/**
 * Stackra file contract:
 * Purpose: unit tests of `expect`: the e2e assertion function extends Playwright's with `toHaveNoViolations`, which answers what
 *          `noViolations` decides (serious and critical impact block) and carries its own name.
 * Boundary: test only; Playwright's `expect.extend` hands back the matchers it was given.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { expect as e2eExpect } from "#e2e/expect/expect.constant";

vi.mock("@playwright/test", () => ({ expect: { extend: (matchers: object) => matchers } }));

const matcher = e2eExpect as unknown as {
  toHaveNoViolations: (report: unknown) => { pass: boolean; message: () => string; name: string };
};

describe("expect", () => {
  it("adds toHaveNoViolations, which passes a report without a blocking violation", () => {
    const result = matcher.toHaveNoViolations({
      violations: [{ id: "region", impact: "minor", help: "x", nodes: [{}] }],
    });
    expect(result.name).toBe("toHaveNoViolations");
    expect(result.pass).toBe(true);
  });

  it("fails a report with a serious violation, and the message names the rule", () => {
    const result = matcher.toHaveNoViolations({
      violations: [
        {
          id: "color-contrast",
          impact: "serious",
          help: "Elements must meet contrast",
          nodes: [{}],
        },
      ],
    });
    expect(result.name).toBe("toHaveNoViolations");
    expect(result.pass).toBe(false);
    expect(result.message()).toContain(
      "color-contrast (serious, 1 nodes): Elements must meet contrast",
    );
  });
});
