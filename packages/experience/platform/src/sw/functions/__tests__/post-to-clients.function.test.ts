/**
 * Stackra file contract:
 * Purpose: unit tests of `postToClients`: the message reaches every window client, controlled or not, and the count
 *          comes back.
 * Boundary: test only; the worker scope's `clients` is stubbed on `globalThis`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255.
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { postToClients } from "#sw/functions/post-to-clients.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postToClients", () => {
  it("posts to every window client", async () => {
    const tabs = [{ postMessage: vi.fn() }, { postMessage: vi.fn() }];
    const matchAll = vi.fn(async () => tabs);
    vi.stubGlobal("clients", { matchAll });
    expect(await postToClients({ type: "outbox_drain" })).toBe(2);
    expect(matchAll).toHaveBeenCalledWith({ type: "window", includeUncontrolled: true });
    for (const tab of tabs) expect(tab.postMessage).toHaveBeenCalledWith({ type: "outbox_drain" });
  });
});
