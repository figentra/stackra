/**
 * Stackra file contract:
 * Purpose: unit tests of `toVisualOrder`: right-to-left runs reversed, numbers kept left to right, neutrals resolved,
 *          brackets mirrored, and left-to-right lines with an embedded right-to-left run.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { toVisualOrder } from "#core/functions/to-visual-order.function";

describe("toVisualOrder", () => {
  it("reverses a right-to-left line and keeps numbers in order", () => {
    expect(toVisualOrder("رقم 12", "rtl")).toBe("12 مقر");
    expect(toVisualOrder("abc", "rtl")).toBe("abc");
  });

  it("mirrors brackets inside right-to-left runs", () => {
    expect(toVisualOrder("(ب)", "rtl")).toBe("(ب)");
    expect(toVisualOrder("أ (ب)", "rtl")).toBe("(ب) أ");
  });

  it("embeds a right-to-left run in a left-to-right line", () => {
    expect(toVisualOrder("Name: علي", "ltr")).toBe("Name: يلع");
    expect(toVisualOrder("plain", "ltr")).toBe("plain");
  });
});
