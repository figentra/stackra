/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Storage` port: an abstract class that extends `Port`, carries the port brand,
 *          makes a driver implement every area and lifecycle member, names each area by its `StorageArea` code, and is
 *          a container token a test can override.
 * Boundary: test only; the bound driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0256; ADR 0294
 *                     (decisions 16 and 17).
 */
import { Container, Driver } from "@stackra/container";
import { Enum, Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Storage } from "#contracts/ports/storage.port";
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { StorageArea } from "#core/enums/storage-area.enum";

describe("Storage", () => {
  it("is an abstract port", () => {
    expect(new MemoryStorageDriver()).toBeInstanceOf(Port);
    expect(new MemoryStorageDriver()).toBeInstanceOf(Storage);
    expectTypeOf<Storage["~kind"]>().toEqualTypeOf<"port">();
    // @ts-expect-error -- a port is abstract
    const direct = new Storage();
    expect(direct).toBeInstanceOf(Port);
  });

  it("makes a driver implement the areas, store, hydrate and flush", () => {
    // @ts-expect-error -- the six areas, store, hydrate and flush are abstract and not implemented
    class EmptyDriver extends Driver(Storage) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("names each area by its StorageArea code", () => {
    expectTypeOf<Storage[StorageArea]>().toEqualTypeOf<StorageAreaHandle>();
    const storage: Storage = new MemoryStorageDriver();
    for (const area of Enum.values(StorageArea)) expect(storage[area]).toBeDefined();
    expect(storage[StorageArea.Prefs]).toBe(storage.prefs);
  });

  it("is a container token", async () => {
    const storage = new MemoryStorageDriver();
    const container = await Container.create([], { overrides: new Map([[Storage, storage]]) });
    container.get(Storage).prefs.set("theming.scheme", "dark");
    expect(storage.prefs.get("theming.scheme")).toBe("dark");
  });
});
