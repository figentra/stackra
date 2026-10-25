/**
 * Stackra file contract:
 * Purpose: `ViteConfigOptions`, what the generated `.stackra/vite.config.ts` passes to `stackra.viteConfig(app, ...)`
 *          beside the member's `stackra.config.ts`: the Vite mode and target, the plugins that run first, the
 *          per-locale pages, the entry, the dev server and `define` map from runway, the prerendered routes, the PWA
 *          service worker build, the desktop renderer output, the bundle budgets, Vite's build block, the source map
 *          upload and the build time.
 * Boundary: a type only. Every value is written by gen from the member's config, runway and kind classes, so no key
 *           here is one an author types; the service worker strategy is owned (`injectManifest` over gen's `sw.ts`).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: generated tool configs), ADR 0255 (the PWA build), ADR 0297 (web on
 *                     Workers, locale URLs), ADR 0296 (decision 1: the dev server from runway), ADR 0261 (decision 4).
 */
import type { Target } from "@stackra/contracts";
import type { Locale } from "@stackra/i18n";
import type { DevServerOptions } from "@stackra/runway/node";
import type { PluginOption, UserConfig } from "vite";

/** The options of `stackra.viteConfig`. */
export type ViteConfigOptions = {
  /** Vite's mode. A target code (`web`, `pwa`, `desktop`, from `stackra build --target`) also picks the target. */
  readonly mode: string;
  /**
   * The target to build; by default the mode when it is a target code, otherwise the app's first target. Undefined is
   * accepted so a config can pass `app.targets[0]` as it is.
   */
  readonly target?: Target | undefined;
  /**
   * The app's render mode, a `RenderMode` code of @stackra/navigation (`app.render`). `server` renders every page on
   * Cloudflare Workers through React Router framework mode; anything else, or none, builds a single-page app.
   */
  readonly render?: unknown;
  /** Plugins that run before the preset's, such as `classComponents()` from `@stackra/gen/node`. */
  readonly plugins?: readonly PluginOption[];
  /**
   * One HTML page per locale: the generated file and the URL prefix it answers (`/`, `/ar-sa/`). The dev server
   * serves each page under its prefix and the build writes it to `<prefix>index.html`.
   */
  readonly pages?: Readonly<
    Partial<Record<Locale, { readonly html: string; readonly path: `/${string}` }>>
  >;
  /** The generated browser entry, the build input when there are no pages (`.stackra/entry/browser.ts`). */
  readonly entry?: string;
  /** The dev server block, `devServer(member)` from `@stackra/runway/node`. */
  readonly server?: DevServerOptions;
  /** The bundler `define` map, `definesFor(member, environment)` from `@stackra/runway/node`. */
  readonly define?: Readonly<Record<string, string>>;
  /**
   * Static documents written after the client build: `entry` is bundled for the browser (it hydrates the page) and
   * also imported in Node, where its `render(url, assets)` export returns each route's HTML.
   */
  readonly prerender?: { readonly entry: string; readonly routes: readonly string[] };
  /** The PWA target's service worker, built from gen's worker source; ignored for every other target. */
  readonly pwa?: {
    /** Owned: the worker source is gen's, and the precache manifest is injected into it. */
    readonly strategies: "injectManifest";
    /** The folder of the worker source, relative to the member root. */
    readonly srcDir: string;
    /** The worker source file inside `srcDir` (`sw.ts`, built to `sw.js`). */
    readonly filename: string;
    /** The generated per-locale web manifests, served and emitted at the site root under their file names. */
    readonly manifests?: readonly string[];
    /** `prerender`: the prerendered documents join the precache; without it they are left out of it. */
    readonly additionalManifestEntries?: "prerender";
  };
  /** The desktop target's renderer: a relative base (`./`, for `app://`) and its output folder. */
  readonly desktop?: { readonly base: string; readonly outDir: string };
  /** Gzipped size limits in kilobytes; a chunk over its limit fails the build. */
  readonly budgets?: { readonly entryKb: number; readonly routeKb: number };
  /** Vite's build block (target, source maps, inline limit), merged under the preset's input and output folder. */
  readonly build?: UserConfig["build"];
  /** Source map upload after the build; the token and organisation are the release job's environment, never here. */
  readonly sourcemaps?: { readonly upload: "sentry"; readonly project: string };
  /** Defines `__BUILD_TIME__` as the build's ISO timestamp. */
  readonly buildTime?: boolean;
};
