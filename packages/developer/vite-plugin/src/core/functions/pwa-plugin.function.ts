/**
 * Stackra file contract:
 * Purpose: `pwaPlugin`, the PWA target's service worker build through `vite-plugin-pwa`: gen's worker source
 *          (`.stackra/sw.ts`) compiled with the precache manifest injected (`injectManifest`), the shell, the hashed
 *          assets, the per-locale pages and manifests precached, and the prerendered documents in or out of the
 *          precache as `additionalManifestEntries` says.
 * Boundary: no manifest is generated (`manifest: false`; gen writes one per locale, served by the manifests plugin)
 *           and no registration script is injected (`injectRegister: false`; the app's platform layer registers the
 *           worker and owns the update prompt). Loaded only for the PWA target.
 * Runtime: node
 * Governing contract: ADR 0255 (decisions 1 and 2: vite-plugin-pwa, origin scope), ADR 0295 (decision 5: the service
 *                     worker is owned, never a section key).
 */
import type { PluginOption } from "vite";

import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/**
 * The service worker plugin.
 *
 * @param pwa - the worker source and the precache choice.
 * @param prerendered - the prerendered routes, precached only with `additionalManifestEntries: "prerender"`.
 * @example
 * await pwaPlugin({ strategies: "injectManifest", srcDir: ".stackra", filename: "sw.ts" }, ["/offline"]);
 */
export async function pwaPlugin(
  pwa: NonNullable<ViteConfigOptions["pwa"]>,
  prerendered: readonly string[],
): Promise<PluginOption> {
  const { VitePWA } = await import("vite-plugin-pwa");
  const isPrerenderPrecached = pwa.additionalManifestEntries === "prerender";
  return VitePWA({
    strategies: pwa.strategies,
    srcDir: pwa.srcDir,
    filename: pwa.filename,
    manifest: false,
    injectRegister: false,
    injectManifest: {
      globPatterns: ["**/*.{js,css,html,webmanifest,svg,png,webp,woff2}"],
      globIgnores: isPrerenderPrecached
        ? []
        : prerendered.map((route) => `${route.replace(/^\/+|\/+$/g, "")}/index.html`),
    },
  });
}
