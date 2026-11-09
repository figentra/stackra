/**
 * Stackra file contract:
 * Purpose: `SiteHeader`, the marketing site's top bar: the brand, the section links, a docs search drawn as a
 *          field, the ask-AI link, the code host link and the locale and theme switchers, on `AppHeader`'s transparent
 *          variant (sticky, clear until the page scrolls).
 * Boundary: composition of @stackra/ui only; every word comes in props. Every link is @stackra/ui's `Link` (a real
 *           link, so the bar works without script, and a client navigation through the nearest router), with the
 *           kit's focus ring; the section links scroll sideways on a narrow screen rather than hide. It draws outside
 *           the ruled column.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); WCAG 2.2 SC
 *                     2.4.7; STA-2041.
 */
import { AppHeader, Icon, Link } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SiteHeaderProps } from "#react/site-header/site-header.props";

/** The kit's focus ring, drawn whatever the base layer gives an anchor; `outline-hidden` keeps an outline in forced colours. */
const FOCUS = "outline-hidden focus-visible:ring-2 focus-visible:ring-focus";

/** The bar's quiet colour, important so it wins over the link colour the `Link` draws. */
const QUIET = "text-muted! hover:text-foreground!";

/** A quiet text link of the bar. */
const LINK = `inline-flex h-9 items-center rounded-field px-3 text-sm no-underline whitespace-nowrap ${QUIET} ${FOCUS}`;

/** The docs search, drawn as a field. */
const SEARCH = `hidden h-9 min-w-48 items-center gap-2 rounded-field border border-border bg-surface px-3 text-sm no-underline md:inline-flex ${QUIET} ${FOCUS}`;

/**
 * The top bar of a marketing site.
 *
 * @example
 * <SiteHeader brand={<Wordmark />} links={links} docsSearch={search} githubHref={repo} />
 */
export function SiteHeader({
  brand,
  links,
  navLabel,
  docsSearch,
  askAi,
  githubHref,
  githubLabel = "GitHub",
  localeSwitcher,
  themeToggle,
  className,
}: SiteHeaderProps): ReactElement {
  return (
    <AppHeader
      variant="transparent"
      title={brand}
      search={
        <nav
          {...(navLabel ? { "aria-label": navLabel } : {})}
          className="-m-1 min-w-0 overflow-x-auto p-1"
        >
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} underline="hover" className={LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      }
      endContent={
        <>
          <Link
            href={docsSearch.href}
            underline="hover"
            data-slot="site-header-docs-search"
            className={SEARCH}
          >
            <Icon name="search" />
            {docsSearch.label}
          </Link>
          {askAi ? (
            <Link href={askAi.href} underline="hover" className={LINK}>
              {askAi.label}
            </Link>
          ) : null}
          {githubHref === undefined ? null : (
            <Link href={githubHref} underline="hover" className={LINK}>
              {githubLabel}
            </Link>
          )}
          {localeSwitcher}
          {themeToggle}
        </>
      }
      {...(className === undefined ? {} : { className })}
    />
  );
}
