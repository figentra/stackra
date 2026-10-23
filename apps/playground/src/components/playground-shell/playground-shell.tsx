/**
 * Stackra file contract:
 * Purpose: the playground shell: the layout route that reads the colour scheme and locale from the URL search
 *          params (`?scheme=light|dark|system&locale=en|ar`, so every combination deep-links), wraps the pages in
 *          the @stackra/ui DesignSystemProvider, and draws the header with the display switcher, the page navigation
 *          and the outlet.
 * Boundary: layout and the switcher only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0165 (web client stack); ADR 0060 (light, dark, RTL).
 */
import { Link, RouterProvider, ToggleButton, ToggleButtonGroup, Toolbar } from "@heroui/react";
import { ColorScheme } from "@stackra/ui/contracts";
import { DesignSystemProvider, useDesignSystem } from "@stackra/ui/react";
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
  { id: "en", name: "English (LTR)" },
  { id: "ar", name: "العربية (RTL)" },
] as const;

/** Props of {@link PlaygroundShell}. */
export interface PlaygroundShellProps {
  /** The pages the navigation links to, in order. */
  pages: readonly PageLink[];
}

/** The colour scheme and locale switcher, built from HeroUI's Toolbar and ToggleButtonGroup. */
function DisplaySettings() {
  const { colorScheme, locale, setColorScheme, setLocale } = useDesignSystem();
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
          <ToggleButton key={scheme} id={scheme}>
            {STRINGS.scheme[scheme]}
          </ToggleButton>
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
        {LOCALES.map(({ id, name }) => (
          <ToggleButton key={id} id={id}>
            <span lang={id}>{name}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Toolbar>
  );
}

/** Layout route of the playground: provider, header, navigation and the current page. */
export function PlaygroundShell({ pages }: PlaygroundShellProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
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

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <DesignSystemProvider
        colorScheme={ColorScheme.find((scheme) => scheme === params.get("scheme"))}
        locale={LOCALES.find(({ id }) => id === params.get("locale"))?.id}
        onColorSchemeChange={(scheme) => setParam("scheme", scheme)}
        onLocaleChange={(locale) => setParam("locale", locale)}
      >
        <div className="min-h-dvh bg-background text-foreground">
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
            <nav aria-label={STRINGS.pages} className="border-border p-4 md:border-e">
              <ul className="grid gap-2">
                {pages.map((page) => (
                  <li key={page.path}>
                    <Link href={`${page.path}${search}`}>{page.title}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <main id="main" tabIndex={-1} className="min-w-0 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </DesignSystemProvider>
    </RouterProvider>
  );
}
