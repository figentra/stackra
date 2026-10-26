/**
 * Stackra file contract:
 * Purpose: barrel test of the `./testing` entry: exactly `fakeResolver` and `fakeSettings` as values, and the fake is a `SettingsReader`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingsReader, SettingsResolver } from "#core/index";
import * as testing from "#testing/index";
import type { ResolverFake, SettingsFake, SettingsWrite } from "#testing/index";

describe("@stackra/settings/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeResolver", "fakeSettings"]);
  });

  it("resolves its public types", () => {
    expectTypeOf(testing.fakeSettings).returns.toEqualTypeOf<SettingsFake>();
    expectTypeOf<SettingsFake>().toExtend<SettingsReader>();
    expectTypeOf<SettingsFake["writes"]>().toEqualTypeOf<SettingsWrite[]>();
    expect(testing.fakeSettings()).toBeInstanceOf(SettingsReader);
    expectTypeOf(testing.fakeResolver).returns.toEqualTypeOf<ResolverFake>();
    expect(testing.fakeResolver().resolver).toBeInstanceOf(SettingsResolver);
  });
});
