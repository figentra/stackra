/**
 * Stackra file contract:
 * Purpose: unit tests of `isRelativePath`: nested relative paths pass; empty, absolute, `.`/`..`, empty-segment,
 *          backslash and NUL paths fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0234.
 */
import { describe, expect, it } from "@stackra/testing";

import { isRelativePath } from "#core/functions/is-relative-path.function";

describe("isRelativePath", () => {
  it("accepts relative paths with real segments", () => {
    expect(isRelativePath("logo.svg")).toBe(true);
    expect(isRelativePath("assets/public/orders/logo.svg")).toBe(true);
    expect(isRelativePath("explain-order.eval.json")).toBe(true);
  });

  it("refuses paths that are empty, absolute or leave their folder", () => {
    for (const path of [
      "",
      "/logo.svg",
      "a//b.svg",
      "a/",
      "./a.svg",
      "a/./b.svg",
      "../a.svg",
      "a/../../b.svg",
    ])
      expect(isRelativePath(path), path).toBe(false);
  });

  it("refuses backslashes and NUL characters", () => {
    expect(isRelativePath("a\\b.svg")).toBe(false);
    expect(isRelativePath("a\0.svg")).toBe(false);
  });
});
