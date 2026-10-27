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
 *          palette, and it keeps the browser's theme-color in step with the scheme on screen. A page that draws its
 *          own `main` (`ownsMain`, the Pro AppLayout) is hosted in a plain element, since a page has one `main`
 *          landmark.
 * Boundary: layout, the switcher and the palette's open state only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0165 (web client stack); ADR 0060 (light,
 *          dark, RTL).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { MaterialMode } from "@stackra/tokens/contracts";
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
import {
  CommandPalette,
  type CommandPaletteProps,
  type PaletteAction,
} from "#src/components/command-palette";
import { PagePager } from "#src/components/page-pager";
import type { ShellContext } from "#src/types/shell-context.type";
import type { PlaygroundShellProps } from "#src/components/playground-shell/playground-shell.props";
import { Icons } from "#src/constants/icons.constant";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::shell.*` keys.
const STRINGS = {
  brand: "Stackra",
  product: "Playground",
  skip: "Skip to content",
  search: "Search components",
  studio: "Theme Studio",
  settings: "Display settings",
  showSettings: "Scheme and language",
  colorScheme: "Colour scheme",
  language: "Language and direction",
  scheme: { light: "Light", dark: "Dark", system: "System" },
  material: "Material",
  materials: { solid: "Solid", frosted: "Frosted", glass: "Glass", liquid: "Liquid" },
  title: "Stackra Design System",
  actions: {
    scheme: (name: string) => `${name} scheme`,
    material: (name: string) => `${name} material`,
    home: "Go to the index",
    components: "Browse every component",
    componentsDetail: "The gallery, by category",
    studioDetail: "Derive, preview and export a theme",
  },
} as const;

/** The icon of each scheme choice; its name is the choice's accessible name. */
const SCHEME_ICONS = { light: "sun", dark: "moon", system: "monitor" } as const;

/** The icon of each material mode (ADR 0320); its name is the choice's accessible name. */
const MATERIAL_ICONS = {
  solid: "square",
  frosted: "snowflake",
  glass: "layers",
  liquid: "droplet",
} as const satisfies Record<MaterialMode, string>;

/** The routes that are workspaces and take the whole width of the window. */
const WIDE_PATHS: ReadonlySet<string> = new Set(["/theme-studio"]);

/** The mode the playground shows when the address names none: the showcase default. */
const DEFAULT_MATERIAL: MaterialMode = "glass";

/** The locales the switcher offers: one left-to-right, one right-to-left; each name in its own language. */
const LOCALES = [
  { id: "en", short: "English", name: "English (LTR)", dir: "ltr" },
  { id: "ar", short: "العربية", name: "العربية (RTL)", dir: "rtl" },
] as const;

/** The palette's shortcut as this platform writes it. */
const SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

/** Props of {@link DisplaySettings}. */
interface DisplaySettingsProps {
  /** The material mode on screen. */
  material: MaterialMode;
  /** Called with the mode the reader picks. */
  onMaterialChange: (material: MaterialMode) => void;
}

/** The colour scheme, locale and material switcher, built from HeroUI's Toolbar and ToggleButtonGroup. */
function DisplaySettings({ material, onMaterialChange }: DisplaySettingsProps) {
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
      <ToggleButtonGroup
        aria-label={STRINGS.material}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[material]}
        onSelectionChange={(keys) => {
          const picked = MaterialMode.find((mode) => keys.has(mode));
          if (picked) onMaterialChange(picked);
        }}
      >
        {MaterialMode.map((mode) => (
          <Choice key={mode} id={mode} aria-label={STRINGS.materials[mode]}>
            <Icon name={MATERIAL_ICONS[mode]} size="sm" />
          </Choice>
        ))}
      </ToggleButtonGroup>
    </Toolbar>
  );
}

/** The command palette with the shell's quick actions: the scheme, the language and the places to go. */
function ShellPalette({
  onMaterialChange,
  ...props
}: Omit<CommandPaletteProps, "actions"> & { onMaterialChange: (material: MaterialMode) => void }) {
  const { setColorScheme, setLocale } = useDesignSystem();
  const navigate = useNavigate();
  const actions: PaletteAction[] = [
    ...ColorScheme.map((scheme) => ({
      id: `scheme-${scheme}`,
      label: STRINGS.actions.scheme(STRINGS.scheme[scheme]),
      detail: STRINGS.colorScheme,
      icon: SCHEME_ICONS[scheme],
      keywords: "theme appearance mode",
      run: () => setColorScheme(scheme),
    })),
    ...LOCALES.map(({ id, name }) => ({
      id: `locale-${id}`,
      label: name,
      detail: STRINGS.language,
      icon: "languages" as const,
      keywords: `language direction ${id === "ar" ? "arabic rtl" : "english ltr"}`,
      run: () => setLocale(id),
    })),
    ...MaterialMode.map((mode) => ({
      id: `material-${mode}`,
      label: STRINGS.actions.material(STRINGS.materials[mode]),
      detail: STRINGS.material,
      icon: MATERIAL_ICONS[mode],
      keywords: "glass liquid frosted solid material transparency",
      run: () => onMaterialChange(mode),
    })),
    {
      id: "go-home",
      label: STRINGS.actions.home,
      detail: STRINGS.title,
      icon: Icons.Sparkles,
      keywords: "home index landing",
      run: () => void navigate(`/${props.search}`),
    },
    {
      id: "go-studio",
      label: STRINGS.studio,
      detail: STRINGS.actions.studioDetail,
      icon: Icons.Palette,
      keywords: "theme builder customise customize export tokens",
      run: () => void navigate(`/theme-studio${props.search}`),
    },
    {
      id: "go-components",
      label: STRINGS.actions.components,
      detail: STRINGS.actions.componentsDetail,
      icon: Icons.LayoutGrid,
      keywords: "gallery all pages",
      run: () => void navigate(`/${props.search}#components`),
    },
  ];
  return <CommandPalette {...props} actions={actions} />;
}

/** Layout route of the playground: provider, glass bar, page chrome, the current page and the palette. */
export function PlaygroundShell({ pages }: PlaygroundShellProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const current = pages.find((page) => page.path === pathname);
  // A workspace (the Theme Studio) takes the whole width; reading pages keep a measure.
  const width = WIDE_PATHS.has(pathname) ? "w-[calc(100%-1.5rem)]" : "w-[min(100%-1.5rem,80rem)]";
  // The material mode is the document's, as the scheme is: the provider sets it (index.html before paint).
  const material = MaterialMode.find((mode) => mode === params.get("material")) ?? DEFAULT_MATERIAL;
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
  }, []);

  const context: ShellContext = { openPalette };

  const ownsMain = pages.some((page) => page.path === pathname && page.ownsMain);
  const pageArea = (
    <>
      {current ? <CategoryNav pages={pages} current={current} search={search} /> : null}
      {/* A component page sits on a solid sheet of the theme's background: its soft and translucent samples are tuned
          against that colour, so the ambient field never shifts what they measure. */}
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
    </>
  );

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <DesignSystemProvider
        colorScheme={ColorScheme.find((scheme) => scheme === params.get("scheme"))}
        locale={LOCALES.find(({ id }) => id === params.get("locale"))?.id}
        onColorSchemeChange={(scheme) => setParam("scheme", scheme)}
        onLocaleChange={(locale) => setParam("locale", locale)}
        material={material}
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
          <header
            className={`material-thick sticky top-3 z-20 mx-auto mt-3 flex ${width} flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl px-2 py-2 sm:gap-x-3 sm:px-3`}
          >
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
            <Link
              href={`/theme-studio${search}`}
              underline="hover"
              className="flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-sm hover:bg-default hover:no-underline"
            >
              <Icon name="palette" size="sm" />
              <span className="max-lg:sr-only">{STRINGS.studio}</span>
            </Link>
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
              <DisplaySettings
                material={material}
                onMaterialChange={(mode) => setParam("material", mode)}
              />
            </div>
          </header>
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
          <ShellPalette
            pages={pages}
            search={search}
            isOpen={isPaletteOpen}
            onClose={onPaletteClose}
            onMaterialChange={(mode) => setParam("material", mode)}
          />
        </div>
      </DesignSystemProvider>
    </RouterProvider>
  );
}
