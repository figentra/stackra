/**
 * Stackra file contract:
 * Purpose: unit tests of `isScopePath`: dotted lowercase labels pass; an empty value, an empty label, a capital, a
 *          hyphen, an `lquery` wildcard, a space, an over-long label and an over-long path are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 7); `.agents/rules/tenancy.md` (point 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { isScopePath } from "#core/functions/is-scope-path.function";

describe(isScopePath, () => {
  it.each(["platform", "platform.acme", "platform.acme.shop_eu", "p.0.x_1"])(
    "accepts %s",
    (value) => {
      expect(isScopePath(value)).toBe(true);
    },
  );

  it.each([
    "",
    "platform.",
    ".platform",
    "platform..acme",
    "Platform",
    "platform.acme-eu",
    "platform.*",
    "platform acme",
    "a".repeat(64),
    Array.from({ length: 40 }, () => "a".repeat(60)).join("."),
  ])("refuses %s", (value) => {
    expect(isScopePath(value)).toBe(false);
  });
});
