/**
 * Stackra file contract:
 * Purpose: barrel test of the `./react` entry: exactly `useSetting` and the web form at run time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";
import { useSetting } from "#react/setting/use-setting";
import { SettingsForm } from "#react/settings-form/settings-form";

describe("@stackra/settings/react", () => {
  it("exports exactly the hook and the form", () => {
    expect(Object.keys(react).sort()).toEqual(["SettingsForm", "useSetting"]);
    expect(react.SettingsForm).toBe(SettingsForm);
    expect(react.useSetting).toBe(useSetting);
  });
});
