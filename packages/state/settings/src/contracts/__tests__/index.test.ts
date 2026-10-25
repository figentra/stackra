/**
 * Stackra file contract:
 * Purpose: barrel test of the `./contracts` entry: exactly the port as a value, and its three types resolve.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { SettingLayer, SettingTarget, SettingValue } from "#contracts/index";

describe("@stackra/settings/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["SettingValueStore"]);
  });

  it("resolves its public types", () => {
    expectTypeOf<SettingValue>().toEqualTypeOf<boolean | number | string | null>();
    expectTypeOf<SettingLayer["locked"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SettingTarget["scope"]>().toEqualTypeOf<ScopeRef | undefined>();
    expectTypeOf<SettingTarget["user"]>().toEqualTypeOf<PublicId<"usr"> | undefined>();
  });
});
