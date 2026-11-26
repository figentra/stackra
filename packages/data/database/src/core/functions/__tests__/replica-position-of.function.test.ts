/**
 * Stackra file contract:
 * Purpose: unit tests of `replicaPositionOf`: a server that is not a standby has replayed everything, a caught-up
 *          standby is current as of the reading, a lagging one is behind by its lag (a numeric string read too, a
 *          negative lag read as none), and a standby with no readable lag, or no row, has replayed nothing usable.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0057 (decision 6); STA-1464.
 */
import { describe, expect, it } from "@stackra/testing";

import { replicaPositionOf } from "#core/functions/replica-position-of.function";

describe(replicaPositionOf, () => {
  it("reads a server that is not a standby as replayed through everything", () => {
    expect(replicaPositionOf({ standby: false, caught_up: false, lag_ms: null }, 10_000)).toEqual({
      measuredAt: 10_000,
      replayedThrough: Number.POSITIVE_INFINITY,
    });
  });

  it("reads a caught-up standby as current at the reading, however old its last commit", () => {
    expect(replicaPositionOf({ standby: true, caught_up: true, lag_ms: 600_000 }, 10_000)).toEqual({
      measuredAt: 10_000,
      replayedThrough: 10_000,
    });
  });

  it("reads a lagging standby as behind by its lag", () => {
    expect(replicaPositionOf({ standby: true, caught_up: false, lag_ms: 1200 }, 10_000)).toEqual({
      measuredAt: 10_000,
      replayedThrough: 8800,
    });
    expect(
      replicaPositionOf({ standby: true, caught_up: false, lag_ms: "250.5" }, 10_000)
        .replayedThrough,
    ).toBe(9749.5);
    expect(
      replicaPositionOf({ standby: true, caught_up: false, lag_ms: -40 }, 10_000).replayedThrough,
    ).toBe(10_000);
  });

  it("reads a standby with no readable lag, or no row, as replayed through nothing", () => {
    for (const row of [
      { standby: true, caught_up: false, lag_ms: null },
      { standby: true, caught_up: false, lag_ms: "n/a" },
      undefined,
    ])
      expect(replicaPositionOf(row, 10_000).replayedThrough).toBe(Number.NEGATIVE_INFINITY);
  });
});
