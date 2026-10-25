/**
 * Stackra file contract:
 * Purpose: `viteConfig(app, options)`, reached as `stackra.viteConfig`: one Vite config from a member's
 *          `stackra.config.ts` and the options gen writes into `.stackra/vite.config.ts`. It picks the target, runs
 *          the given plugins first, then the preset's own plugins, the render mode's framework plugins, the
 *          per-locale pages, the PWA's manifests and service worker, the budgets, the prerender and the source map
 *          upload, and sets the dev server, `define`, the build input, the desktop base and output folder.
 * Boundary: a target the app does not declare, a page under an unknown locale and a page prefix that is not a
 *           `/…/` folder all fail before Vite starts. A server-rendered member's input is React Router's, so no input
 *           is set for it. Every value comes from gen's options; nothing is read from the environment here.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: generated tool configs), ADR 0249 (web, PWA and desktop targets), ADR
 *                     0297, ADR 0255, ADR 0261 (decision 4), ADR 0305 (rule 40).
 */
import { Enum, Target } from "@stackra/contracts";
import type { AppDefinition } from "@stackra/contracts";
import { Locale } from "@stackra/i18n";
import type { PluginOption, UserConfig } from "vite";

import { budgetsPlugin } from "#core/functions/budgets-plugin.function";
import { corePlugins } from "#core/functions/core-plugins.function";
import { manifestsPlugin } from "#core/functions/manifests-plugin.function";
import { pagesPlugin } from "#core/functions/pages-plugin.function";
import { prerenderPlugin } from "#core/functions/prerender-plugin.function";
import { pwaPlugin } from "#core/functions/pwa-plugin.function";
import { renderPlugins } from "#core/functions/render-plugins.function";
import { sentryPlugin } from "#core/functions/sentry-plugin.function";
import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/** The `RenderMode` code of @stackra/navigation for pages rendered on the Worker. */
const SERVER_RENDER = "server";

/** The target to build: the explicit one, else the mode when it is a target code, else the app's first. */
function targetOf(app: AppDefinition, options: ViteConfigOptions): Target {
  const codes: readonly string[] = Enum.values(Target);
  const target =
    options.target ?? (codes.includes(options.mode) ? (options.mode as Target) : app.targets[0]);
  if (target === undefined || !app.targets.includes(target)) {
    throw new RangeError(
      `"${target ?? options.mode}" is not a target of this app: stackra.config.ts declares ${app.targets.join(", ") || "none"}`,
    );
  }
  return target;
}

/** The pages as a checked list: known locales and `/…/` prefixes only. */
function pagesOf(
  pages: NonNullable<ViteConfigOptions["pages"]>,
): { readonly locale: string; readonly html: string; readonly path: string }[] {
  const locales: readonly string[] = Enum.values(Locale);
  return Object.entries(pages).flatMap(([locale, page]) => {
    if (page === undefined) return [];
    if (!locales.includes(locale)) {
      throw new RangeError(`"${locale}" is not a locale: expected one of ${locales.join(", ")}`);
    }
    if (!page.path.endsWith("/")) {
      throw new RangeError(`The ${locale} page's path "${page.path}" must start and end with "/"`);
    }
    return [{ locale, html: page.html, path: page.path }];
  });
}

/**
 * The Vite config of a member.
 *
 * @param app - the member's `stackra.config.ts` default export.
 * @param options - the options gen writes; see `ViteConfigOptions`.
 * @throws RangeError when the target is not the app's, a page's locale is unknown or its path is not a folder.
 * @example
 * export default defineConfig(({ mode }) =>
 *   stackra.viteConfig(app, { mode, entry: ".stackra/entry/browser.ts", server: devServer("console") }),
 * );
 */
export async function viteConfig(
  app: AppDefinition,
  options: ViteConfigOptions,
): Promise<UserConfig> {
  const target = targetOf(app, options);
  const isServerRendered = options.render === SERVER_RENDER;
  const pages = options.pages === undefined ? [] : pagesOf(options.pages);
  const pwa = target === Target.Pwa ? options.pwa : undefined;
  const desktop = target === Target.Desktop ? options.desktop : undefined;
  const given = options.plugins ?? [];

  const plugins: PluginOption[] = [
    ...given,
    ...corePlugins(given),
    ...(await renderPlugins(isServerRendered)),
  ];
  if (pages.length > 0) plugins.push(pagesPlugin(pages));
  if (pwa?.manifests !== undefined) plugins.push(manifestsPlugin(pwa.manifests));
  if (options.budgets !== undefined) plugins.push(budgetsPlugin(options.budgets));
  if (options.prerender !== undefined) plugins.push(prerenderPlugin(options.prerender));
  if (pwa !== undefined) plugins.push(await pwaPlugin(pwa, options.prerender?.routes ?? []));
  if (options.sourcemaps !== undefined) plugins.push(await sentryPlugin(options.sourcemaps));

  const inputs: Record<string, string> = Object.fromEntries(
    pages.map(({ locale, html }) => [locale, html]),
  );
  if (pages.length === 0 && options.entry !== undefined) inputs["main"] = options.entry;
  if (options.prerender !== undefined) inputs["prerender"] = options.prerender.entry;
  const hasInput = !isServerRendered && Object.keys(inputs).length > 0;

  return {
    plugins,
    ...(desktop === undefined ? {} : { base: desktop.base }),
    ...(options.server === undefined ? {} : { server: options.server }),
    define: {
      ...options.define,
      ...(options.buildTime === true
        ? { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) }
        : {}),
    },
    build: {
      ...options.build,
      ...(desktop === undefined ? {} : { outDir: desktop.outDir }),
      ...(hasInput
        ? { rolldownOptions: { ...options.build?.rolldownOptions, input: inputs } }
        : {}),
    },
  };
}
