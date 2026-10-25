/**
 * Stackra file contract:
 * Purpose: unit tests of `demoteHeadings`: ATX headings move down, capped at six; fenced code and non-headings stay.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { demoteHeadings } from "#core/functions/demote-headings.function";

describe("demoteHeadings", () => {
  it("pushes every heading down by the levels given", () => {
    expect(demoteHeadings("# Versions\n\nText\n\n## Rules\n", 2)).toBe(
      "### Versions\n\nText\n\n#### Rules\n",
    );
  });

  it("caps a heading at level six", () => {
    expect(demoteHeadings("##### Deep", 2)).toBe("###### Deep");
  });

  it("leaves hashes that are not headings alone", () => {
    expect(demoteHeadings("#hashtag and # inline", 2)).toBe("#hashtag and # inline");
  });

  it("leaves fenced code alone, for backtick and tilde fences", () => {
    const text = "```bash\n# a comment\n```\n~~~~\n# another\n```\n# still code\n~~~~\n# Heading";
    expect(demoteHeadings(text, 1)).toBe(
      "```bash\n# a comment\n```\n~~~~\n# another\n```\n# still code\n~~~~\n## Heading",
    );
  });
});
