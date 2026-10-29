/**
 * Stackra file contract:
 * Purpose: unit tests of `killSwitchServiceWorker`: the script it returns skips waiting on install and, on activate,
 *          deletes every cache, unregisters the worker and reloads every open tab, even when one tab fails.
 * Boundary: test only; the script runs in a `node:vm` context whose `self` is a recording fake worker scope.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0325 (rule 18).
 */
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { killSwitchServiceWorker } from "#sw/functions/kill-switch-service-worker.function";

describe("killSwitchServiceWorker", () => {
  it("retires the worker: skip waiting, clear caches, unregister, reload the tabs", async () => {
    const listeners = new Map<string, (event: unknown) => void>();
    const failing = {
      url: "https://app.test/b",
      navigate: vi.fn(async () => {
        throw new Error("gone");
      }),
    };
    const tab = { url: "https://app.test/a", navigate: vi.fn(async () => undefined) };
    const self = {
      addEventListener: (type: string, listener: (event: unknown) => void) =>
        listeners.set(type, listener),
      skipWaiting: vi.fn(async () => undefined),
      caches: {
        keys: vi.fn(async () => ["shell-v1", "runtime"]),
        delete: vi.fn(async () => true),
      },
      registration: { unregister: vi.fn(async () => true) },
      clients: { matchAll: vi.fn(async () => [failing, tab]) },
    };
    runInNewContext(killSwitchServiceWorker(), { self });

    listeners.get("install")?.({});
    expect(self.skipWaiting).toHaveBeenCalledTimes(1);

    let work: Promise<unknown> | undefined;
    listeners.get("activate")?.({ waitUntil: (promise: Promise<unknown>) => (work = promise) });
    await work;
    expect(self.caches.delete.mock.calls).toEqual([["shell-v1"], ["runtime"]]);
    expect(self.registration.unregister).toHaveBeenCalledTimes(1);
    expect(self.clients.matchAll).toHaveBeenCalledWith({ type: "window" });
    expect(failing.navigate).toHaveBeenCalledWith("https://app.test/b");
    expect(tab.navigate).toHaveBeenCalledWith("https://app.test/a");
  });
});
