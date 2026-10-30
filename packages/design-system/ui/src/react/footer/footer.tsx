/**
 * Stackra file contract:
 * Purpose: the web `Footer`: the site's `contentinfo` landmark with the brand block, the link columns in a named
 *          navigation landmark (as many columns as fit, two on a phone, stacked under the brand), and a bottom row with
 *          the copyright, the legal links and the locale switcher slot.
 * Boundary: composes Link, Grid and Cluster; columns and rows follow the page direction, so the brand is at the right
 *           in Arabic. Column titles are `h2`.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 1.3.1 and 2.4.1 (landmarks); ADR 0060 (right-to-left); STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { type ReactElement, useId } from "react";

import type { FooterLink } from "#contracts/types/footer-link.type";
import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import type { FooterProps } from "#react/footer/footer.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Cluster } from "#react/layout/cluster";
import { Grid } from "#react/layout/grid";
import { Link } from "#react/link/link";

/** The footer's words. */
const K = LONG_TAIL_KEYS.ui.footer;

/** A footer link. */
const linkOf = (link: FooterLink) => (
  <Link
    href={link.href}
    isExternal={link.isExternal ?? false}
    underline="hover"
    className="text-sm text-muted hover:text-foreground"
  >
    {link.label}
  </Link>
);

/** A site footer. */
export function Footer({
  brand,
  groups,
  copyright,
  legalLinks,
  localeSwitcher,
  label,
  className,
}: FooterProps): ReactElement {
  const t = useUiText();
  const id = useId();
  return (
    <footer
      data-slot="footer"
      className={cn("w-full border-t border-separator text-foreground", className)}
    >
      {brand || groups?.length ? (
        <div className="grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          {brand ? <div className="grid content-start gap-3">{brand}</div> : null}
          {groups?.length ? (
            <nav aria-label={label ?? t(K.label)}>
              <Grid minItemWidth={150} gap="lg">
                {groups.map((group, position) => (
                  <div key={group.title}>
                    <h2 id={`${id}-${position}`} className="text-sm font-semibold">
                      {group.title}
                    </h2>
                    <ul aria-labelledby={`${id}-${position}`} className="mt-3 grid gap-2">
                      {group.links.map((link) => (
                        <li key={link.href}>{linkOf(link)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Grid>
            </nav>
          ) : null}
        </div>
      ) : null}
      {copyright || legalLinks?.length || localeSwitcher ? (
        <div className="flex flex-col gap-3 border-t border-separator py-6 sm:flex-row sm:items-center sm:justify-between">
          {copyright ? <p className="text-sm text-muted">{copyright}</p> : <span />}
          <Cluster gap="md">
            {legalLinks?.length ? (
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>{linkOf(link)}</li>
                ))}
              </ul>
            ) : null}
            {localeSwitcher}
          </Cluster>
        </div>
      ) : null}
    </footer>
  );
}
