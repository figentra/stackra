/**
 * Stackra file contract:
 * Purpose: type tests of `StorageAreaHandle`: `get` gives JSON, `read` gives an instance of the shape class it is
 *          given, and `write` takes only a value of that class.
 * Boundary: test only; type assertions, plus one runtime check on the memory driver's area.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decision 4).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { registerStorageKeys } from "#core/functions/register-storage-keys.function";

class DevicePrefs {
  density = "comfortable";
}

registerStorageKeys([[DevicePrefs, { key: "device_prefs" }]]);
registerSchemas([
  [
    DevicePrefs,
    z.strictObject({ density: z.enum(["comfortable", "compact"]).default("comfortable") }),
  ],
]);

describe("StorageAreaHandle", () => {
  it("types values as JSON and shapes by their class", () => {
    expectTypeOf<StorageAreaHandle["get"]>().returns.toEqualTypeOf<Json | undefined>();
    expectTypeOf<StorageAreaHandle["read"]>().toBeCallableWith(DevicePrefs);
    expectTypeOf<ReturnType<StorageAreaHandle["keys"]>>().toEqualTypeOf<string[]>();
    const handle: StorageAreaHandle = new MemoryStorageDriver().prefs;
    expectTypeOf(handle.read(DevicePrefs)).toEqualTypeOf<DevicePrefs>();
    // @ts-expect-error -- a value of another shape is refused
    expect(() => handle.write(DevicePrefs, { other: 1 })).toThrow();
  });
});
