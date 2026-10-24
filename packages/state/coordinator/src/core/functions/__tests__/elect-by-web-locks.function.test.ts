/**
 * Stackra file contract:
 * Purpose: unit tests of `electByWebLocks`: it requests the prefixed lock, leads while it holds it, hands it on when it
 *          leaves, and withdraws a queued request without leading and without an unhandled rejection.
 * Boundary: test only; `navigator.locks` is a small in-test lock manager that grants one holder per name in request
 *           order and rejects a withdrawn request with an AbortError, as the browser does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row).
 */
// oxlint-disable-next-line no-restricted-imports -- reason: the flags under test are @stackra/state signals, exported from `./react` only
import { signal } from "@stackra/state/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { electByWebLocks } from "#core/functions/elect-by-web-locks.function";

/** A lock manager with the one call this package makes. */
function fakeLocks() {
  const queues = new Map<string, (() => void)[]>();
  const held = new Set<string>();
  const grantNext = (name: string): void => {
    const run = queues.get(name)?.shift();
    if (run === undefined) held.delete(name);
    else run();
  };
  return {
    request: vi.fn(
      (name: string, options: { signal: AbortSignal }, callback: () => Promise<void>) =>
        new Promise<void>((resolve, reject) => {
          const run = (): void => {
            held.add(name);
            void callback().then(() => {
              resolve();
              grantNext(name);
            });
          };
          options.signal.addEventListener("abort", () => {
            const queue = queues.get(name) ?? [];
            const index = queue.indexOf(run);
            if (index === -1) return;
            queue.splice(index, 1);
            reject(new DOMException("The request was aborted", "AbortError"));
          });
          if (!held.has(name)) return run();
          queues.set(name, [...(queues.get(name) ?? []), run]);
        }),
    ),
  };
}

describe("electByWebLocks", () => {
  let locks: ReturnType<typeof fakeLocks>;

  beforeEach(() => {
    locks = fakeLocks();
    vi.stubGlobal("navigator", { locks });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the election's prefixed lock", () => {
    electByWebLocks("query.queue", signal(false));
    expect(locks.request).toHaveBeenCalledWith(
      "stackra.coordinator:query.queue",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      expect.any(Function),
    );
  });

  it("leads once the lock is granted and queues the next tab", () => {
    const first = signal(false);
    const second = signal(false);
    electByWebLocks("queue", first);
    electByWebLocks("queue", second);
    expect(first.get()).toBe(true);
    expect(second.get()).toBe(false);
  });

  it("hands the lock to the next tab when the leader leaves", async () => {
    const second = signal(false);
    const leaveFirst = electByWebLocks("queue", signal(false));
    electByWebLocks("queue", second);
    leaveFirst();
    await vi.waitFor(() => {
      expect(second.get()).toBe(true);
    });
  });

  it("withdraws a queued request without leading", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const second = signal(false);
    const leaveFirst = electByWebLocks("queue", signal(false));
    const leaveSecond = electByWebLocks("queue", second);
    leaveSecond();
    leaveFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(second.get()).toBe(false);
    expect(unhandled).not.toHaveBeenCalled();
    process.off("unhandledRejection", unhandled);
  });
});
