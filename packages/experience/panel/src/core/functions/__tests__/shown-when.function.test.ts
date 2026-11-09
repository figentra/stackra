/**
 * Stackra file contract:
 * Purpose: unit tests of `shownWhen`: no path shows; a path shows only while its value is `true`, so a false, missing or
 *          non-boolean value hides.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the SDUI catalogue case `actionButton` (STA-1981).
 */
import { describe, expect, it } from "@stackra/testing";

import { shownWhen } from "#core/functions/shown-when.function";

describe("shownWhen", () => {
  it("shows without a predicate", () => {
    expect(shownWhen(undefined, undefined)).toBe(true);
  });

  it("shows only while the predicate is true", () => {
    expect(shownWhen("flags.isCancellable", { flags: { isCancellable: true } })).toBe(true);
    expect(shownWhen("flags.isCancellable", { flags: { isCancellable: false } })).toBe(false);
    expect(shownWhen("isCancellable", {})).toBe(false);
    expect(shownWhen("isCancellable", { isCancellable: "yes" })).toBe(false);
  });
});
