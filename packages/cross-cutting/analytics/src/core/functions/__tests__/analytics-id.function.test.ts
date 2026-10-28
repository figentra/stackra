/**
 * Stackra file contract:
 * Purpose: unit tests of `analyticsId`: the prefix and 26 Crockford base32 characters, the time part sorting with the
 *          clock, distinct ids within one millisecond, and the `Math.random` fallback where Web Crypto is absent.
 * Boundary: test only; freezes the clock and stubs the global crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298 (decision 5).
 */
import { afterEach, describe, expect, freezeClock, it } from "@stackra/testing";
import { vi } from "vitest";

import { analyticsId } from "#core/functions/analytics-id.function";

const SHAPE = /^evt_[0-9a-hjkmnp-tv-z]{26}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analyticsId", () => {
  it("is the prefix and 26 Crockford base32 characters", () => {
    expect(analyticsId("evt_")).toMatch(SHAPE);
    expect(analyticsId("ses_")).toMatch(/^ses_/);
  });

  it("sorts by capture time", () => {
    freezeClock("2026-10-28T09:00:00Z");
    const earlier = analyticsId("evt_");
    freezeClock("2026-10-28T09:00:01Z");
    const later = analyticsId("evt_");
    expect(earlier.slice(0, 14) < later.slice(0, 14)).toBe(true);
  });

  it("makes distinct ids in one millisecond", () => {
    freezeClock("2026-10-28T09:00:00Z");
    expect(analyticsId("evt_")).not.toBe(analyticsId("evt_"));
  });

  it("falls back to Math.random without Web Crypto", () => {
    vi.stubGlobal("crypto", undefined);
    expect(analyticsId("evt_")).toMatch(SHAPE);
  });
});
