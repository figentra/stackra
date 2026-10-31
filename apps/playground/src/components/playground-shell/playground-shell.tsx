/**
 * Stackra file contract:
 * Purpose: the playground shell: the layout route that reads the colour scheme, locale and digits from the URL
 *          search params (`?scheme=light|dark|system&locale=en|ar&numerals=latn|arab`, so every combination deep-links), wraps the pages in
 *          the @stackra/ui DesignSystemProvider and draws them on a glass stage: an ambient field, the slim sticky
 *          `TopBar` (mark, site links, search, Display popover), and on a component page the HeroUI docs frame: the
 *          category sidebar (in the menu drawer below `lg`, with the site links below `md`), the page on a solid sheet of
 *          the theme's background (its samples are tuned against that colour) with the scroll-spied section tabs
 *          over it below `lg`, and the "On this page" rail. Every page is also one search away (⌘K, Ctrl+K or `/`),
 *          and each component page opened is remembered for the home page's recent row. The locale also
 *          picks the catalogues (`ShowcaseI18n`): the shell's words are `shell::*` keys, and `<html>` carries the
 *          locale and direction. On a client-side route change it moves focus to the new page's h1 and closes the
 *          palette, and it keeps the browser's theme-color in step with the scheme on screen. A page that draws its
 *          own `main` (`ownsMain`) is hosted in a plain element, since a page has one `main`
 *          landmark. A route whose `handle` has `fullscreen: true` gets the window: its outlet alone, no bar, no
 *          sidebar.
 * Boundary: layout, the switcher and the palette's open state only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0165 (web client stack); ADR 0060 (light,
 *          dark, RTL).
 */
import { MaterialFamily, MaterialMode } from "@stackra/tokens/contracts";
import { ColorScheme } from "@stackra/ui/contracts";
import {
  DesignSystemProvider,
  Drawer,
  Link,
  RouterProvider,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate, useSearchParams } from "react-router";

import {
  CommandPalette,
  type CommandPaletteProps,
  type PaletteAction,
} from "#src/components/command-palette";
import { LOCALES } from "#src/components/playground-shell/display-settings-locales.constant";
import { MATERIAL_ICONS } from "#src/components/playground-shell/display-settings-material-icons.constant";
import { SCHEME_ICONS } from "#src/components/playground-shell/display-settings-scheme-icons.constant";
import { useRouterHref } from "./use-router-href";
import { siteSectionOf } from "#src/components/playground-shell/site-section-of.function";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { SHOWCASE_NUMERALS } from "#src/components/playground-shell/showcase-numerals.constant";
import type { ShowcaseNumerals } from "#src/components/playground-shell/showcase-numerals.type";
import { SITE_LINKS } from "#src/components/playground-shell/site-links.constant";
import { SiteFooter } from "#src/components/playground-shell/site-footer";
import { ThemeColorSync } from "#src/components/playground-shell/theme-color-sync";
import { TopBar } from "#src/components/playground-shell/top-bar";
import { rememberRecent } from "#src/components/recent-chips";
import { SectionTabs } from "#src/components/section-tabs";
import { ShowcaseI18n } from "#src/components/showcase-i18n";
import { Sidebar } from "#src/components/sidebar";
import { readActiveBrand } from "#src/components/studio-brands";
import { TocRail } from "#src/components/toc-rail";
import { MESSAGES } from "#src/constants/messages.constant";
import { readThemeTransition, runThemeTransition } from "#src/components/theme-transition";
import type { ShellContext } from "#src/types/shell-context.type";
import type { PlaygroundShellProps } from "#src/components/playground-shell/playground-shell.props";
import { Icons } from "#src/constants/icons.constant";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The routes that are workspaces and take the whole width of the window. */
const WIDE_PATHS: ReadonlySet<string> = new Set(["/theme-studio"]);

/** The mode the playground shows when the address names none: the showcase default. */
const DEFAULT_MATERIAL: MaterialMode = "glass";

/** The digits the address names (`?numerals=arab`), else the default, Latin (ADR 0192). */
const numeralsOf = (params: URLSearchParams): ShowcaseNumerals =>
  SHOWCASE_NUMERALS.find((system) => system === params.get("numerals")) ?? SHOWCASE_NUMERALS[0];

/** The command palette with the shell's quick actions: the scheme, the language and the places to go. */
function ShellPalette({
  onMaterialChange,
  ...props
}: Omit<CommandPaletteProps, "actions"> & { onMaterialChange: (material: MaterialMode) => void }) {
  const { setColorScheme, setLocale } = useDesignSystem();
  const navigate = useNavigate();
  const t = useCatalogueText(MESSAGES.en);
  const actions: PaletteAction[] = [
    ...ColorScheme.map((scheme) => ({
      id: `scheme-${scheme}`,
      label: t(K.actions.scheme, { name: t(K.scheme[scheme]) }),
      detail: t(K.color_scheme),
      icon: SCHEME_ICONS[scheme],
      keywords: "theme appearance mode",
      run: () => runThemeTransition(() => setColorScheme(scheme)),
    })),
    ...LOCALES.map(({ id, name }) => ({
      id: `locale-${id}`,
      label: name,
      detail: t(K.language),
      icon: "languages" as const,
      keywords: `language direction ${id === "ar" ? "arabic rtl" : "english ltr"}`,
      run: () => runThemeTransition(() => setLocale(id)),
    })),
    ...MaterialMode.map((mode) => ({
      id: `material-${mode}`,
      label: t(K.actions.material, { name: t(K.materials[mode]) }),
      detail: t(K.material),
      icon: MATERIAL_ICONS[mode],
      keywords: "glass liquid frosted solid material transparency",
      run: () => runThemeTransition(() => onMaterialChange(mode)),
    })),
    {
      id: "go-home",
      label: t(K.actions.home),
      detail: t(K.title),
      icon: Icons.Sparkles,
      keywords: "home index landing",
      run: () => void navigate(`/${props.search}`),
    },
    {
      id: "go-studio",
      label: t(K.studio),
      detail: t(K.actions.studio_detail),
      icon: Icons.Palette,
      keywords: "theme builder customise customize export tokens",
      run: () => void navigate(`/theme-studio${props.search}`),
    },
    {
      id: "go-components",
      label: t(K.actions.components),
      detail: t(K.actions.components_detail),
      icon: Icons.LayoutGrid,
      keywords: "gallery all pages",
      run: () => void navigate(`/components${props.search}`),
    },
  ];
  return <CommandPalette {...props} actions={actions} />;
}

/** Layout route of the playground: the i18n mount over the shell, in the locale the URL names. */
export function PlaygroundShell(props: PlaygroundShellProps) {
  const [params] = useSearchParams();
  const locale = LOCALES.find(({ id }) => id === params.get("locale"))?.id ?? "en";
  return (
    <ShowcaseI18n locale={locale} numerals={numeralsOf(params)}>
      <Shell {...props} />
    </ShowcaseI18n>
  );
}

/** The shell itself: provider, glass bar, page chrome, the current page and the palette. */
function Shell({ pages }: PlaygroundShellProps) {
  const t = useCatalogueText(MESSAGES.en);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const matches = useMatches();
  const [params, setParams] = useSearchParams();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const current = pages.find((page) => page.path === pathname)?.entry;
  const locale = LOCALES.find(({ id }) => id === params.get("locale"))?.id ?? "en";
  // A workspace (the Theme Studio) takes the whole width; reading pages keep a measure.
  const width = WIDE_PATHS.has(pathname) ? "w-[calc(100%-1.5rem)]" : "w-[min(100%-2rem,110rem)]";
  // The material mode is the document's, as the scheme is: the provider sets it (index.html before paint).
  const material = MaterialMode.find((mode) => mode === params.get("material")) ?? DEFAULT_MATERIAL;
  // The theme family (ADR 0320 as amended 2026-10-31): `?family=front|studio`; left out, the picked theme's own.
  const family = MaterialFamily.find((name) => name === params.get("family"));
  // React Router hands a functional update the params of the last render, so choices made before the next render (a
  // scheme, then a locale) would keep only the last; each write starts from the one before it instead. The ref takes
  // the URL's params only when something else changed them (a link, the back button), not on the echo of a write of
  // its own still on its way.
  const latest = useRef(params);
  const written = useRef(new Set<string>());
  useEffect(() => {
    const query = params.toString();
    if (query === latest.current.toString()) written.current.clear();
    else if (!written.current.has(query)) latest.current = params;
  }, [params]);
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(latest.current);
    next.set(key, value);
    latest.current = next;
    written.current.add(next.toString());
    setParams(next, { replace: true });
  };

  // A client-side navigation announces nothing, so focus moves to the new page's h1; the first load keeps the
  // browser's own focus. The palette closes on the way; a modal dialog hands focus back to what it came from when it
  // closes, so the h1 takes it again once the palette has closed.
  const main = useRef<HTMLDivElement>(null);
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
    setSidebarOpen(false);
    focusHeading();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- runs on a route change only; focusHeading reads refs, so a stale copy is harmless
  }, [pathname]);
  // Every component page opened, by link or by the palette, feeds the home page's recent row.
  useEffect(() => {
    if (current) rememberRecent(pathname);
  }, [current, pathname]);
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
      // A key pressed with nothing focused targets the document, which is not an element.
      const target = event.target instanceof Element ? event.target : null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      // A sample's own open dialog keeps the keys: the palette never opens over it.
      const isDialogOpen = document.querySelector(
        'dialog[open]:not(.command-palette), [role="dialog"][aria-modal="true"], [role="alertdialog"]',
      );
      if (!isDialogOpen && (isCommandK || (event.key === "/" && !isTyping))) {
        event.preventDefault();
        openPalette();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the listener is added once on mount; openPalette only sets refs and state
  }, []);

  const context: ShellContext = { openPalette };

  // A route whose handle says `fullscreen: true` (the Theme Studio workspace) draws the whole window itself.
  const isFullscreen = matches.some(
    ({ handle }) => (handle as { fullscreen?: boolean } | undefined)?.fullscreen === true,
  );
  const section = siteSectionOf(
    current !== undefined,
    matches.map(({ handle }) => handle),
  );
  const ownsMain = pages.some((page) => page.path === pathname && page.ownsMain);
  // A component page's text sits on the page itself, as docs do (no card around the article): surfaces are kept for
  // what they mean (preview stages, code, tables), so there are no boxes inside boxes. The soft and translucent
  // samples are measured inside their preview stages, on the theme's background, so the ambient field never shifts
  // them. From `xl` the column is framed by the sidebar and the "On this page" rail; from `lg` to `xl` the rail folds
  // into a menu at its top; below `lg` the sidebar is the menu drawer and the sticky section tabs stand in for the
  // rail. The column never narrows under 40rem while a column sits beside it.
  const pageArea = current ? (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(40rem,1fr)] lg:gap-8 xl:grid-cols-[18rem_minmax(40rem,1fr)_clamp(14rem,18vw,17rem)] 2xl:gap-12">
      {/* The sidebar scrolls inside a clipping frame: a row scrolled past the edge is then cut where it shows, so a
          contrast check reads its visible part against the page instead of giving up on the part outside. */}
      <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden max-lg:hidden">
        <Sidebar current={current} className="min-h-0 overflow-y-auto overflow-x-hidden" />
      </div>
      <div className="min-w-0 lg:px-2 2xl:px-6">
        <SectionTabs
          entry={current}
          className="sticky top-14 z-(--z-raised) -mx-4 mb-4 bg-background px-4 py-2 lg:hidden"
        />
        <TocRail entry={current} variant="menu" className="mb-6 max-lg:hidden xl:hidden" />
        <Outlet context={context} />
      </div>
      <TocRail entry={current} className="sticky top-20 max-h-[calc(100dvh-6rem)] max-xl:hidden" />
    </div>
  ) : (
    <div className="min-w-0 px-1 sm:px-3">
      <Outlet context={context} />
    </div>
  );

  const palette = (
    <ShellPalette
      locale={locale}
      search={search}
      isOpen={isPaletteOpen}
      onClose={onPaletteClose}
      onMaterialChange={(mode) => setParam("material", mode)}
    />
  );

  return (
    // oxlint-disable-next-line react/hooks -- react-aria's RouterProvider takes the router's useHref hook as a prop by design
    <RouterProvider navigate={navigate} useHref={useRouterHref}>
      <DesignSystemProvider
        colorScheme={ColorScheme.find((scheme) => scheme === params.get("scheme"))}
        locale={locale}
        onColorSchemeChange={(scheme) => setParam("scheme", scheme)}
        onLocaleChange={(picked) => setParam("locale", picked)}
        material={material}
        family={family}
        defaultBrand={readActiveBrand().id}
        defaultTransition={readThemeTransition()}
      >
        <ThemeColorSync />
        {isFullscreen ? (
          <>
            <Outlet context={context} />
            {palette}
          </>
        ) : (
          <div className="relative min-h-dvh text-foreground">
            <div className="ambient" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-(--z-dock) focus:bg-surface focus:p-2 focus:outline-2 focus:outline-focus"
            >
              {t(K.skip)}
            </a>
            <TopBar
              width={width}
              hasSidebar={current !== undefined}
              section={section}
              isMenuOpen={isSidebarOpen}
              onMenuOpen={() => setSidebarOpen(true)}
              onSearch={openPalette}
              material={material}
              onMaterialChange={(mode) => setParam("material", mode)}
              numerals={numeralsOf(params)}
              onNumeralsChange={(system) => setParam("numerals", system)}
            />
            {ownsMain ? (
              <div
                ref={main}
                id="main"
                tabIndex={-1}
                className={`mx-auto grid ${width} min-w-0 gap-6 py-6 outline-none`}
              >
                {pageArea}
              </div>
            ) : (
              <main
                ref={main}
                id="main"
                tabIndex={-1}
                className={`mx-auto grid ${width} min-w-0 gap-6 py-6 outline-none`}
              >
                {pageArea}
              </main>
            )}
            <SiteFooter width={width} />
            <Drawer
              isOpen={isSidebarOpen}
              onOpenChange={setSidebarOpen}
              placement="start"
              label={t(K.menu)}
            >
              <Drawer.Body>
                <nav aria-label={t(K.nav)} className="mb-4 md:hidden">
                  <ul className="grid">
                    {SITE_LINKS.map(({ id, path, label }) => {
                      const isActive = id === section;
                      return (
                        <li key={id}>
                          <Link
                            href={`${path}${search}`}
                            underline="hover"
                            {...(isActive ? { "aria-current": "page" as const } : {})}
                            className={`flex min-h-10 items-center border-s-2 ps-3 hover:no-underline ${isActive ? "border-accent font-medium !text-foreground" : "border-transparent !text-muted"}`}
                          >
                            {t(label)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                {current ? <Sidebar current={current} /> : null}
              </Drawer.Body>
            </Drawer>
            {palette}
          </div>
        )}
      </DesignSystemProvider>
    </RouterProvider>
  );
}
