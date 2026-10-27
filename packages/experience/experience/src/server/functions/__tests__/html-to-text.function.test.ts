/**
 * Stackra file contract:
 * Purpose: unit tests of `htmlToText`: block ends and `<br>` become line breaks, links keep their address, the head is
 *          dropped and escaped entities are read back.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { htmlToText } from "#server/functions/html-to-text.function";

describe("htmlToText", () => {
  it("writes the text of a rendered email", () => {
    expect(
      htmlToText(
        "<html><head><title>Subject</title></head><body><h1>A &amp; B</h1><p>Line<br>two</p>" +
          '<a href="https://x.test/t">Track</a></body></html>',
      ),
    ).toBe("A & B\nLine\ntwo\nTrack (https://x.test/t)");
  });
});
