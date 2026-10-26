/**
 * Stackra file contract:
 * Purpose: unit tests of the `LimitReservation` port: a port a driver extends, which runs the commit when the limit
 *          allows one more and refuses without running it otherwise.
 * Boundary: test only; a stand-in driver with a count.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0138 (as amended); ADR 0215 (decisions 3 and 4).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LimitReservation } from "#contracts/ports/limit-reservation.port";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

class OneSeat extends Driver(LimitReservation) {
  used = 0;

  async reserve<T>(_call: CallDescriptor, _input: unknown, commit: () => Promise<T>): Promise<T> {
    if (this.used >= 1) throw new RangeError("limit_reached");
    const output = await commit();
    this.used += 1;
    return output;
  }
}

describe("LimitReservation", () => {
  it("is a port that reserves, then commits", async () => {
    const seats = new OneSeat();
    expect(seats).toBeInstanceOf(LimitReservation);
    expect(seats).toBeInstanceOf(Port);
    const call = {} as CallDescriptor;
    let commits = 0;
    const commit = async () => ++commits;
    await expect(seats.reserve(call, {}, commit)).resolves.toBe(1);
    await expect(seats.reserve(call, {}, commit)).rejects.toThrow(/limit_reached/);
    expect(commits).toBe(1);
  });
});
