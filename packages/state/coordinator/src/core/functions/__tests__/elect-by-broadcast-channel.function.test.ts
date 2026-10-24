/**
 * Stackra file contract:
 * Purpose: unit tests of `electByBroadcastChannel`: a lone tab leads after three missed beats, a follower stays one
 *          while the leader beats, a resignation hands over at once, a tab that hears nothing takes over after the
 *          timeout, two leaders settle on the lower id, and leaving stops the beat and closes the channel.
 * Boundary: test only; `BroadcastChannel` is an in-test channel that delivers synchronously to the other open channels
 *           of the same name (and can be partitioned), and the clock and interval are vitest's fake timers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row).
 */
// oxlint-disable-next-line no-restricted-imports -- reason: the flags under test are @stackra/state signals, exported from `./react` only
import { signal } from "@stackra/state/react";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { electByBroadcastChannel } from "#core/functions/elect-by-broadcast-channel.function";

/** A BroadcastChannel that delivers at once to the other open channels of its name. */
class FakeChannel {
  static readonly open = new Set<FakeChannel>();

  static isPartitioned = false;

  readonly name: string;

  readonly posted: unknown[] = [];

  private readonly listeners = new Set<(event: { data: unknown }) => void>();

  constructor(name: string) {
    this.name = name;
    FakeChannel.open.add(this);
  }

  addEventListener(_type: "message", listener: (event: { data: unknown }) => void): void {
    this.listeners.add(listener);
  }

  postMessage(data: unknown): void {
    this.posted.push(data);
    if (FakeChannel.isPartitioned) return;
    for (const channel of FakeChannel.open)
      if (channel !== this && channel.name === this.name)
        for (const listener of channel.listeners) listener({ data });
  }

  close(): void {
    FakeChannel.open.delete(this);
  }
}

const BEAT = 1000;

describe("electByBroadcastChannel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("BroadcastChannel", FakeChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    FakeChannel.open.clear();
    FakeChannel.isPartitioned = false;
  });

  it("opens the election's prefixed channel", () => {
    electByBroadcastChannel("query.queue", signal(false), BEAT);
    expect([...FakeChannel.open].map((channel) => channel.name)).toEqual([
      "stackra.coordinator:query.queue",
    ]);
  });

  it("lets a lone tab lead after three missed beats", () => {
    const alone = signal(false);
    electByBroadcastChannel("queue", alone, BEAT);
    vi.advanceTimersByTime(2 * BEAT);
    expect(alone.get()).toBe(false);
    vi.advanceTimersByTime(BEAT);
    expect(alone.get()).toBe(true);
  });

  it("keeps a newcomer following while the leader beats", () => {
    const leader = signal(false);
    const follower = signal(false);
    electByBroadcastChannel("queue", leader, BEAT);
    vi.advanceTimersByTime(3 * BEAT);
    electByBroadcastChannel("queue", follower, BEAT);
    vi.advanceTimersByTime(10 * BEAT);
    expect(leader.get()).toBe(true);
    expect(follower.get()).toBe(false);
  });

  it("hands over at once when the leader resigns", () => {
    const leader = signal(false);
    const follower = signal(false);
    const leaveLeader = electByBroadcastChannel("queue", leader, BEAT);
    vi.advanceTimersByTime(3 * BEAT);
    electByBroadcastChannel("queue", follower, BEAT);
    vi.advanceTimersByTime(BEAT);
    leaveLeader();
    expect(follower.get()).toBe(true);
  });

  it("takes over when the leader goes silent", () => {
    const leader = signal(false);
    const follower = signal(false);
    electByBroadcastChannel("queue", leader, BEAT);
    vi.advanceTimersByTime(3 * BEAT);
    electByBroadcastChannel("queue", follower, BEAT);
    vi.advanceTimersByTime(BEAT);
    FakeChannel.isPartitioned = true; // the leader's tab froze or crashed without resigning
    vi.advanceTimersByTime(3 * BEAT);
    expect(follower.get()).toBe(true);
  });

  it("settles two leaders on the lower id", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    const lower = signal(false);
    const higher = signal(false);
    FakeChannel.isPartitioned = true;
    electByBroadcastChannel("queue", lower, BEAT);
    electByBroadcastChannel("queue", higher, BEAT);
    vi.advanceTimersByTime(3 * BEAT);
    expect([lower.get(), higher.get()]).toEqual([true, true]);
    FakeChannel.isPartitioned = false;
    vi.advanceTimersByTime(BEAT);
    expect([lower.get(), higher.get()]).toEqual([true, false]);
  });

  it("ignores a resignation from a tab it does not follow", () => {
    const follower = signal(false);
    electByBroadcastChannel("queue", follower, BEAT);
    const stranger = new FakeChannel("stackra.coordinator:queue");
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- reason: a BroadcastChannel has no target origin
    stranger.postMessage({ type: "resign", id: "someone" });
    expect(follower.get()).toBe(false);
  });

  it("stops beating, announces the resignation and closes the channel when it leaves", () => {
    const leader = signal(false);
    const leave = electByBroadcastChannel("queue", leader, BEAT);
    vi.advanceTimersByTime(3 * BEAT);
    const [channel] = FakeChannel.open;
    leave();
    vi.advanceTimersByTime(5 * BEAT);
    expect(channel?.posted.at(-1)).toEqual(expect.objectContaining({ type: "resign" }));
    expect(
      channel?.posted.filter((message) => (message as { type: string }).type === "heartbeat"),
    ).toHaveLength(1);
    expect(FakeChannel.open.size).toBe(0);
  });
});
