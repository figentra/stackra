/**
 * Stackra file contract:
 * Purpose: unit tests of `moduleRef`: a consumed module that also names its producing service, still a container module
 *          with its key, and the refused service key.
 * Boundary: test only; the modules restate the template's `apps/mobile` imports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0305 (consumed modules by name).
 */
import { kindOf, Module } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { moduleRef } from "#core/functions/module-ref.function";

class DevicesModule extends moduleRef("identity", "devices") {}

class MobileModule extends Module({ imports: [DevicesModule] }) {}

describe("moduleRef", () => {
  it("names the service and the module key", () => {
    expect(DevicesModule.service).toBe("identity");
    expect(DevicesModule.key).toBe("devices");
  });

  it("is a container module an app imports by name", () => {
    expect(kindOf(DevicesModule)?.kind).toBe("module");
    expect(kindOf(MobileModule)?.options["imports"]).toEqual([DevicesModule]);
  });

  it("refuses a service key that is not snake_case", () => {
    expect(() => moduleRef("Identity", "devices")).toThrow(RangeError);
  });
});
