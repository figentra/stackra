/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./native` entry of @stackra/theming: the appearance driver only.
 * Boundary: test only; react-native is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";
import * as native from "#native/index";

vi.mock("react-native", () => ({ Appearance: {} }));

describe("@stackra/theming/native", () => {
  it("exports exactly the appearance driver", () => {
    expect(Object.keys(native)).toEqual(["AppearanceSystemColorSchemeDriver"]);
    expect(native.AppearanceSystemColorSchemeDriver).toBe(AppearanceSystemColorSchemeDriver);
  });
});
