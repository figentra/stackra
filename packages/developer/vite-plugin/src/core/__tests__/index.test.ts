/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template's generated Vite configs import `stackra` and call
 *          `stackra.viteConfig(app, options)` with the console's and the web member's option shapes; `stackra` is the
 *          entry's only value.
 * Boundary: test only; imports the stand-in barrel through its alias. The option literals mirror the template's
 *           generated `.stackra/vite.config.ts` files and are type-checked, not run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { AppDefinition } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { Plugin, UserConfig } from "vite";

import * as entry from "#core/index";
import type { ViteConfigOptions } from "#core/index";

describe("@stackra/vite-plugin", () => {
  it("exports exactly stackra", () => {
    expect(Object.keys(entry)).toEqual(["stackra"]);
  });

  it("types the preset and the generated config's call", () => {
    expectTypeOf(entry.stackra).returns.toEqualTypeOf<Plugin[]>();
    expectTypeOf(entry.stackra.viteConfig).parameters.toEqualTypeOf<
      [app: AppDefinition, options: ViteConfigOptions]
    >();
    expectTypeOf(entry.stackra.viteConfig).returns.toEqualTypeOf<Promise<UserConfig>>();
  });

  it("accepts the console's and the web member's generated options", () => {
    expectTypeOf({
      mode: "pwa",
      plugins: [{ name: "stackra:class-components" }],
      pages: {
        en: { html: ".stackra/index.html", path: "/" },
        "en-US": { html: ".stackra/en-us/index.html", path: "/en-us/" },
        ar: { html: ".stackra/ar/index.html", path: "/ar/" },
        "ar-SA": { html: ".stackra/ar-sa/index.html", path: "/ar-sa/" },
      },
      entry: ".stackra/entry/browser.ts",
      define: { "import.meta.env.VITE_SENTRY_DSN": '""' },
      prerender: { entry: ".stackra/entry/offline.ts", routes: ["/offline", "/ar/offline"] },
      pwa: {
        strategies: "injectManifest",
        srcDir: ".stackra",
        filename: "sw.ts",
        manifests: [".stackra/pwa/manifest.en.webmanifest"],
        additionalManifestEntries: "prerender",
      },
      desktop: { base: "./", outDir: "dist/renderer" },
      budgets: { entryKb: 200, routeKb: 100 },
      build: { target: "safari17", sourcemap: "hidden", assetsInlineLimit: 0 },
      sourcemaps: { upload: "sentry", project: "acme-console" },
    } as const).toExtend<ViteConfigOptions>();
    expectTypeOf({
      mode: "production",
      target: "web",
      render: "server" as unknown,
      budgets: { entryKb: 200, routeKb: 100 },
      sourcemaps: { upload: "sentry", project: "acme-web" },
      buildTime: true,
    } as const).toExtend<ViteConfigOptions>();
  });
});
