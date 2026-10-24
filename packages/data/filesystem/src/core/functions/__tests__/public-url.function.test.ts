/**
 * Stackra file contract:
 * Purpose: unit tests of `publicUrl`: base plus one `/` plus the encoded key, and an error when the disk has no base.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { publicUrl } from "#core/functions/public-url.function";

describe("publicUrl", () => {
  it("joins the base and the key with one slash", () => {
    expect(publicUrl("https://cdn.test/files", "a/b.png")).toBe("https://cdn.test/files/a/b.png");
    expect(publicUrl("https://cdn.test/files//", "/a/b.png")).toBe(
      "https://cdn.test/files/a/b.png",
    );
  });

  it("encodes each segment, never the separators", () => {
    expect(publicUrl("https://cdn.test", "a b/c#1?.png")).toBe(
      "https://cdn.test/a%20b/c%231%3F.png",
    );
  });

  it("refuses a disk without a public URL", () => {
    expect(() => publicUrl(null, "a.png")).toThrow(/filesystem\.url/);
  });

  it("refuses a key outside the disk", () => {
    expect(() => publicUrl("https://cdn.test", "../a.png")).toThrow(RangeError);
  });
});
