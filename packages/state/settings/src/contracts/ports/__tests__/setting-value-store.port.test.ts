/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `SettingValueStore` port: an abstract class extending `Port`, its own token, and
 *          a driver of it is an instance of it with the three methods typed as the port declares.
 * Boundary: test only; the driver is a minimal stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 15 and 16); ADR 0263.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingValueStore } from "#contracts/ports/setting-value-store.port";
import type { SettingLayer, SettingTarget, SettingValue } from "#contracts/index";

/** A store that holds nothing. */
class EmptySettingValueStoreDriver extends Driver(SettingValueStore) {
  async layers(): Promise<readonly SettingLayer[]> {
    return [];
  }

  async write(): Promise<void> {}

  async remove(): Promise<void> {}
}

describe("SettingValueStore", () => {
  it("is a port that a driver extends", () => {
    const store = new EmptySettingValueStoreDriver();
    expect(store).toBeInstanceOf(SettingValueStore);
    expect(store).toBeInstanceOf(Port);
  });

  it("answers no layer for an empty store", async () => {
    await expect(new EmptySettingValueStoreDriver().layers()).resolves.toEqual([]);
  });

  it("types its three methods", () => {
    expectTypeOf<SettingValueStore["layers"]>().parameters.toEqualTypeOf<[string, SettingTarget]>();
    expectTypeOf<SettingValueStore["write"]>().parameters.toEqualTypeOf<
      [
        string,
        SettingTarget,
        Readonly<Record<string, SettingValue>>,
        (readonly string[] | undefined)?,
      ]
    >();
    expectTypeOf<SettingValueStore["remove"]>().parameters.toEqualTypeOf<
      [string, SettingTarget, readonly string[]]
    >();
    expectTypeOf<SettingValueStore["~key"]>().toEqualTypeOf<"settings.SettingValueStore">();
  });
});
