/**
 * Stackra file contract:
 * Purpose: unit tests of `scheduleSecretReload`: it reloads on the interval and on `reloadNow`, joins a reload that is
 *          already running, reports a failed reload to `onError` while the store keeps answering its last good copy,
 *          schedules nothing for 0, stops on `stop`, unrefs its timer, and refuses an interval outside 0 to 86400.
 * Boundary: test only; fake timers and an in-memory store whose `load` a test steers. Values are made-up canaries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0371 (amendment 2026-11-27, STA-258).
 */
import { Driver } from "@stackra/container";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SecretStore } from "#contracts/ports/secret-store.port";
import { scheduleSecretReload } from "#core/functions/schedule-secret-reload.function";

/** A loading store over `next`: each load copies `next`, or rejects when `fail` is set. */
class SteeredStore extends Driver(SecretStore) {
  next = new Map<string, string>();

  fail: Error | undefined;

  loads = 0;

  gate: Promise<void> | undefined;

  private values = new Map<string, string>();

  async load(): Promise<void> {
    this.loads += 1;
    await this.gate;
    if (this.fail !== undefined) throw this.fail;
    this.values = new Map(this.next);
  }

  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

describe(scheduleSecretReload, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reloads on the interval, so a rotated value reaches get without a restart", async () => {
    const store = new SteeredStore();
    store.next.set("SIGNING_KEY", "old-canary");
    await store.load();
    const reloaded = vi.fn();
    const reload = scheduleSecretReload(store, { everySeconds: 60, onReload: reloaded });

    store.next.set("SIGNING_KEY", "new-canary");
    expect(store.get("SIGNING_KEY")).toBe("old-canary");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(store.get("SIGNING_KEY")).toBe("new-canary");
    expect(reloaded).toHaveBeenCalledOnce();
    reload.stop();
  });

  it("keeps the last good copy when a reload fails, and tells onError", async () => {
    const store = new SteeredStore();
    store.next.set("SIGNING_KEY", "good-canary");
    await store.load();
    const onError = vi.fn();
    const reload = scheduleSecretReload(store, { everySeconds: 0, onError });

    store.fail = new Error("AWS Secrets Manager could not read: app/prod");
    store.next.set("SIGNING_KEY", "never-canary");
    await expect(reload.reloadNow()).resolves.toBe(false);
    expect(onError).toHaveBeenCalledWith(store.fail);
    expect(store.get("SIGNING_KEY")).toBe("good-canary");

    store.fail = undefined;
    await expect(reload.reloadNow()).resolves.toBe(true);
    expect(store.get("SIGNING_KEY")).toBe("never-canary");
  });

  it("joins a reload that is already running instead of starting a second", async () => {
    const store = new SteeredStore();
    let open!: () => void;
    store.gate = new Promise((resolve) => {
      open = resolve;
    });
    const reload = scheduleSecretReload(store, { everySeconds: 0 });
    const first = reload.reloadNow();
    const second = reload.reloadNow();
    expect(second).toBe(first);
    open();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(store.loads).toBe(1);
    await reload.reloadNow();
    expect(store.loads).toBe(2);
  });

  it("schedules nothing for 0 and nothing more after stop", async () => {
    const store = new SteeredStore();
    scheduleSecretReload(store, { everySeconds: 0 });
    await vi.advanceTimersByTimeAsync(86_400_000);
    expect(store.loads).toBe(0);

    const reload = scheduleSecretReload(store, { everySeconds: 10 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(store.loads).toBe(1);
    reload.stop();
    await vi.advanceTimersByTimeAsync(100_000);
    expect(store.loads).toBe(1);
  });

  it("unrefs its timer, so the schedule never holds a process open", () => {
    const unref = vi.fn();
    const spy = vi
      .spyOn(globalThis, "setInterval")
      .mockReturnValue({ unref } as unknown as ReturnType<typeof setInterval>);
    scheduleSecretReload(new SteeredStore(), { everySeconds: 5 });
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(unref).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("refuses an interval that is not a whole number from 0 to 86400", () => {
    for (const everySeconds of [-1, 0.5, 86_401, Number.NaN])
      expect(() => scheduleSecretReload(new SteeredStore(), { everySeconds })).toThrow(RangeError);
  });
});
