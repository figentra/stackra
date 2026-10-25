/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeRealtime`: the template's call shapes (`fakeRealtime()` and the render option's
 *          `{ status }`) return a `RealtimeFake` live by default or at the given status.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { RealtimeStatus } from "#core/index";
import { fakeRealtime } from "#testing/functions/fake-realtime.function";
import { RealtimeFake } from "#testing/realtime.fake";

describe("fakeRealtime", () => {
  it("returns a live fake without options", () => {
    const realtime = fakeRealtime();
    expect(realtime).toBeInstanceOf(RealtimeFake);
    expect(realtime.state).toEqual({ status: RealtimeStatus.Connected });
  });

  it("returns a fake at the given status", () => {
    expect(fakeRealtime({ status: RealtimeStatus.Disconnected }).state).toEqual({
      status: RealtimeStatus.Disconnected,
    });
  });
});
