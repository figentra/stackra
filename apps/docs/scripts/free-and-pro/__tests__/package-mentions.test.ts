/**
 * Stackra file contract:
 * Purpose: unit tests of `packageMentions`: package names in inline code are found with their line, an entry path is
 *          dropped, a scope wildcard and names outside inline code are skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0461; STA-2865.
 */
import { describe, expect, it } from "@stackra/testing";

import { packageMentions } from "../package-mentions";

describe("packageMentions", () => {
  it("finds each package in inline code with its line", () => {
    expect(
      packageMentions("Use `@stackra/ai`.\n\nThen `@stackra-pro/ai-studio` and `@stackra/search`."),
    ).toEqual([
      { name: "@stackra/ai", line: 1 },
      { name: "@stackra-pro/ai-studio", line: 3 },
      { name: "@stackra/search", line: 3 },
    ]);
  });

  it("drops an entry path", () => {
    expect(packageMentions("`@stackra/builder/react` hooks")).toEqual([
      { name: "@stackra/builder", line: 1 },
    ]);
  });

  it("skips a scope wildcard and names outside inline code", () => {
    expect(
      packageMentions(
        "The `@stackra/*` and `@stackra-pro/*` scopes; @stackra/ai in prose; [x](/adr/@stackra/ai)",
      ),
    ).toEqual([]);
  });
});
