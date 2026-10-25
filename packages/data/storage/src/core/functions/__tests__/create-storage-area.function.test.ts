/**
 * Stackra file contract:
 * Purpose: unit tests of `createStorageArea`: JSON values kept as copies, expiry by time-to-live, shape classes read
 *          with their defaults and written through their schema, untrusted persisted text dropped, synchronous and
 *          asynchronous loading, ordered persistence, and write failures surfaced on `flush()` only.
 * Boundary: test only; the backends are test-local recorders and the schemas are registered by hand, as gen's
 *           generated code would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0256 (decisions 2 to 4).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { createStorageArea } from "#core/functions/create-storage-area.function";
import { registerStorageKeys } from "#core/functions/register-storage-keys.function";
import type { StorageBackend } from "#core/types/storage-backend.type";

class DevicePrefs {
  density = "comfortable";
  localNotifications = false;
}

class Visit {
  at!: Date;
}

class Unregistered {}

registerSchemas([
  [
    DevicePrefs,
    z.object({
      density: z.enum(["comfortable", "compact"]).default("comfortable"),
      localNotifications: z.boolean().default(false),
    }),
  ],
  [
    Visit,
    z.object({
      at: z.codec(z.iso.datetime(), z.date(), {
        decode: (text) => new Date(text),
        encode: (date) => date.toISOString(),
      }),
    }),
  ],
]);
registerStorageKeys([
  [DevicePrefs, { key: "console.device_prefs" }],
  [Visit, { key: "console.visit" }],
]);

/** A backend that records every call and loads `initial`. */
function recorder(initial: readonly [string, string][] = []) {
  const calls: string[] = [];
  const backend: StorageBackend = {
    load: () => initial,
    save: (key, text) => {
      calls.push(`save ${key} ${text}`);
    },
    remove: (key) => {
      calls.push(`remove ${key}`);
    },
  };
  return { backend, calls };
}

describe("createStorageArea", () => {
  it("keeps JSON copies of values", () => {
    const area = createStorageArea();
    const value = { density: "compact", at: new Date("2026-10-24T09:00:00Z") };
    area.set("console.ui", value);
    value.density = "changed";
    expect(area.get("console.ui")).toEqual({ density: "compact", at: "2026-10-24T09:00:00.000Z" });
    expect(area.get("missing")).toBeUndefined();
  });

  it("refuses a value with no JSON form", () => {
    const area = createStorageArea();
    expect(() => area.set("x", undefined)).toThrow(TypeError);
    expect(() => area.set("x", () => 1)).toThrow(TypeError);
    expect(area.has("x")).toBe(false);
  });

  it("lists, deletes and clears", () => {
    const area = createStorageArea();
    area.set("a", 1);
    area.set("b", "two");
    expect(area.has("a")).toBe(true);
    expect(area.keys()).toEqual(["a", "b"]);
    area.delete("a");
    area.delete("a");
    expect(area.keys()).toEqual(["b"]);
    area.clear();
    expect(area.keys()).toEqual([]);
  });

  it("expires a value once its time-to-live has passed", () => {
    freezeClock("2026-10-24T09:00:00Z");
    const area = createStorageArea();
    area.set("catalogue.page_1", [1, 2], { ttl: Duration.minutes(10) });
    freezeClock("2026-10-24T09:09:59Z");
    expect(area.get("catalogue.page_1")).toEqual([1, 2]);
    freezeClock("2026-10-24T09:10:00Z");
    expect(area.has("catalogue.page_1")).toBe(false);
    expect(area.keys()).toEqual([]);
  });

  it("refuses a time-to-live that is not a duration", () => {
    const area = createStorageArea();
    expect(() => area.set("x", 1, { ttl: "soon" as Duration })).toThrow(RangeError);
  });

  it("reads a shape's defaults when nothing is stored", () => {
    const prefs = createStorageArea().read(DevicePrefs);
    expect(prefs).toBeInstanceOf(DevicePrefs);
    expect(prefs).toEqual({ density: "comfortable", localNotifications: false });
  });

  it("writes a shape under its registered key and reads it back", () => {
    const area = createStorageArea();
    area.write(DevicePrefs, { density: "compact", localNotifications: true });
    expect(area.get("console.device_prefs")).toEqual({
      density: "compact",
      localNotifications: true,
    });
    expect(area.read(DevicePrefs)).toEqual({ density: "compact", localNotifications: true });
  });

  it("refuses a value that does not fit the shape and stores nothing", () => {
    const area = createStorageArea();
    expect(() => area.write(DevicePrefs, { density: "huge", localNotifications: false })).toThrow();
    expect(area.has("console.device_prefs")).toBe(false);
  });

  it("falls back to the defaults when the stored value no longer fits", () => {
    const area = createStorageArea();
    area.set("console.device_prefs", { density: "huge" });
    expect(area.read(DevicePrefs)).toEqual({ density: "comfortable", localNotifications: false });
  });

  it("keeps the wire form and decodes on read", () => {
    const area = createStorageArea();
    area.write(Visit, { at: new Date("2026-10-24T09:00:00Z") });
    expect(area.get("console.visit")).toEqual({ at: "2026-10-24T09:00:00.000Z" });
    expect(area.read(Visit).at).toEqual(new Date("2026-10-24T09:00:00Z"));
  });

  it("throws when a shape has a required field and nothing is stored", () => {
    expect(() => createStorageArea().read(Visit)).toThrow();
  });

  it("throws for a class gen registered no key for", () => {
    expect(() => createStorageArea().read(Unregistered)).toThrow(TypeError);
  });

  it("loads a synchronous backend at once and drops untrusted or expired entries", async () => {
    const { backend, calls } = recorder([
      ["a", '{"v":1}'],
      ["junk", "not json"],
      ["shape", '{"value":1}'],
      ["old", '{"v":2,"e":0}'],
    ]);
    const area = createStorageArea(backend);
    expect(area.get("a")).toBe(1);
    expect(area.keys()).toEqual(["a"]);
    await area.flush();
    expect(calls).toEqual(["remove junk", "remove shape", "remove old"]);
  });

  it("loads an asynchronous backend on hydrate, keeping newer writes", async () => {
    const backend: StorageBackend = {
      load: async () => [
        ["a", '{"v":"stored"}'],
        ["b", '{"v":"stored"}'],
      ],
      save: () => undefined,
      remove: () => undefined,
    };
    const area = createStorageArea(backend);
    area.set("b", "newer");
    expect(area.get("a")).toBeUndefined();
    await area.hydrate();
    expect(area.get("a")).toBe("stored");
    expect(area.get("b")).toBe("newer");
  });

  it("rejects hydrate when the backend cannot load", async () => {
    const area = createStorageArea({
      load: async () => {
        throw new Error("blocked");
      },
      save: () => undefined,
      remove: () => undefined,
    });
    await expect(area.hydrate()).rejects.toThrow("blocked");
  });

  it("persists writes in order", async () => {
    const { backend, calls } = recorder();
    const area = createStorageArea(backend);
    area.set("a", 1);
    area.set("b", 2);
    area.delete("a");
    await area.flush();
    expect(calls).toEqual(['save a {"v":1}', 'save b {"v":2}', "remove a"]);
  });

  it("reports a failed write on the next flush only", async () => {
    const area = createStorageArea({
      load: () => [],
      save: () => {
        throw new Error("quota exceeded");
      },
      remove: () => undefined,
    });
    expect(() => area.set("a", 1)).not.toThrow();
    expect(area.get("a")).toBe(1);
    await expect(area.flush()).rejects.toThrow("quota exceeded");
    await expect(area.flush()).resolves.toBeUndefined();
  });
});
