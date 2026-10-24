/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeColorScheme(options)`: a real `ColorSchemeService` seeded with a scheme, a system
 *          preference and a configuration, isolated per call, refusing a scheme the configuration does not offer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import type { ColorScheme } from "@stackra/ui/contracts";

import { ColorSchemeService, ThemingConfig } from "#core/index";
import { fakeColorScheme } from "#testing/functions/fake-color-scheme.function";

class LightDarkThemingConfig extends ThemingConfig {
  override schemes: ColorScheme[] = ["light", "dark"];

  override defaultScheme: ColorScheme = "dark";
}

describe("fakeColorScheme", () => {
  it("is a real service at the defaults", () => {
    const fake = fakeColorScheme();
    expect(fake).toBeInstanceOf(ColorSchemeService);
    expect(fake.state()).toMatchObject({ scheme: "system", resolved: "light" });
  });

  it("seeds the scheme and the system preference", () => {
    expect(fakeColorScheme({ scheme: "light" }).state()).toMatchObject({
      scheme: "light",
      resolved: "light",
    });
    expect(fakeColorScheme({ system: "dark" }).state()).toMatchObject({
      scheme: "system",
      resolved: "dark",
    });
  });

  it("takes a configuration and refuses a scheme it does not offer", () => {
    const config = buildConfig(LightDarkThemingConfig);
    expect(fakeColorScheme({ config }).scheme).toBe("dark");
    expect(() => fakeColorScheme({ config, scheme: "system" })).toThrow(RangeError);
  });

  it("never shares state between calls", () => {
    const first = fakeColorScheme();
    first.setScheme("dark");
    expect(fakeColorScheme().scheme).toBe("system");
  });
});
