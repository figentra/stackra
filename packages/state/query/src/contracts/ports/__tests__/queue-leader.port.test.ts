/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `QueueLeader` port: a port whose driver hands out a read-only leader signal, keyed
 *          so that `DriverName<QueueLeader>` is exactly the coordinator drivers' names (`broadcast_channel`, `memory`).
 * Boundary: test only; the leader signal is a small hand-written one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 4); ADR 0252.
 */
import type { DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueueLeader } from "#contracts/ports/queue-leader.port";
import type { QueueLeaderName } from "#core/types/queue-leader-name.type";

describe("QueueLeader", () => {
  it("is a port whose driver says whether this context leads", () => {
    const seen: boolean[] = [];
    class FixedLeader extends QueueLeader {
      readonly isLeader = {
        get: () => true,
        subscribe: (listener: (value: boolean) => void) => {
          listener(true);
          return () => undefined;
        },
      };
    }
    const leader = new FixedLeader();
    leader.isLeader.subscribe((leads) => seen.push(leads));
    expect(leader.isLeader.get()).toBe(true);
    expect(seen).toEqual([true]);
    expect(leader).toBeInstanceOf(QueueLeader);
    expect(leader).toBeInstanceOf(Port);
  });

  it("narrows DriverName to the coordinator drivers' names", () => {
    expectTypeOf<DriverName<QueueLeader>>().toEqualTypeOf<QueueLeaderName>();
    expectTypeOf<QueueLeaderName>().toEqualTypeOf<"broadcast_channel" | "memory">();
    const name: DriverName<QueueLeader> = "broadcast_channel";
    // @ts-expect-error -- not a driver of this port
    const other: DriverName<QueueLeader> = "redis";
    expect([name, other]).toEqual(["broadcast_channel", "redis"]);
  });
});
