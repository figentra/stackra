/**
 * Stackra file contract:
 * Purpose: unit tests of `mediaUrl`: one slash between the base and the path, each segment percent-encoded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { mediaUrl } from "#core/functions/media-url.function";

describe("mediaUrl", () => {
  it("joins the base and the encoded path with one slash", () => {
    expect(mediaUrl("https://cdn.test", "public/a.png")).toBe("https://cdn.test/public/a.png");
    expect(mediaUrl("https://cdn.test/files//", "public/a b#1.png")).toBe(
      "https://cdn.test/files/public/a%20b%231.png",
    );
  });
});
