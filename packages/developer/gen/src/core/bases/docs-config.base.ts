/**
 * Stackra file contract:
 * Purpose: `DocsConfig`, the typed site configuration of a docs app: `src/config/docs.config.ts` exports one subclass,
 *          and gen renders the Mintlify `docs.json` of `.stackra/site/` from it. It holds the site name, theme,
 *          colours, logo and favicon (paths under `src/assets`), the tabs and navigation groups, the navbar and
 *          footer, the services whose API reference the site carries, and `raw`, the Mintlify keys gen does not own
 *          (fonts, appearance, SEO, search, …).
 * Boundary: data only: field initializers, no method, no environment read. Gen imports the file and reads the fields
 *           of a new instance; nothing else in it runs. It lives in `@stackra/gen` because only gen reads it, and every
 *           docs app already has gen as a dev dependency; no runtime package carries it (decision recorded in the
 *           ADR 0002 amendment of 2026-10-27).
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decisions 3 and 4: a tool's shape minus the keys
 *                     Stackra owns, `raw` for the rest; a Config class in `src/config/`); STA-1316.
 */
import type { Json } from "@stackra/contracts";

import type { DocsLink } from "#core/types/docs-link.type";
import type { DocsTab } from "#core/types/docs-tab.type";

/**
 * The site configuration of a docs app.
 *
 * @example
 * export class HandbookDocsConfig extends DocsConfig {
 *   override readonly name = "Handbook";
 *   override readonly colors = { primary: "#0B0D0F" };
 *   override readonly navigation = [{ tab: "Guides", groups: [{ group: "Start", pages: ["index"] }] }];
 * }
 */
export abstract class DocsConfig {
  /** The site name. */
  abstract readonly name: string;

  /** One sentence for search engines and the site header. */
  readonly description?: string;

  /** The Mintlify theme. */
  readonly theme: string = "mint";

  /** The brand colours. */
  abstract readonly colors: {
    readonly primary: string;
    readonly light?: string;
    readonly dark?: string;
  };

  /** The logo for light and dark mode, as paths under `src/assets` (`logo/light.svg`). */
  readonly logo?: { readonly light: string; readonly dark: string; readonly href?: string };

  /** The favicon, a path under `src/assets`. */
  readonly favicon?: string;

  /** The tabs, in order. */
  abstract readonly navigation: readonly DocsTab[];

  /** The navbar links and its one primary button. */
  readonly navbar?: { readonly links?: readonly DocsLink[]; readonly primary?: DocsLink };

  /** The footer: social profile URLs by network, and link columns. */
  readonly footer?: {
    readonly socials?: Readonly<Record<string, string>>;
    readonly links?: readonly { readonly header: string; readonly items: readonly DocsLink[] }[];
  };

  /** The service keys whose API reference the site carries, from each service's committed manifest. */
  readonly apiReference: readonly string[] = [];

  /** Mintlify keys gen does not own, passed through as they are; an owned key here is refused. */
  readonly raw: Readonly<Record<string, Json>> = {};
}
