/**
 * Stackra file contract:
 * Purpose: the playground shell: the layout route that reads the colour scheme and locale from the URL search
 *          params (`?scheme=light|dark|system&locale=en|ar`, so every combination deep-links), wraps the pages in
 *          the @stackra/ui DesignSystemProvider and draws them on a glass stage: an ambient field, a floating glass
 *          bar (the wordmark, the search button that opens the command palette, and the display switcher), and on a
 *          component page its category strip above it, the page on a solid sheet of the theme's background (its
 *          samples are tuned against that colour) and the previous and next pages below it. There is no
 *          sidebar: the index is a gallery, and every page is one search away (⌘K, Ctrl+K or `/`). The UI is English
 *          (`lang="en"`) while `<html>` carries the chosen locale and direction, so the layout mirrors as the
 *          locale's would. On a client-side route change it moves focus to the new page's h1 and closes the
 *          palette, and it keeps the browser's theme-color in step with the scheme on screen.
 * Boundary: layout, the switcher and the palette's open state only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0165 (web client stack); ADR 0060 (light, dark, RTL).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { ColorScheme } from "@stackra/ui/contracts";
import {
  Button,
  DesignSystemProvider,
  Icon,
  IconButton,
  Link,
  RouterProvider,
  ToggleButtonGroup,
  Toolbar,
  useDesignSystem,
} from "@stackra/ui/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useHref, useLocation, useNavigate, useSearchParams } from "react-router";

import { CategoryNav } from "#src/components/category-nav";
import { Choice } from "#src/components/choice";
import { CommandPalette } from "#src/components/command-palette";
import { PagePager } from "#src/components/page-pager";
import type { PageLink } from "#src/types/page-link.type";
import type { ShellContext } from "#src/types/shell-context.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::shell.*` keys.
const STRINGS = {
  brand: "Stackra",
  product: "Playground",
  skip: "Skip to content",
  search: "Search components",
  settings: "Display settings",
  showSettings: "Scheme and language",
  colorScheme: "Colour scheme",
  language: "Language and direction",
  scheme: { light: "Light", dark: "Dark", system: "System" },
} as const;

/** The icon of each scheme choice; its name is the choice's accessible name. */
const SCHEME_ICONS = { light: "sun", dark: "moon", system: "monitor" } as const;

/** The locales the switcher offers: one left-to-right, one right-to-left; each name in its own language. */
const LOCALES = [
  { id: "en", short: "English", name: "English (LTR)", dir: "ltr" },
  { id: "ar", short: "العربية", name: "العربية (RTL)", dir: "rtl" },
] as const;

/** The palette's shortcut as this platform writes it. */
const SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

/** Props of {@link PlaygroundShell}. */
export interface PlaygroundShellProps {
  /** The pages the navigation links to, in order. */
  pages: readonly PageLink[];
}

/** The colour scheme and locale switcher, built from HeroUI's Toolbar and ToggleButtonGroup. */
function DisplaySettings() {
  const { colorScheme, resolvedColorScheme, locale, setColorScheme, setLocale } = useDesignSystem();
  const background = STACKRA_THEME.colors.background;
  const themeColor = resolvedColorScheme === "dark" ? background.hexDark : background.hexLight;

  // The browser chrome follows the scheme on screen, not only the system's (index.html sets it before paint).
  useLayoutEffect(() => {
    for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
      meta.setAttribute("content", themeColor);
  }, [themeColor]);

  return (
    <Toolbar aria-label={STRINGS.settings} className="flex flex-wrap items-center gap-2">
      <ToggleButtonGroup
        aria-label={STRINGS.colorScheme}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[colorScheme]}
        onSelectionChange={(keys) => {
          const picked = ColorScheme.find((scheme) => keys.has(scheme));
          if (picked) setColorScheme(picked);
        }}
      >
        {ColorScheme.map((scheme) => (
          <Choice key={scheme} id={scheme} aria-label={STRINGS.scheme[scheme]}>
            <Icon name={SCHEME_ICONS[scheme]} size="sm" />
          </Choice>
        ))}
      </ToggleButtonGroup>
      <ToggleButtonGroup
        aria-label={STRINGS.language}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[locale]}
        onSelectionChange={(keys) => {
          const picked = LOCALES.find(({ id }) => keys.has(id));
          if (picked) setLocale(picked.id);
        }}
      >
        {LOCALES.map(({ id, short, name, dir }) => (
          <Choice key={id} id={id} aria-label={name}>
            <span lang={id} dir={dir}>
              {short}
            </span>
          </Choice>
        ))}
      </ToggleButtonGroup>
    </Toolbar>
  );
}

/** Layout route of the playground: provider, glass bar, page chrome, the current page and the palette. */
export function PlaygroundShell({ pages }: PlaygroundShellProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const current = pages.find((page) => page.path === pathname);
  const setParam = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );

  // A client-side navigation announces nothing, so focus moves to the new page's h1; the first load keeps the
  // browser's own focus. The palette closes on the way; a modal dialog hands focus back to what it came from when it
  // closes, so the h1 takes it again once the palette has closed.
  const main = useRef<HTMLElement>(null);
  const shownPath = useRef(pathname);
  const isFocusPending = useRef(false);
  const focusHeading = () => {
    const heading = main.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    (heading ?? main.current)?.focus();
  };
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    isFocusPending.current = true;
    setPaletteOpen(false);
    focusHeading();
  }, [pathname]);
  const openPalette = () => {
    isFocusPending.current = false;
    setPaletteOpen(true);
  };
  const onPaletteClose = () => {
    setPaletteOpen(false);
    if (isFocusPending.current) focusHeading();
    isFocusPending.current = false;
  };

  // ⌘K or Ctrl+K anywhere, and `/` outside a text field, open the palette.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (isCommandK || (event.key === "/" && !isTyping)) {
        event.preventDefault();
        openPalette();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const context: ShellContext = { openPalette };

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <DesignSystemProvider
        colorScheme={ColorScheme.find((scheme) => scheme === params.get("scheme"))}
        locale={LOCALES.find(({ id }) => id === params.get("locale"))?.id}
        onColorSchemeChange={(scheme) => setParam("scheme", scheme)}
        onLocaleChange={(locale) => setParam("locale", locale)}
      >
        <div lang="en" className="relative min-h-dvh text-foreground">
          <div className="ambient" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-30 focus:rounded-xl focus:bg-surface focus:p-2 focus:outline-2 focus:outline-focus"
          >
            {STRINGS.skip}
          </a>
          {/* One row on every width: on a phone the search button keeps only its icon and the display settings fold
              behind a button; from the small breakpoint up both sit in the row. */}
          <header className="glass sticky top-3 z-20 mx-auto mt-3 flex w-[min(100%-1.5rem,80rem)] flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl px-2 py-2 sm:gap-x-3 sm:px-3">
            <Link
              href={`/${search}`}
              underline="hover"
              className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 hover:no-underline"
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent font-mono text-sm font-semibold text-accent-foreground"
              >
                st
              </span>
              <span className="font-semibold tracking-tight">{STRINGS.brand}</span>{" "}
              <span className="text-muted max-sm:sr-only">{STRINGS.product}</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              startIcon="search"
              onPress={openPalette}
              aria-keyshortcuts="Meta+K Control+K /"
              className="ms-auto justify-start rounded-xl text-muted max-sm:min-w-9 max-sm:px-2 sm:w-64"
            >
              <span className="flex-1 text-start max-sm:sr-only">{STRINGS.search}</span>
              <kbd
                aria-hidden="true"
                dir="ltr"
                className="rounded-md border border-border px-1.5 font-mono text-xs max-sm:hidden"
              >
                {SHORTCUT}
              </kbd>
            </Button>
            <IconButton
              icon="settings"
              label={STRINGS.showSettings}
              variant="ghost"
              size="sm"
              aria-expanded={isSettingsOpen}
              aria-controls="display-settings"
              onPress={() => setSettingsOpen((open) => !open)}
              className="sm:hidden"
            />
            <div
              id="display-settings"
              className={`max-sm:w-full max-sm:justify-center ${isSettingsOpen ? "max-sm:flex" : "max-sm:hidden"}`}
            >
              <DisplaySettings />
            </div>
          </header>
          <main
            ref={main}
            id="main"
            tabIndex={-1}
            className="mx-auto grid w-[min(100%-1.5rem,80rem)] min-w-0 gap-6 py-6 outline-none"
          >
            {current ? <CategoryNav pages={pages} current={current} search={search} /> : null}
            {/* A component page sits on a solid sheet of the theme's background: its soft and translucent samples
                are tuned against that colour, so the ambient field never shifts what they measure. */}
            <div
              className={
                current
                  ? "min-w-0 rounded-3xl border border-separator bg-background p-4 sm:p-8"
                  : "min-w-0 px-1 sm:px-3"
              }
            >
              <Outlet context={context} />
            </div>
            {current ? <PagePager pages={pages} current={current} search={search} /> : null}
          </main>
          <CommandPalette
            pages={pages}
            search={search}
            isOpen={isPaletteOpen}
            onClose={onPaletteClose}
          />
        </div>
      </DesignSystemProvider>
    </RouterProvider>
  );
}
