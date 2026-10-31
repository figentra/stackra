/**
 * Stackra file contract:
 * Purpose: `TopBar`, the playground's one slim sticky row: the Stackra mark, the site links (Components, Theme
 *          Studio, Docs; the one on screen carries an accent bar and `aria-current`), the search button that opens
 *          the command palette (⌘K), and a Display button whose popover holds every display setting. Below `md` the
 *          links fold behind a menu button that opens the shell's drawer (below `lg` on a component page, whose
 *          sidebar folds into the same drawer). It is the bar material (`.material-bar`, @stackra/tokens): the
 *          theme's background as a tinted glass with foreground words, so they read whatever scrolls under it.
 * Boundary: the row only; the palette, the drawer and the settings' state belong to the shell and the provider.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.4.8, 4.1.2.
 */
import { Button, IconButton, Kbd, Link, Popover, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { StTile } from "#src/components/stackra-wordmark";
import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { DisplaySettings } from "./display-settings";
import { SHELL_KEYS } from "./shell-keys.constant";
import { SITE_LINKS } from "./site-links.constant";
import type { TopBarProps } from "./top-bar.props";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The palette's shortcut as this platform writes it. */
const SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

/** The top bar. */
export function TopBar({
  width,
  hasSidebar,
  section,
  isMenuOpen,
  onMenuOpen,
  onSearch,
  material,
  onMaterialChange,
  numerals,
  onNumeralsChange,
}: TopBarProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  return (
    // The bar material: the theme's own background as a tinted glass with foreground text, so whatever scrolls under it
    // shows only as a blurred tint and the words keep their contrast in every brand and scheme (solid in the solid
    // mode, under reduced transparency and more contrast). Its words are foreground, never muted, for the same reason.
    <header className="material-bar sticky top-0 z-(--z-sticky) border-b border-separator">
      <div className={`mx-auto flex h-14 ${width} items-center gap-1 sm:gap-2`}>
        <IconButton
          icon="list"
          label={t(K.menu)}
          variant="ghost"
          size="sm"
          aria-expanded={isMenuOpen}
          onPress={onMenuOpen}
          className={hasSidebar ? "lg:hidden" : "md:hidden"}
        />
        <Link
          href={`/${search}`}
          underline="hover"
          // The brand's words sit on a pill of the solid background, as the mobile header's brand does: the bar's glass
          // shows a tenth of what passes under it, and a thumbnail there leaves a contrast check nothing to measure.
          className="flex min-w-0 shrink-0 items-center gap-2 bg-background py-1 ps-1 pe-3 !text-foreground hover:no-underline"
          style={{ borderRadius: "var(--radius-full, 9999px)" }}
        >
          <StTile className="size-7 shrink-0" />
          <span className="font-semibold tracking-tight">{t(BRAND_KEYS.brand.name)}</span>
          <span className="text-sm max-sm:sr-only">{t(K.product)}</span>
        </Link>
        <nav aria-label={t(K.nav)} className="ms-4 max-md:hidden">
          <ul className="flex items-center gap-1">
            {SITE_LINKS.map(({ id, path, label }) => {
              const isActive = id === section;
              return (
                <li key={id}>
                  <Link
                    href={`${path}${search}`}
                    underline="hover"
                    {...(isActive ? { "aria-current": "page" as const } : {})}
                    // The `!` beats the Link's own `text-link` utility, which sorts after these: only the
                    // page's own link takes the brand colour (the theme's link role, its text-safe accent); the others
                    // stay in the text colours, so a brand with a loud accent does not paint the whole bar.
                    // A solid background, like the brand's pill: on the glass alone, whatever scrolls under the
                    // bar sits behind the words, and axe cannot measure their contrast.
                    className={`relative flex h-9 items-center rounded-[var(--radius-control)] bg-background px-3 text-sm hover:no-underline after:absolute after:inset-x-3 after:-bottom-2.5 after:h-0.5 hover:after:bg-separator ${isActive ? "font-medium text-link after:bg-accent" : "font-normal !text-muted hover:!text-foreground"}`}
                  >
                    {t(label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Button
          variant="outline"
          size="sm"
          startIcon="search"
          onPress={onSearch}
          aria-keyshortcuts="Meta+K Control+K /"
          className="ms-auto justify-start max-sm:min-w-9 max-sm:px-2 sm:w-56"
        >
          <span className="flex-1 text-start max-sm:sr-only">{t(K.search)}</span>
          <Kbd aria-hidden="true" dir="ltr" className="max-sm:hidden">
            {SHORTCUT}
          </Kbd>
        </Button>
        <Popover
          title={t(K.display)}
          placement="bottom"
          align="end"
          className="w-100 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto"
          trigger={
            <Button
              variant="ghost"
              size="sm"
              startIcon="settings"
              aria-label={t(K.display)}
              className="max-sm:min-w-9 max-sm:px-2"
            >
              <span className="max-sm:sr-only">{t(K.display)}</span>
            </Button>
          }
        >
          <div className="w-full pt-4">
            <DisplaySettings
              material={material}
              onMaterialChange={onMaterialChange}
              numerals={numerals}
              onNumeralsChange={onNumeralsChange}
            />
          </div>
        </Popover>
      </div>
    </header>
  );
}
