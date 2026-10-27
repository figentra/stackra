/**
 * Stackra file contract:
 * Purpose: unit tests of `escapeHtml`: the five markup characters become entities, other text is unchanged, and
 *          `null` and `undefined` are empty.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0440; ADR 0110 (decision 4); stackra-224 (moved from experience).
 */
import { describe, expect, it } from "@stackra/testing";

import { escapeHtml } from "#core/functions/escape-html.function";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });

  it("keeps plain text and stringifies values", () => {
    expect(escapeHtml("بع عبر الإنترنت")).toBe("بع عبر الإنترنت");
    expect(escapeHtml(3)).toBe("3");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
