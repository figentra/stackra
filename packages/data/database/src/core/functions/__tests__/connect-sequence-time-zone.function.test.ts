/**
 * Stackra file contract:
 * Purpose: unit tests of `connectSequenceTimeZone`: it sets the driver the yearly series read their time zone from,
 *          replaces it whole, and `undefined` disconnects.
 * Boundary: test only; the drivers are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0394 (decision 1); ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { SEQUENCE_TIME_ZONE_HOST } from "#core/constants/sequence-time-zone-host.constant";
import { connectSequenceTimeZone } from "#core/functions/connect-sequence-time-zone.function";
import { SequenceTimeZone } from "#contracts/ports/sequence-time-zone.port";

/** A driver that answers one fixed zone. */
class FixedZone extends SequenceTimeZone {
  async timeZoneOf(): Promise<string | undefined> {
    return "Asia/Riyadh";
  }
}

afterEach(() => {
  connectSequenceTimeZone(undefined);
});

describe(connectSequenceTimeZone, () => {
  it("connects, replaces and disconnects the driver", () => {
    const first = new FixedZone();
    const second = new FixedZone();
    connectSequenceTimeZone(first);
    expect(SEQUENCE_TIME_ZONE_HOST.source).toBe(first);
    connectSequenceTimeZone(second);
    expect(SEQUENCE_TIME_ZONE_HOST.source).toBe(second);
    connectSequenceTimeZone(undefined);
    expect(SEQUENCE_TIME_ZONE_HOST.source).toBeUndefined();
  });
});
