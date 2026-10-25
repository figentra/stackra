/**
 * Stackra file contract:
 * Purpose: unit tests of `escapeHtml`: the five characters HTML gives meaning to.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { escapeHtml } from "#core/functions/escape-html.function";

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });
});
