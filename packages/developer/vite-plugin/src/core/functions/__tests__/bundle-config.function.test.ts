/**
 * Stackra file contract:
 * Purpose: unit tests of `bundleConfig`: plugin order (given, preset, React, bundle); the entry named after the
 *          surface with its exports kept, ES output with hashed names and a relative base; every import-map specifier
 *          external and nothing else; HeroUI Pro external only under `proTypesOnly`.
 * Boundary: test only; the framework plugins are mocked to named markers. The rolldown options are read typed, so
 *           tsc fails if Vite renames them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4); app-shells-edge-and-extension.md 16 (point 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import type { Plugin, PluginOption } from "vite";

import { bundleConfig } from "#core/functions/bundle-config.function";

vi.mock("#core/functions/render-plugins.function", () => ({
  renderPlugins: async () => [{ name: "react" }],
}));

const IMPORT_MAP = {
  imports: { react: "/s/react.js", "react/": "/s/react/", "@stackra/ui": "/s/ui.js" },
};

/** The plugin names of a config. */
function names(plugins: PluginOption[] | undefined): string[] {
  return (plugins ?? []).flat().map((plugin) => (plugin as Plugin).name);
}

describe("bundleConfig", () => {
  it("runs the given plugins, the preset, React and the bundle plugin in order", async () => {
    const config = await bundleConfig({
      surface: "console",
      entry: "src/console.ts",
      importMap: IMPORT_MAP,
      plugins: [{ name: "first" }],
    });
    expect(names(config.plugins)).toEqual([
      "first",
      "stackra:class-components",
      "stackra:generated-modules",
      "stackra:server-only",
      "react",
      "stackra:bundle",
    ]);
  });

  it("builds the surface entry as hashed ES modules with a relative base", async () => {
    const config = await bundleConfig({
      surface: "console",
      entry: "src/console.ts",
      importMap: IMPORT_MAP,
    });
    // Typed access, so tsc catches a rename of these options in Vite's `build.rolldownOptions`.
    const rolldown = config.build?.rolldownOptions;
    expect(config.base).toBe("./");
    expect(rolldown?.input).toEqual({ console: "src/console.ts" });
    expect(rolldown?.preserveEntrySignatures).toBe("strict");
    expect(rolldown?.external).toBeTypeOf("function");
    expect(rolldown?.output).toMatchObject({ format: "es", entryFileNames: "[name].[hash].js" });
  });

  it("leaves every import-map specifier external and nothing else", async () => {
    const config = await bundleConfig({
      surface: "console",
      entry: "src/console.ts",
      importMap: IMPORT_MAP,
    });
    const rolldown = config.build?.rolldownOptions as { external: (id: string) => boolean };
    const external = rolldown.external;
    expect(["react", "react/jsx-runtime", "@stackra/ui"].map(external)).toEqual([true, true, true]);
    expect(["./orders", "@stackra/panel", "@heroui-pro/react"].map(external)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("leaves HeroUI Pro external under proTypesOnly", async () => {
    const config = await bundleConfig({
      surface: "console",
      entry: "src/console.ts",
      importMap: IMPORT_MAP,
      proTypesOnly: true,
    });
    const rolldown = config.build?.rolldownOptions as { external: (id: string) => boolean };
    const external = rolldown.external;
    expect(
      ["@heroui-pro/react", "@stackra/ui-pro", "@stackra/ui-pro/charts"].map(external),
    ).toEqual([true, true, true]);
  });
});
