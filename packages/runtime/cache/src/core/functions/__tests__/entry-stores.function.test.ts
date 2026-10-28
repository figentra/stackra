/**
 * Stackra file contract:
 * Purpose: unit tests of the entry stores under `storedCache`: `memoryEntryStore` (entries by reference, a dead entry
 *          dropped on read once its stale window passes, the least recently read dropped past the bound together with
 *          its set memberships, prefix listing, sets), `textEntryStore` (JSON entries, untrusted text read as absent,
 *          `keys` passed on only when the store has it), and `markerSets` (one marker key per member, the set name
 *          encoded, clear deleting the markers only).
 * Boundary: test only; plain maps stand in for the outside stores.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4).
 */
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { markerSets } from "#core/functions/marker-sets.function";
import { memoryEntryStore } from "#core/functions/memory-entry-store.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";
import type { CacheStore } from "#core/types/cache-store.type";

class ManualClock extends Clock {
  time = 1_000_000;

  now(): Date {
    return new Date(this.time);
  }
}

const TTL = Duration.minutes(1);

describe("memoryEntryStore", () => {
  it("serves an entry until its stale window, or without one its expiry, has passed", async () => {
    const clock = new ManualClock();
    const store = memoryEntryStore(10, clock);
    await store.write(
      "/a",
      { value: 1, expiresAt: clock.time + 10, staleUntil: clock.time + 20 },
      TTL,
    );
    await store.write("/b", { value: 2, expiresAt: clock.time + 10 }, TTL);
    clock.time += 10;
    await expect(store.read("/a")).resolves.toMatchObject({ value: 1 });
    await expect(store.read("/b")).resolves.toBeUndefined();
    clock.time += 10;
    await expect(store.read("/a")).resolves.toBeUndefined();
  });

  it("lists keys by prefix and drops an evicted entry from its sets", async () => {
    const clock = new ManualClock();
    const store = memoryEntryStore(1, clock);
    await store.add("t//Category:1", "/Product:1", TTL);
    await store.write("/Product:1", { value: 1, expiresAt: clock.time + 100 }, TTL);
    await expect(store.keys?.("/Product")).resolves.toEqual(["/Product:1"]);
    await store.write("/Product:2", { value: 2, expiresAt: clock.time + 100 }, TTL);
    await expect(store.members("t//Category:1")).resolves.toEqual([]);
    await expect(store.keys?.("/Product")).resolves.toEqual(["/Product:2"]);
  });

  it("clears a set without touching its members' entries", async () => {
    const clock = new ManualClock();
    const store = memoryEntryStore(10, clock);
    await store.add("t//T", "/K", TTL);
    await store.write("/K", { value: 1, expiresAt: clock.time + 100 }, TTL);
    await store.clear("t//T");
    await expect(store.members("t//T")).resolves.toEqual([]);
    await expect(store.read("/K")).resolves.toMatchObject({ value: 1 });
  });
});

/** A text store over a map; `listing: false` leaves out `keys`. */
function textStore(listing: boolean): CacheStore & { readonly texts: Map<string, string> } {
  const texts = new Map<string, string>();
  const store: CacheStore & { readonly texts: Map<string, string> } = {
    texts,
    read: async (key) => texts.get(key),
    write: async (key, text) => {
      texts.set(key, text);
    },
    delete: async (key) => {
      texts.delete(key);
    },
    add: async () => undefined,
    members: async () => [],
    clear: async () => undefined,
  };
  if (listing)
    store.keys = async (prefix) => [...texts.keys()].filter((key) => key.startsWith(prefix));
  return store;
}

describe("textEntryStore", () => {
  it("keeps entries as JSON and reads text that is not one as absent", async () => {
    const raw = textStore(true);
    const store = textEntryStore(raw);
    await store.write("/a", { value: { id: 1 }, expiresAt: 5, staleUntil: 9 }, TTL);
    expect(raw.texts.get("/a")).toBe(
      JSON.stringify({ value: { id: 1 }, expiresAt: 5, staleUntil: 9 }),
    );
    await expect(store.read("/a")).resolves.toEqual({
      value: { id: 1 },
      expiresAt: 5,
      staleUntil: 9,
    });
    raw.texts.set("/b", "[1");
    raw.texts.set("/c", JSON.stringify({ value: 1, expiresAt: "soon" }));
    await expect(store.read("/b")).resolves.toBeUndefined();
    await expect(store.read("/c")).resolves.toBeUndefined();
  });

  it("passes on keys only when the store lists a prefix", () => {
    expect(textEntryStore(textStore(true)).keys).toBeTypeOf("function");
    expect(textEntryStore(textStore(false)).keys).toBeUndefined();
  });
});

describe("markerSets", () => {
  it("keeps one marker key per member under the encoded set name", async () => {
    const texts = new Map<string, string>();
    const sets = markerSets({
      write: async (key, text) => {
        texts.set(key, text);
      },
      delete: async (key) => {
        texts.delete(key);
      },
      keys: async (prefix) => [...texts.keys()].filter((key) => key.startsWith(prefix)),
    });
    texts.set("/Product:1", "entry");
    await sets.add("t//Category:1", "/Product:1", TTL);
    await sets.add("t//Category:1", "/Product:1", TTL);
    await sets.add("t//Category:10", "/Product:2", TTL);
    expect(texts.get(`#${encodeURIComponent("t//Category:1")}//Product:1`)).toBe("");
    await expect(sets.members("t//Category:1")).resolves.toEqual(["/Product:1"]);
    await sets.clear("t//Category:1");
    await expect(sets.members("t//Category:1")).resolves.toEqual([]);
    await expect(sets.members("t//Category:10")).resolves.toEqual(["/Product:2"]);
    expect(texts.get("/Product:1")).toBe("entry");
  });
});
