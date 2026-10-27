/**
 * Stackra file contract:
 * Purpose: unit tests of `electLeader`: it refuses an empty name, picks the detected method or the named one, hands
 *          the heartbeat to the BroadcastChannel method, exposes a read-only leader signal, resolves `whenLeader` when
 *          it leads and rejects it after resigning, and `resign` hands leadership on once.
 * Boundary: test only; most cases use the memory method, the others stub `navigator.locks` or `BroadcastChannel`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row); ADR 0079 (decision 6).
 */
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MEMORY_ELECTIONS } from "#core/constants/memory-elections.constant";
import { ElectionMethod } from "#core/enums/election-method.enum";
import { electLeader } from "#core/functions/elect-leader.function";

const memory = { method: ElectionMethod.Memory } as const;

describe("electLeader", () => {
  afterEach(() => {
    MEMORY_ELECTIONS.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refuses an empty name", () => {
    expect(() => electLeader("")).toThrow(RangeError);
  });

  it("uses the detected method when none is named", () => {
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("BroadcastChannel", undefined);
    const election = electLeader("queue");
    expect(election.method).toBe(ElectionMethod.Memory);
    expect(election.name).toBe("queue");
  });

  it("uses Web Locks when they exist", () => {
    const request = vi.fn(() => new Promise<void>(() => {}));
    vi.stubGlobal("navigator", { locks: { request } });
    expect(electLeader("queue").method).toBe(ElectionMethod.WebLocks);
    expect(request).toHaveBeenCalledWith(
      "stackra.coordinator:queue",
      expect.anything(),
      expect.any(Function),
    );
  });

  it("hands the heartbeat option to the BroadcastChannel method", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        addEventListener(): void {}

        postMessage(): void {}

        close(): void {}
      },
    );
    const election = electLeader("queue", {
      method: ElectionMethod.BroadcastChannel,
      heartbeat: Duration.seconds(2),
    });
    vi.advanceTimersByTime(4000);
    expect(election.isLeader.get()).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(election.isLeader.get()).toBe(true);
    election.resign();
  });

  it("exposes the leader flag read-only", () => {
    const election = electLeader("queue", memory);
    expect(election.isLeader.get()).toBe(true);
    expect("set" in election.isLeader).toBe(false);
    expect(Object.isFrozen(election)).toBe(true);
  });

  it("notifies subscribers when leadership arrives", () => {
    const first = electLeader("queue", memory);
    const second = electLeader("queue", memory);
    const seen: boolean[] = [];
    second.isLeader.subscribe((leads) => seen.push(leads));
    first.resign();
    expect(seen).toEqual([true]);
    expect(first.isLeader.get()).toBe(false);
  });

  it("resolves whenLeader at once for the leader", async () => {
    await expect(electLeader("queue", memory).whenLeader()).resolves.toBeUndefined();
  });

  it("resolves whenLeader for a follower once the leader resigns", async () => {
    const first = electLeader("queue", memory);
    const second = electLeader("queue", memory);
    const led = second.whenLeader();
    first.resign();
    await expect(led).resolves.toBeUndefined();
  });

  it("rejects a pending whenLeader when the participant resigns first", async () => {
    electLeader("queue", memory);
    const second = electLeader("queue", memory);
    const led = second.whenLeader();
    second.resign();
    await expect(led).rejects.toThrow('Resigned from the "queue" election before leading');
  });

  it("rejects whenLeader after resigning", async () => {
    const election = electLeader("queue", memory);
    election.resign();
    await expect(election.whenLeader()).rejects.toThrow('Resigned from the "queue" election');
  });

  it("hands leadership on only once however often it resigns", () => {
    const first = electLeader("queue", memory);
    const second = electLeader("queue", memory);
    const third = electLeader("queue", memory);
    first.resign();
    first.resign();
    expect(second.isLeader.get()).toBe(true);
    expect(third.isLeader.get()).toBe(false);
  });
});
