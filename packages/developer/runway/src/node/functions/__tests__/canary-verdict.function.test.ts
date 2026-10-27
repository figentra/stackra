/**
 * Stackra file contract:
 * Purpose: unit tests of `canaryVerdict`: a canary under the threshold promotes only after the window; too few
 *          requests holds however long it ran (a timer alone never promotes); an error rate over the threshold rolls
 *          back once the minimum is served, even inside the window; a bad instant or sample is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); owner decision D6; app-shells 16 (point 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { canaryVerdict } from "#node/functions/canary-verdict.function";

const SINCE = "2026-10-28T00:00:00.000Z";
const SETTINGS = EDGE_PUBLISH_SETTINGS.canary;
const at = (hours: number): Date => new Date(Date.parse(SINCE) + hours * 3_600_000);

describe("canaryVerdict", () => {
  it("holds a healthy canary inside the window", () => {
    expect(canaryVerdict(SINCE, { requests: 5000, errors: 10 }, at(23), SETTINGS)).toBe("hold");
  });

  it("promotes a healthy canary once the window has passed", () => {
    expect(canaryVerdict(SINCE, { requests: 5000, errors: 50 }, at(24), SETTINGS)).toBe("promote");
  });

  it("never promotes on the timer alone", () => {
    expect(canaryVerdict(SINCE, { requests: 999, errors: 0 }, at(240), SETTINGS)).toBe("hold");
  });

  it("rolls back over the threshold, even inside the window", () => {
    expect(canaryVerdict(SINCE, { requests: 1000, errors: 11 }, at(1), SETTINGS)).toBe("rollback");
  });

  it("does not roll back on a few early errors", () => {
    expect(canaryVerdict(SINCE, { requests: 20, errors: 20 }, at(1), SETTINGS)).toBe("hold");
  });

  it("takes the settings it is given", () => {
    const strict = { windowHours: 1, maxErrorRate: 0, minRequests: 10 };
    expect(canaryVerdict(SINCE, { requests: 10, errors: 0 }, at(1), strict)).toBe("promote");
    expect(canaryVerdict(SINCE, { requests: 10, errors: 1 }, at(1), strict)).toBe("rollback");
  });

  it("refuses a bad instant or sample", () => {
    expect(() => canaryVerdict("yesterday", { requests: 1, errors: 0 }, at(1), SETTINGS)).toThrow(
      RangeError,
    );
    expect(() => canaryVerdict(SINCE, { requests: 1, errors: 2 }, at(1), SETTINGS)).toThrow(
      RangeError,
    );
    expect(() => canaryVerdict(SINCE, { requests: -1, errors: 0 }, at(1), SETTINGS)).toThrow(
      RangeError,
    );
  });
});
