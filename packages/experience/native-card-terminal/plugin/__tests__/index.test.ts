/**
 * Stackra file contract:
 * Purpose: proves the config plugin chains its three mods and that each applies its pure function, with Expo's
 *          mod helpers replaced by recorders.
 * Boundary: test only; `expo/config-plugins` is mocked, so no Expo install runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

/** A mod helper that runs its action on a fixed `modResults` and records it. */
type Mod = (config: object, action: (mod: { modResults: unknown }) => unknown) => object;

// vi.mock is hoisted above the imports, so what its factory reads is hoisted with it.
const { results, recorder } = vi.hoisted(() => {
  const recorded: Record<string, unknown> = {};
  return {
    results: recorded,
    recorder:
      (name: string, start: () => unknown): Mod =>
      (config, action) => {
        const mod = { modResults: start() };
        action(mod);
        recorded[name] = mod.modResults;
        return config;
      },
  };
});

vi.mock("expo/config-plugins.js", () => ({
  withInfoPlist: recorder("infoPlist", () => ({})),
  withEntitlementsPlist: recorder("entitlements", () => ({})),
  withAndroidManifest: recorder("manifest", () => ({ manifest: {} })),
}));

describe("withStackraCardTerminal", () => {
  it("applies the plist, entitlements and manifest edits", async () => {
    const { default: plugin } = await import("#plugin/index");
    const config = { name: "Till", slug: "till" };
    expect(plugin(config, { isTapToPayEnabled: true })).toBe(config);
    expect(results["infoPlist"]).toMatchObject({ UIBackgroundModes: ["bluetooth-central"] });
    expect(results["entitlements"]).toEqual({
      "com.apple.developer.proximity-reader.payment.acceptance": true,
    });
    expect(results["manifest"]).toMatchObject({
      manifest: { "uses-permission": expect.any(Array) },
    });
  });
});
