/**
 * Stackra file contract:
 * Purpose: `RouteOptions`, what `Route({...})` takes: the path and the layout, the title and tab, the gates (session,
 *          permission, flag, capability), the shapes of `params` and `search`, the static head, the web render mode and
 *          prerender flag, the native presentation and chrome, a document the route renders, and the offline cache.
 * Boundary: a type only; every option is static data gen reads from the syntax tree. The route key, the derived
 *           permission of a route with a loader and the title of a route that sets none are derived, not options.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 16 and 20); ADR 0295 (decision 12); ADR 0297; ADR 0301 (the SEO chain).
 */
import type { AnyClass } from "@stackra/container";
import type { FlagRef } from "@stackra/feature-flags";
import type { Capability } from "@stackra/platform";
import type { Seo } from "@stackra/seo";
import type { Schema } from "@stackra/validation";

import type { Layout } from "#core/bases/layout.base";
import type { Presentation } from "#core/enums/presentation.enum";
import type { RenderMode } from "#core/enums/render-mode.enum";
import type { RouteCache } from "#core/types/route-cache.type";
import type { RouteChrome } from "#core/types/route-chrome.type";
import type { RouteTab } from "#core/types/route-tab.type";

/** The options of a route class. */
export interface RouteOptions {
  /** Absolute, with a leading slash (`/store/:slug`, `/m/*`), or `*` for a catch-all; mounted under every locale. */
  readonly path?: string;

  /** The layout class the route renders inside. */
  readonly layout?: AnyClass<Layout>;

  /** The i18n key of the title the tab, the breadcrumb and the native header show. */
  readonly title?: string;

  /** The tab bar entry; with a layout it makes the route a tab root. */
  readonly tab?: RouteTab;

  /** `false` mounts the route without a session (the signed-out tree on native). Defaults to `true`. */
  readonly auth?: boolean;

  /** The permission of a route with no loader to derive one from. */
  readonly permission?: string;

  /** Hides the route and every entry point to it while the flag is off. */
  readonly flag?: FlagRef;

  /** Capabilities the route needs: `{ scanner: Capability.Required }` fails gen for a target without the scanner. */
  readonly capability?: Partial<Record<Capability, Capability>>;

  /** The HTTP status the page answers with (`404` for a catch-all). */
  readonly status?: number;

  /** The shape class of the path parameters; validates a deep link before mount. */
  readonly params?: AnyClass<Schema>;

  /** The shape class of the query string; types `ctx.search` and the page's `search`, garbage dropped. */
  readonly search?: AnyClass<Schema>;

  /** The static head (a title key); `meta(ctx)` adds what depends on the loader's data. */
  readonly seo?: Seo;

  /** Where the web page renders; the app's `render` when left out. */
  readonly render?: RenderMode;

  /** Renders the page at build time once per locale. */
  readonly prerender?: boolean;

  /** How the native route is shown over the one below it; pushed when left out. */
  readonly presentation?: Presentation;

  /** The native chrome of this screen over `ChromeConfig`. */
  readonly chrome?: RouteChrome;

  /** A document class the route renders: the tenant's published version, or the class itself. */
  readonly document?: AnyClass;

  /** How long the persisted query cache serves the route offline. */
  readonly cache?: RouteCache;
}
