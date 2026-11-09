/**
 * Stackra file contract:
 * Purpose: `LAYOUT_TEMPLATE`, the `app/lib/layout.tsx` of a generated Fumadocs site: the options every layout shares,
 *          from `app/site.json`: the logo (light and dark) or the site name, the navbar links and primary button, then
 *          the `DocsConfig.raw` layout options gen does not own.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); ADR 0295 (decision 4: `raw` for the keys Stackra does not own);
 *                     STA-2026.
 */

/** The emitted `app/lib/layout.tsx`. */
export const LAYOUT_TEMPLATE = `import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import site from "../site.json";

export function baseOptions(): BaseLayoutProps {
  const title =
    site.logo === null ? (
      site.name
    ) : (
      <>
        <img src={site.logo.light} alt={site.name} className="h-6 w-auto dark:hidden" />
        <img src={site.logo.dark} alt={site.name} className="hidden h-6 w-auto dark:block" />
      </>
    );
  return {
    nav: { title, url: site.logo?.href ?? "/" },
    links: site.links as BaseLayoutProps["links"],
    ...(site.layout as Partial<BaseLayoutProps>),
  };
}
`;
