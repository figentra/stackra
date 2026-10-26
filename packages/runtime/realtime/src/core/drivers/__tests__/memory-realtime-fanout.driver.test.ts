/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRealtimeFanoutDriver`: it is the `RealtimeFanout` port, delivers after `publish`
 *          resolves as `local` does, and keeps every published message until `clear()`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import { MemoryRealtimeFanoutDriver } from "#core/drivers/memory-realtime-fanout.driver";

const MESSAGE: FanoutMessage = {
  kind: "broadcast",
  // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: an opaque test value, never checked against a catalogue
  broadcast: { permission: "p", message: { channel: "tenant.t.m", name: "m.e.v1", id: "evt_1" } },
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe(MemoryRealtimeFanoutDriver, () => {
  it("delivers after publish and keeps what it carried", async () => {
    const fanout = new MemoryRealtimeFanoutDriver();
    expect(fanout).toBeInstanceOf(RealtimeFanout);
    const seen: FanoutMessage[] = [];
    fanout.subscribe((message) => seen.push(message));
    await fanout.publish(MESSAGE);
    expect(fanout.published).toEqual([MESSAGE]);
    expect(seen).toEqual([]);
    await settle();
    expect(seen).toEqual([MESSAGE]);
    fanout.clear();
    expect(fanout.published).toEqual([]);
  });
});
