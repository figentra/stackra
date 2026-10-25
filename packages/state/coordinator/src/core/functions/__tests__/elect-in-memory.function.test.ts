/**
 * Stackra file contract:
 * Purpose: unit tests of `electInMemory`: the first participant of a name leads, the next leads when it leaves, names
 *          are independent, and the last one to leave removes the election.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row).
 */
// oxlint-disable-next-line no-restricted-imports -- reason: the flags under test are @stackra/state signals, exported from `./react` only
import { signal } from "@stackra/state/react";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MEMORY_ELECTIONS } from "#core/constants/memory-elections.constant";
import { electInMemory } from "#core/functions/elect-in-memory.function";

describe("electInMemory", () => {
  afterEach(() => {
    MEMORY_ELECTIONS.clear();
  });

  it("lets the first participant lead and queues the next", () => {
    const first = signal(false);
    const second = signal(false);
    electInMemory("queue", first);
    electInMemory("queue", second);
    expect(first.get()).toBe(true);
    expect(second.get()).toBe(false);
  });

  it("hands leadership to the next participant when the leader leaves", () => {
    const first = signal(false);
    const second = signal(false);
    const leaveFirst = electInMemory("queue", first);
    electInMemory("queue", second);
    leaveFirst();
    expect(second.get()).toBe(true);
  });

  it("keeps the leader when a follower leaves", () => {
    const first = signal(false);
    const second = signal(false);
    electInMemory("queue", first);
    const leaveSecond = electInMemory("queue", second);
    leaveSecond();
    expect(first.get()).toBe(true);
    expect(MEMORY_ELECTIONS.get("queue")).toEqual([first]);
  });

  it("keeps different names apart", () => {
    const queue = signal(false);
    const socket = signal(false);
    electInMemory("queue", queue);
    electInMemory("socket", socket);
    expect(queue.get()).toBe(true);
    expect(socket.get()).toBe(true);
  });

  it("removes the election when its last participant leaves, and a second leave does nothing", () => {
    const leave = electInMemory("queue", signal(false));
    leave();
    expect(MEMORY_ELECTIONS.has("queue")).toBe(false);
    const next = signal(false);
    electInMemory("queue", next);
    leave();
    expect(MEMORY_ELECTIONS.get("queue")).toEqual([next]);
    expect(next.get()).toBe(true);
  });
});
