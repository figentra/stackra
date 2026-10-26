/**
 * Stackra file contract:
 * Purpose: unit tests of `newAwardCode`: three groups of four alphabet characters that normalise to themselves, and two
 *          calls differ.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0432 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeAwardCode } from "#core/functions/normalize-award-code.function";
import { newAwardCode } from "#node/functions/new-award-code.function";

describe(newAwardCode, () => {
  it("prints three groups of four code characters", () => {
    const code = newAwardCode();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(normalizeAwardCode(code)).toBe(code.replace(/-/g, ""));
    expect(newAwardCode()).not.toBe(code);
  });
});
