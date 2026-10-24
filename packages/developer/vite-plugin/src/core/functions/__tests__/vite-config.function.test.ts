/**
 * Stackra file contract:
 * Purpose: unit tests of `viteConfig`: the target from the option, the mode or the app's first target, and refused
 *          when the app does not declare it; plugin order (given, preset, render mode, pages, manifests, budgets,
 *          prerender, PWA, source maps); per-target PWA and desktop handling; the build input from pages, entry and
 *          prerender, none for a server-rendered member; `define` with the build time; and the page checks.
 * Boundary: test only; the framework, PWA and Sentry plugins are mocked to named markers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); ADR 0249; ADR 0297.
 */
import { ApiArea, Target } from "@stackra/contracts";
import type { AppDefinition } from "@stackra/contracts";
import { describe, expect, it, vi } from "@stackra/testing";
import type { Plugin, PluginOption } from "vite";

import { viteConfig } from "#core/functions/vite-config.function";

vi.mock("#core/functions/render-plugins.function", () => ({
  renderPlugins: async (isServerRendered: boolean) =>
    isServerRendered ? [{ name: "react-router" }] : [{ name: "react" }],
}));
vi.mock("#core/functions/pwa-plugin.function", () => ({
  pwaPlugin: async () => ({ name: "vite-plugin-pwa" }),
}));
vi.mock("#core/functions/sentry-plugin.function", () => ({
  sentryPlugin: async () => ({ name: "sentry" }),
}));

const CONSOLE: AppDefinition = {
  targets: [Target.Web, Target.Pwa, Target.Desktop],
  area: ApiArea.App,
};

const PAGES = {
  en: { html: ".stackra/index.html", path: "/" },
  "ar-SA": { html: ".stackra/ar-sa/index.html", path: "/ar-sa/" },
} as const;

/** The plugin names of a config. */
function names(plugins: PluginOption[] | undefined): string[] {
  return (plugins ?? []).flat().map((plugin) => (plugin as Plugin).name);
}

describe("viteConfig", () => {
  it("takes the target from the mode when it is a target code", async () => {
    const config = await viteConfig(CONSOLE, {
      mode: "desktop",
      desktop: { base: "./", outDir: "dist/renderer" },
    });
    expect(config.base).toBe("./");
    expect(config.build?.outDir).toBe("dist/renderer");
  });

  it("uses the explicit target, else the app's first", async () => {
    const pwa = { strategies: "injectManifest", srcDir: ".stackra", filename: "sw.ts" } as const;
    expect(names((await viteConfig(CONSOLE, { mode: "production", pwa })).plugins)).not.toContain(
      "vite-plugin-pwa",
    );
    expect(
      names((await viteConfig(CONSOLE, { mode: "production", target: Target.Pwa, pwa })).plugins),
    ).toContain("vite-plugin-pwa");
  });

  it("refuses a target the app does not declare", async () => {
    await expect(viteConfig(CONSOLE, { mode: "ios" })).rejects.toThrow(
      /"ios" is not a target of this app: stackra.config.ts declares web, pwa, desktop/,
    );
  });

  it("orders the plugins: given, preset, render mode, then the build's own", async () => {
    const config = await viteConfig(CONSOLE, {
      mode: "pwa",
      plugins: [{ name: "stackra:class-components" }],
      pages: PAGES,
      pwa: {
        strategies: "injectManifest",
        srcDir: ".stackra",
        filename: "sw.ts",
        manifests: [".stackra/pwa/manifest.en.webmanifest"],
      },
      budgets: { entryKb: 200, routeKb: 100 },
      prerender: { entry: ".stackra/entry/offline.ts", routes: ["/offline"] },
      sourcemaps: { upload: "sentry", project: "acme-console" },
    });
    expect(names(config.plugins)).toEqual([
      "stackra:class-components",
      "stackra:generated-modules",
      "stackra:server-only",
      "react",
      "stackra:pages",
      "stackra:manifests",
      "stackra:budgets",
      "stackra:prerender",
      "vite-plugin-pwa",
      "sentry",
    ]);
  });

  it("builds every page and the prerender entry, or the entry when there are no pages", async () => {
    const paged = await viteConfig(CONSOLE, {
      mode: "web",
      pages: PAGES,
      entry: ".stackra/entry/browser.ts",
      prerender: { entry: ".stackra/entry/offline.ts", routes: ["/offline"] },
      build: { target: "safari17", rolldownOptions: { treeshake: true } },
    });
    expect(paged.build).toEqual({
      target: "safari17",
      rolldownOptions: {
        treeshake: true,
        input: {
          en: ".stackra/index.html",
          "ar-SA": ".stackra/ar-sa/index.html",
          prerender: ".stackra/entry/offline.ts",
        },
      },
    });

    const single = await viteConfig(CONSOLE, { mode: "web", entry: ".stackra/entry/browser.ts" });
    expect(single.build?.rolldownOptions?.input).toEqual({ main: ".stackra/entry/browser.ts" });
  });

  it("leaves the input to React Router for a server-rendered member", async () => {
    const web: AppDefinition = { targets: [Target.Web], area: ApiArea.Public, render: "server" };
    const config = await viteConfig(web, {
      mode: "production",
      render: web["render"],
      entry: ".stackra/entry/browser.ts",
      build: { target: "safari17" },
    });
    expect(names(config.plugins)).toContain("react-router");
    expect(names(config.plugins)).not.toContain("react");
    expect(config.build).toEqual({ target: "safari17" });
  });

  it("passes the dev server and merges define with the build time", async () => {
    const server = {
      port: 5173,
      host: "localhost",
      strictPort: true,
      open: false,
      hmr: { port: 5174 },
    } as const;
    const config = await viteConfig(CONSOLE, {
      mode: "web",
      server,
      define: { "import.meta.env.VITE_SENTRY_DSN": '""' },
      buildTime: true,
    });
    expect(config.server).toBe(server);
    expect(config.define?.["import.meta.env.VITE_SENTRY_DSN"]).toBe('""');
    expect(new Date(JSON.parse(String(config.define?.["__BUILD_TIME__"]))).getTime()).not.toBeNaN();
  });

  it("refuses an unknown locale and a page path that is not a folder", async () => {
    await expect(
      viteConfig(CONSOLE, {
        mode: "web",
        pages: { fr: { html: ".stackra/fr/index.html", path: "/fr/" } } as never,
      }),
    ).rejects.toThrow(/"fr" is not a locale/);
    await expect(
      viteConfig(CONSOLE, {
        mode: "web",
        pages: { ar: { html: ".stackra/ar/index.html", path: "/ar" } },
      }),
    ).rejects.toThrow(/must start and end with "\/"/);
  });
});
