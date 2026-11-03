/**
 * Stackra file contract:
 * Purpose: `SiteHeaderBlock`, the marketing site's top bar: the brand, the section links, a docs search drawn as a
 *          field, the ask-AI link, the code host link and the locale and theme switchers, on `AppHeader`'s transparent
 *          variant (sticky, clear until the page scrolls).
 * Boundary: composition of @stackra/ui only; every word comes in props. The links are plain anchors, so the bar works
 *           without script; the section links scroll sideways on a narrow screen rather than hide.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041.
 */
import { AppHeader, Icon } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SiteHeaderBlockProps } from "#react/site-header-block/site-header-block.props";

/** A quiet text link of the bar. */
const LINK =
  "inline-flex h-9 items-center rounded-field px-3 text-sm text-muted hover:text-foreground whitespace-nowrap";

/**
 * The top bar of a marketing site.
 *
 * @example
 * <SiteHeaderBlock brand={<Wordmark />} links={links} docsSearch={search} githubHref={repo} />
 */
export function SiteHeaderBlock({
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
}: SiteHeaderBlockProps): ReactElement {
  return (
    <AppHeader
      variant="transparent"
      title={brand}
      search={
        <nav {...(navLabel ? { "aria-label": navLabel } : {})} className="min-w-0 overflow-x-auto">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={LINK}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      }
      endContent={
        <>
          <a
            href={docsSearch.href}
            data-slot="site-header-docs-search"
            className="hidden h-9 min-w-48 items-center gap-2 rounded-field border border-border bg-surface px-3 text-sm text-muted hover:text-foreground md:inline-flex"
          >
            <Icon name="search" />
            {docsSearch.label}
          </a>
          {askAi ? (
            <a href={askAi.href} className={LINK}>
              {askAi.label}
            </a>
          ) : null}
          <a href={githubHref} className={LINK}>
            {githubLabel}
          </a>
          {localeSwitcher}
          {themeToggle}
        </>
      }
      {...(className === undefined ? {} : { className })}
    />
  );
}
