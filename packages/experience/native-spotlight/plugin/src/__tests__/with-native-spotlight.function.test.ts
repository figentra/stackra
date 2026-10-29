/**
 * Stackra file contract:
 * Purpose: unit tests of `withNativeSpotlight`: the config plugin is the entry's default export and leaves the app
 *          config as it is.
 * Boundary: test only; a plain config object, no Expo CLI.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0478 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import plugin from "../index";
import { withNativeSpotlight } from "../with-native-spotlight.function";

describe("withNativeSpotlight", () => {
  it("is the default export and changes nothing", () => {
    const config = { name: "Figentra", slug: "figentra" };
    expect(plugin).toBe(withNativeSpotlight);
    expect(withNativeSpotlight(config)).toBe(config);
  });
});
