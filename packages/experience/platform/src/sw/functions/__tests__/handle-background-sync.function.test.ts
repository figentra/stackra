/**
 * Stackra file contract:
 * Purpose: unit tests of `handleBackgroundSync`: the outbox tag asks the open tabs to drain the outbox; another tag is
 *          ignored.
 * Boundary: test only; the worker scope's `clients` is stubbed on `globalThis`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 4); ADR 0252.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { handleBackgroundSync } from "#sw/functions/handle-background-sync.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("handleBackgroundSync", () => {
  it("wakes the outbox drain for the outbox tag only", async () => {
    const tab = { postMessage: vi.fn() };
    vi.stubGlobal("clients", { matchAll: async () => [tab] });
    const waits: Promise<unknown>[] = [];
    const waitUntil = (promise: Promise<unknown>) => void waits.push(promise);
    handleBackgroundSync({ tag: "other", waitUntil });
    expect(waits).toHaveLength(0);
    handleBackgroundSync({ tag: "stackra_outbox", waitUntil });
    await Promise.all(waits);
    expect(tab.postMessage).toHaveBeenCalledWith({ type: "outbox_drain" });
  });
});
