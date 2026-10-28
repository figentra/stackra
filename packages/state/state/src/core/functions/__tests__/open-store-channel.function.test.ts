/**
 * Stackra file contract:
 * Purpose: unit tests of cross-tab sync (`openStoreChannel` with `commitStore`): a commit posts `{ key, version,
 *          state }` on `stackra:state:<area>`; another context applies it and notifies; a context ignores its own post,
 *          another key, another version and a malformed message; no channel exists without `BroadcastChannel` or in Node, and a
 *          session-only store has none.
 * Boundary: test only; `BroadcastChannel` is an in-test fake that delivers to the other channels of the same name,
 *           each channel standing for one context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079; ADR 0256.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Store } from "#core/bases/store.base";
import { openStoreChannel } from "#core/functions/open-store-channel.function";
import { registerStores } from "#core/functions/register-stores.function";
import { storeVersion } from "#core/functions/store-version.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";
import type { StoreInternals } from "#core/types/store-internals.type";
import type { StoreStorage } from "#core/types/store-storage.type";

class ThemeStore extends Store({ persist: "prefs" }) {
  mode = "light";

  toggle(): void {
    this.set({ mode: this.mode === "light" ? "dark" : "light" });
  }
}

class DraftStore extends Store {
  text = "";

  write(text: string): void {
    this.set({ text });
  }
}

registerStores([[ThemeStore, "web.theme"]]);

const channels: FakeChannel[] = [];

/** A context's channel: a post reaches every other open channel of the same name, never itself. */
class FakeChannel {
  private readonly listeners: ((event: { data: unknown }) => void)[] = [];

  constructor(readonly name: string) {
    channels.push(this);
  }

  addEventListener(_type: "message", listener: (event: { data: unknown }) => void): void {
    this.listeners.push(listener);
  }

  postMessage(data: unknown): void {
    for (const other of channels)
      if (other !== this && other.name === this.name)
        for (const listener of other.listeners) listener({ data });
  }
}

const storage: StoreStorage = { area: () => ({ get: () => undefined, set: () => undefined }) };

/** Makes the runtime look like a browser to the Node guard of `openStoreChannel`. */
function stubBrowser(): void {
  vi.stubGlobal("process", { versions: {} });
  vi.stubGlobal("BroadcastChannel", FakeChannel);
}

describe("cross-tab sync of a persisted store", () => {
  afterEach(() => {
    channels.length = 0;
    vi.unstubAllGlobals();
  });

  it("posts the committed state on stackra:state:<area>", () => {
    stubBrowser();
    const seen: unknown[] = [];
    const tab = new ThemeStore(storage);
    new FakeChannel("stackra:state:prefs").addEventListener("message", ({ data }) =>
      seen.push(data),
    );
    tab.toggle();
    expect(seen).toEqual([{ key: "web.theme", version: 1, state: { mode: "dark" } }]);
  });

  it("applies another context's commit and notifies, without echoing it back", () => {
    stubBrowser();
    const first = new ThemeStore(storage);
    const second = new ThemeStore(storage);
    const listener = vi.fn();
    subscribeStore(second, listener);
    const echoed = vi.spyOn(channels[1] as FakeChannel, "postMessage");
    first.toggle();
    expect(second.mode).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storeVersion(second)).toBe(1);
    expect(echoed).not.toHaveBeenCalled();
    expect(first.mode).toBe("dark");
  });

  it("ignores its own post", () => {
    stubBrowser();
    const tab = new ThemeStore(storage);
    const listener = vi.fn();
    subscribeStore(tab, listener);
    tab.toggle();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores another key, another version and a malformed message", () => {
    stubBrowser();
    const tab = new ThemeStore(storage);
    const other = new FakeChannel("stackra:state:prefs");
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    other.postMessage({ key: "web.other", version: 1, state: { mode: "dark" } });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    other.postMessage({ key: "web.theme", version: 2, state: { mode: "dark" } });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    other.postMessage({ key: "web.theme", version: 1, state: "dark" });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    other.postMessage(null);
    expect(tab.mode).toBe("light");
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    other.postMessage({ key: "web.theme", version: 1, state: { mode: "dark" } });
    expect(tab.mode).toBe("dark");
  });

  it("opens no channel without BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    expect(openStoreChannel({}, {} as StoreInternals, "prefs")).toBeUndefined();
    new ThemeStore(storage).toggle();
    expect(channels).toHaveLength(0);
  });

  it("opens no channel in Node, which has BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    expect(openStoreChannel({}, {} as StoreInternals, "prefs")).toBeUndefined();
    new ThemeStore(storage).toggle();
    expect(channels).toHaveLength(0);
  });

  it("opens no channel for a session-only store", () => {
    stubBrowser();
    new DraftStore(storage).write("a");
    expect(channels).toHaveLength(0);
  });
});
