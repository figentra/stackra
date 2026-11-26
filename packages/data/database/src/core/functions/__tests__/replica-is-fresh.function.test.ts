/**
 * Stackra file contract:
 * Purpose: unit tests of `replicaIsFresh`: a demand with no field is always met; `maxLag` holds up to and including the
 *          lag at the read's time and fails past it; `after` needs the replica replayed through that write; a primary
 *          behind a replica url always serves and a standby with no known replay point never does.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0057 (decision 6); STA-1464.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { replicaIsFresh } from "#core/functions/replica-is-fresh.function";

/** A standby read at 10 s that had replayed through 8 s. */
const LAGGING = { measuredAt: 10_000, replayedThrough: 8000 };

describe(replicaIsFresh, () => {
  it("meets a demand with no field", () => {
    expect(replicaIsFresh(LAGGING, 60_000, {})).toBe(true);
  });

  it("holds maxLag up to the lag at the read's time, and fails past it", () => {
    expect(replicaIsFresh(LAGGING, 10_000, { maxLag: Duration.seconds(2) })).toBe(true);
    expect(replicaIsFresh(LAGGING, 10_001, { maxLag: Duration.seconds(2) })).toBe(false);
    expect(replicaIsFresh(LAGGING, 10_500, { maxLag: Duration.seconds(5) })).toBe(true);
  });

  it("needs the replica replayed through the caller's write", () => {
    expect(replicaIsFresh(LAGGING, 10_000, { after: new Date(8000) })).toBe(true);
    expect(replicaIsFresh(LAGGING, 10_000, { after: new Date(8001) })).toBe(false);
    expect(
      replicaIsFresh(LAGGING, 10_000, { maxLag: Duration.seconds(60), after: new Date(9000) }),
    ).toBe(false);
  });

  it("always serves from a server that is not a standby, and never from an unknown replay point", () => {
    const primary = { measuredAt: 10_000, replayedThrough: Number.POSITIVE_INFINITY };
    const unknown = { measuredAt: 10_000, replayedThrough: Number.NEGATIVE_INFINITY };
    const demand = { maxLag: Duration.seconds(1), after: new Date(99_000) };
    expect(replicaIsFresh(primary, 100_000, demand)).toBe(true);
    expect(replicaIsFresh(unknown, 10_000, { maxLag: Duration.seconds(3600) })).toBe(false);
    expect(replicaIsFresh(unknown, 10_000, { after: new Date(0) })).toBe(false);
  });
});
