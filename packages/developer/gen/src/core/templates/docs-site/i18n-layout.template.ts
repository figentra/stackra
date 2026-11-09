/**
 * Stackra file contract:
 * Purpose: `I18N_LAYOUT_TEMPLATE`, the `app/lib/layout.tsx` of a generated multi-language Fumadocs site: the shared
 *          layout options with the language switch turned on, and the home link of the reader's locale (the default
 *          locale's when none is given, as on the 404 page).
 * Boundary: a constant; the emitted file reads only `app/site.json` and `app/lib/locale.ts`. Emitted only when the
 *           DocsConfig sets `locales`; a single-language site keeps `LAYOUT_TEMPLATE`.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites).
 */

/** The emitted `app/lib/layout.tsx` of a multi-language site. */
export const I18N_LAYOUT_TEMPLATE = `import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import site from "../site.json";
import { localeOf, type SiteLocale } from "./locale";

export function baseOptions(locale: SiteLocale = localeOf("/")): BaseLayoutProps {
  const title =
    site.logo === null ? (
      site.name
    ) : (
      <>
        <img src={site.logo.light} alt={site.name} className="h-6 w-auto dark:hidden" />
        <img src={site.logo.dark} alt={site.name} className="hidden h-6 w-auto dark:block" />
      </>
    );
  const home = locale.prefix === "" ? (site.logo?.href ?? "/") : "/" + locale.prefix;
  return {
    nav: { title, url: home },
    links: site.links as BaseLayoutProps["links"],
    i18n: true,
    ...(site.layout as Partial<BaseLayoutProps>),
  };
}
`;
