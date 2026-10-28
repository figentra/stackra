/**
 * Stackra file contract:
 * Purpose: unit tests of `LocalRealtimeFanoutDriver`: it is the `RealtimeFanout` port; every subscriber receives each
 *          message after `publish` resolves, a throwing subscriber does not stop the others, and a stopped one
 *          receives nothing more.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import { LocalRealtimeFanoutDriver } from "#core/drivers/local-realtime-fanout.driver";

const MESSAGE: FanoutMessage = {
  kind: "broadcast",
  broadcast: { permission: "p", message: { channel: "tenant.t.m", name: "m.e.v1", id: "evt_1" } },
};

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe(LocalRealtimeFanoutDriver, () => {
  it("delivers to every subscriber after publish, until stopped", async () => {
    const fanout = new LocalRealtimeFanoutDriver();
    expect(fanout).toBeInstanceOf(RealtimeFanout);
    const seen: FanoutMessage[] = [];
    fanout.subscribe(() => {
      throw new Error("bad subscriber");
    });
    const stop = fanout.subscribe((message) => seen.push(message));
    await fanout.publish(MESSAGE);
    expect(seen).toEqual([]);
    await settle();
    expect(seen).toEqual([MESSAGE]);
    stop();
    await fanout.publish(MESSAGE);
    await settle();
    expect(seen).toHaveLength(1);
  });
});
