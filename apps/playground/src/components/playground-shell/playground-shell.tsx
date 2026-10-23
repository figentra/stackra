/**
 * Stackra file contract:
 * Purpose: the playground shell: the layout route that reads the colour scheme and locale from the URL search
 *          params (`?scheme=light|dark|system&locale=en|ar`, so every combination deep-links), wraps the pages in
 *          the @stackra/ui DesignSystemProvider, and draws the header with the display switcher, the page navigation
 *          and the outlet. The UI is English (`lang="en"`) while `<html>` carries the chosen locale and direction,
 *          so the layout mirrors as the locale's would. On a client-side route change it moves focus to the new
 *          page's h1, and it keeps the browser's theme-color in step with the scheme on screen. Pages with a `group`
 *          (the `@stackra/ui-pro` pages, ADR 0310) are listed after the others under their group's label. A page that
 *          draws its own `main` (`ownsMain`) is hosted in a plain element, since a page has one `main` landmark.
 * Boundary: layout and the switcher only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0165 (web client stack); ADR 0060 (light,
 *          dark, RTL).
 */
import { Link, RouterProvider, ToggleButton, ToggleButtonGroup, Toolbar } from "@heroui/react";
import { STACKRA_THEME } from "@stackra/tokens";
import { ColorScheme } from "@stackra/ui/contracts";
import { DesignSystemProvider, useDesignSystem } from "@stackra/ui/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Outlet, useHref, useLocation, useNavigate, useSearchParams } from "react-router";

import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::shell.*` keys.
const STRINGS = {
  title: "Stackra Playground",
  skip: "Skip to content",
  pages: "Pages",
  settings: "Display settings",
  colorScheme: "Colour scheme",
  language: "Language and direction",
  scheme: { light: "Light", dark: "Dark", system: "System" },
} as const;

/** The locales the switcher offers: one left-to-right, one right-to-left; each name in its own language. */
const LOCALES = [
  { id: "en", name: "English (LTR)", dir: "ltr" },
  { id: "ar", name: "العربية (RTL)", dir: "rtl" },
] as const;

// HeroUI marks the selected toggle with `accent-soft` on a `default` track, about 1:1 in this theme (an open brand
// question), so the switcher paints the selected one with the accent fill instead: well over 3:1 in both schemes.
const SELECTED_AS_ACCENT =
  "[--toggle-button-bg-selected:var(--accent)] [--toggle-button-bg-selected-hover:var(--accent-hover)] [--toggle-button-bg-selected-pressed:var(--accent-pressed)] [--toggle-button-fg-selected:var(--accent-foreground)]";

/** A switcher button: a check mark marks the selected one, so selection does not rest on the fill alone. */
function Choice({ id, children }: { id: string; children: ReactNode }) {
  return (
    <ToggleButton id={id} className={SELECTED_AS_ACCENT}>
      {({ isSelected }) => (
        <>
          {isSelected ? (
            <svg viewBox="0 0 16 16" aria-hidden="true" data-testid="selected-mark">
              <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : null}
          {children}
        </>
      )}
    </ToggleButton>
  );
}

/** The pages split by navigation group, in first-seen order; the ungrouped pages come first, under no label. */
function byGroup(pages: readonly PageLink[]): readonly [string | undefined, PageLink[]][] {
  const groups = new Map<string | undefined, PageLink[]>([[undefined, []]]);
  for (const page of pages) groups.set(page.group, [...(groups.get(page.group) ?? []), page]);
  return [...groups].filter(([, members]) => members.length > 0);
}

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
    <Toolbar aria-label={STRINGS.settings} className="flex flex-wrap gap-3">
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
          <Choice key={scheme} id={scheme}>
            {STRINGS.scheme[scheme]}
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
        {LOCALES.map(({ id, name, dir }) => (
          <Choice key={id} id={id}>
            <span lang={id} dir={dir}>
              {name}
            </span>
          </Choice>
        ))}
      </ToggleButtonGroup>
    </Toolbar>
  );
}

/** Layout route of the playground: provider, header, navigation and the current page. */
export function PlaygroundShell({ pages }: PlaygroundShellProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();
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
  // browser's own focus.
  const main = useRef<HTMLDivElement>(null);
  const shownPath = useRef(pathname);
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    const heading = main.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    (heading ?? main.current)?.focus();
  }, [pathname]);

  const ownsMain = pages.some((page) => page.path === pathname && page.ownsMain);
  const outlet = <Outlet />;

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <DesignSystemProvider
        colorScheme={ColorScheme.find((scheme) => scheme === params.get("scheme"))}
        locale={LOCALES.find(({ id }) => id === params.get("locale"))?.id}
        onColorSchemeChange={(scheme) => setParam("scheme", scheme)}
        onLocaleChange={(locale) => setParam("locale", locale)}
      >
        <div lang="en" className="min-h-dvh bg-background text-foreground">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-10 focus:rounded focus:bg-surface focus:p-2 focus:outline-2 focus:outline-focus"
          >
            {STRINGS.skip}
          </a>
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
            <Link href={`/${search}`} className="text-lg font-semibold">
              {STRINGS.title}
            </Link>
            <DisplaySettings />
          </header>
          <div className="grid md:grid-cols-[14rem_1fr]">
            <nav aria-label={STRINGS.pages} className="grid gap-4 border-border p-4 md:border-e">
              {byGroup(pages).map(([group, members]) => {
                const labelId = group ? `nav-group-${group.toLowerCase()}` : undefined;
                return (
                  <div key={group ?? ""} className="grid gap-2">
                    {group ? (
                      <p id={labelId} className="text-sm font-semibold text-muted">
                        {group}
                      </p>
                    ) : null}
                    <ul aria-labelledby={labelId} className="grid gap-2">
                      {members.map((page) => (
                        <li key={page.path}>
                          <Link href={`${page.path}${search}`}>{page.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </nav>
            {ownsMain ? (
              <div ref={main} id="main" tabIndex={-1} className="min-w-0 p-6">
                {outlet}
              </div>
            ) : (
              <main ref={main} id="main" tabIndex={-1} className="min-w-0 p-6">
                {outlet}
              </main>
            )}
          </div>
        </div>
      </DesignSystemProvider>
    </RouterProvider>
  );
}
