/**
 * Stackra file contract:
 * Purpose: barrel test of the `./contracts` entry: exactly its ports and enums as values, and its types resolve.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  PromotionDiff,
  SettingFloor,
  SettingLayer,
  SettingRevision,
  SettingTarget,
  SettingValue,
  SettingsPack,
} from "#contracts/index";

describe("@stackra/settings/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Promotable",
      "PromotionDiff$",
      "SettingEntitlementSource",
      "SettingEnvironment",
      "SettingFloorSource",
      "SettingRevisionStatus",
      "SettingRevisionStore",
      "SettingSource",
      "SettingValueStore",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<SettingValue>().toEqualTypeOf<boolean | number | string | null>();
    expectTypeOf<SettingLayer["locked"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SettingLayer["holder"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SettingTarget["scope"]>().toEqualTypeOf<ScopeRef | undefined>();
    expectTypeOf<SettingTarget["user"]>().toEqualTypeOf<PublicId<"usr"> | undefined>();
    expectTypeOf<SettingFloor["value"]>().toEqualTypeOf<number | boolean>();
    expectTypeOf<SettingRevision["removed"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SettingsPack["groups"]>().toEqualTypeOf<Readonly<Record<string, SettingLayer>>>();
    expectTypeOf<PromotionDiff["base"]>().toEqualTypeOf<string>();
  });
});
