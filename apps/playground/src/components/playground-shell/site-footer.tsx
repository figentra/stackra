/**
 * Stackra file contract:
 * Purpose: `SiteFooter`, the quiet foot of every shell page: the copyright, the links that have a place to go
 *          (GitHub, Docs, Theme Studio, the changelog) and the playground's version, on one line that wraps to two on
 *          a phone and mirrors in Arabic.
 * Boundary: links only; the in-app ones keep the URL's search params (scheme, locale), the GitHub ones open outside.
 * Runtime: browser
 * Governing contract: STA-1371 (owner, 2026-10-29: a simple footer on every page).
 */
import { Link, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { MESSAGES } from "#src/constants/messages.constant";

import { version } from "../../../package.json";
import { SHELL_KEYS } from "./shell-keys.constant";
import { SITE_LINKS } from "./site-links.constant";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The repository, which the package's own `repository` field names. */
const REPOSITORY = "https://github.com/figentra/stackra";

/** The footer of the shell's pages. */
export function SiteFooter({ width }: { readonly width: string }) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const docs = SITE_LINKS.find(({ id }) => id === "docs")?.path ?? "/docs";
  const links = [
    { label: t(K.footer.github), href: REPOSITORY, isExternal: true },
    { label: t(K.docs), href: `${docs}${search}` },
    { label: t(K.studio), href: `/theme-studio${search}` },
    {
      label: t(K.footer.changelog),
      href: `${REPOSITORY}/blob/main/apps/playground/CHANGELOG.md`,
      isExternal: true,
    },
  ];
  return (
    <footer className="border-t border-separator">
      <div
        className={`mx-auto flex ${width} flex-wrap items-center gap-x-6 gap-y-2 py-6 text-xs text-muted`}
      >
        <p>{t(K.footer.copyright)}</p>
        <nav aria-label={t(K.footer.nav)}>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {links.map(({ label, href, isExternal }) => (
              <li key={href}>
                <Link
                  href={href}
                  isExternal={isExternal}
                  underline="hover"
                  className="!text-muted hover:!text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="ms-auto tabular-nums">
          <bdi>{t(K.footer.version, { version })}</bdi>
        </p>
      </div>
    </footer>
  );
}
