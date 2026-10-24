/**
 * Stackra file contract:
 * Purpose: `renderPlugins`, the framework plugins of a web member by its render mode: Tailwind v4 always; a
 *          single-page app adds React (Fast Refresh, automatic JSX); a server-rendered member adds the Cloudflare
 *          Workers runtime for the `ssr` environment over gen's `.stackra/wrangler.jsonc` and React Router framework
 *          mode, which brings its own React handling.
 * Boundary: the Worker and React Router plugins load only for a server-rendered member, so a single-page app never
 *           imports them. Their configuration is gen's files (`wrangler.jsonc`, `react-router.config.ts`); this
 *           function passes no option an author could set.
 * Runtime: node
 * Governing contract: ADR 0297 (decisions 1 and 2: web renders on Workers through React Router framework mode),
 *                     ADR 0165 (Vite with React Router 7 framework mode), ADR 0295 (decision 5).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";

/** gen's Wrangler config, relative to the member root. */
const WRANGLER_CONFIG = ".stackra/wrangler.jsonc";

/**
 * The framework plugins for the render mode.
 *
 * @param isServerRendered - true for `RenderMode.Server` (pages rendered on the Worker).
 * @example
 * await renderPlugins(false); // [react(), tailwindcss()]
 * await renderPlugins(true); // [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()]
 */
export async function renderPlugins(isServerRendered: boolean): Promise<PluginOption[]> {
  if (!isServerRendered) return [react(), tailwindcss()];
  const [{ cloudflare }, { reactRouter }] = await Promise.all([
    import("@cloudflare/vite-plugin"),
    import("@react-router/dev/vite"),
  ]);
  return [
    cloudflare({ configPath: WRANGLER_CONFIG, viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ];
}
