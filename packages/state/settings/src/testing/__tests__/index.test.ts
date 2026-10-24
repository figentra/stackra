/**
 * Stackra file contract:
 * Purpose: barrel test of the `./testing` entry: exactly `fakeSettings` as a value, and the fake is a `SettingsReader`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingsReader } from "#core/index";
import * as testing from "#testing/index";
import type { SettingsFake, SettingsWrite } from "#testing/index";

describe("@stackra/settings/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeSettings"]);
  });

  it("resolves its public types", () => {
    expectTypeOf(testing.fakeSettings).returns.toEqualTypeOf<SettingsFake>();
    expectTypeOf<SettingsFake>().toExtend<SettingsReader>();
    expectTypeOf<SettingsFake["writes"]>().toEqualTypeOf<SettingsWrite[]>();
    expect(testing.fakeSettings()).toBeInstanceOf(SettingsReader);
  });
});
