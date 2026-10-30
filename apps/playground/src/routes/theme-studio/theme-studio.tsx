/**
 * Stackra file contract:
 * Purpose: the Theme Studio page, a full-screen theme builder in the manner of a theme editor:
 *          - Top bar: exit and the title (with the brand under it), the device (desktop, iPad, iPhone, Android) and
 *            its orientation, undo and redo, a Display popover (mode, side by side, zoom, direction, reset, copy
 *            link), the inspector's toggle and Export.
 *          - Left rail: Brand, Colours, Type, Shape, Motion and Effects, each a section that expands. Picking a brand
 *            starts the studio from its theme, redraws the whole showcase in it (inside the picked transition, and
 *            the next load opens on it), and every control then shows that theme's own values.
 *          - Canvas: a page template in a device frame, in the derived theme and its display faces only.
 *          - Inspector: a split SidePanel at the end edge that pushes the top bar and content, resizes from its border
 *            and expands over the studio; it holds the contrast of the main pairs against AA, then export and import.
 *            It starts folded below 80rem and folds while light and dark sit side by side, coming back after.
 *          - State: the knobs live in the address, so a link opens the same theme. Every change can be undone and
 *            redone, and reset returns to the brand's theme.
 * Boundary: page state only; the theme is derived, checked, diffed and serialised by @stackra/tokens. An imported
 *          theme becomes the base and is not in the address. The route's handle asks the shell for the whole screen.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (decision 5); ADR 0340 (decision 2).
 */
import { deriveTheme, InvalidThemeError, STACKRA_THEME } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";
import type { SidePanelState } from "@stackra/ui/contracts";
import {
  Accordion,
  Heading,
  Icon,
  Separator,
  SidePanel,
  toast,
  ToastProvider,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import {
  applyBrandTheme,
  brandThemeOf,
  readActiveBrand,
  StudioBrands,
} from "#src/components/studio-brands";
import { StudioContrast } from "#src/components/studio-contrast";
import { StudioControls, type StudioKnobs } from "#src/components/studio-controls";
import { StudioExport } from "#src/components/studio-export";
import { STUDIO_VIEW, StudioPreview, type StudioView } from "#src/components/studio-preview";
import { StudioTopBar } from "#src/components/studio-top-bar";
import { runThemeTransition } from "#src/components/theme-transition";
import { type BrandTheme, BRAND_THEMES } from "#src/constants/brand-themes";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { knobsFrom } from "./knobs-from.function";
import { paramsWith } from "./params-with.function";
import { THEME_STUDIO_KEYS } from "./theme-studio-keys.constant";

/** The page's keys. */
const K = THEME_STUDIO_KEYS.theme_studio;

/** The rail's sections, in order, with their icons. */
const SECTIONS = [
  { id: "brand", icon: Icons.Flag },
  { id: "colours", icon: Icons.Palette },
  { id: "type", icon: Icons.Type },
  { id: "shape", icon: Icons.Square },
  { id: "motion", icon: Icons.Zap },
  { id: "effects", icon: Icons.Sparkles },
] as const;

/** One step of the history: the brand, the base and the knobs on it. */
interface Step {
  readonly brand: BrandTheme;
  readonly base: Theme;
  readonly knobs: StudioKnobs;
}

/** The Theme Studio. */
export function ThemeStudio() {
  const t = useCatalogueText(MESSAGES.en);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { resolvedColorScheme } = useDesignSystem();
  // A shared link names its brand; otherwise the studio opens on the one picked last.
  const [brand, setBrand] = useState(
    () => BRAND_THEMES.find(({ id }) => id === params.get("brand")) ?? readActiveBrand(),
  );
  const [base, setBase] = useState<Theme>(() => brandThemeOf(brand));
  const [past, setPast] = useState<readonly Step[]>([]);
  const [future, setFuture] = useState<readonly Step[]>([]);
  const [view, setView] = useState<StudioView>(STUDIO_VIEW);
  const [schemeChoice, setSchemeChoice] = useState<"light" | "dark" | null>(null);
  // Open by default only where the preview keeps its room beside it; on a narrower window it starts folded.
  const [inspector, setInspector] = useState<SidePanelState>(() =>
    typeof matchMedia !== "function" || matchMedia("(min-width: 80rem)").matches
      ? "open"
      : "closed",
  );
  const isInspectorOpen = inspector !== "closed";
  // Where the inspector was before light and dark went side by side, to put it back after.
  const inspectorBeforeSplit = useRef<SidePanelState>("open");
  const knobs = knobsFrom(params);
  const scheme = schemeChoice ?? resolvedColorScheme;
  const isBrandBase = base === brandThemeOf(brand);
  const direction = params.get("locale") === "ar" ? "rtl" : "ltr";

  // Sliders move many times a second; the derived theme follows a step behind, so the controls stay smooth.
  const deferredQuery = useDeferredValue(paramsWith(params, knobs).toString());
  const derived = useMemo(() => {
    try {
      return { theme: deriveTheme(base, knobsFrom(new URLSearchParams(deferredQuery))) };
    } catch (error) {
      return {
        theme: base,
        problems: error instanceof InvalidThemeError ? error.problems : [String(error)],
      };
    }
  }, [base, deferredQuery]);

  // The display faces: a knob, else the theme's own (once @stackra/tokens carries them), else the brand's.
  const baseFaces = base.fontFamily as Partial<Record<"display" | "displayArabic", string>>;
  const fonts = {
    display: knobs.display
      ? `"${knobs.display}", var(--font-sans)`
      : (baseFaces.display ??
        (isBrandBase ? `"${brand.display}", var(--font-sans)` : "var(--font-sans)")),
    displayArabic: knobs.displayArabic
      ? `"${knobs.displayArabic}", var(--font-arabic)`
      : (baseFaces.displayArabic ??
        (isBrandBase ? `"${brand.displayArabic}", var(--font-arabic)` : "var(--font-arabic)")),
  };

  // The page wears the studio's brand, a linked one included.
  useEffect(() => applyBrandTheme(brand), [brand]);

  const show = (step: Step) => {
    setBrand(step.brand);
    setBase(step.base);
    setParams((previous) => paramsWith(previous, step.knobs), { replace: true });
  };
  const change = (next: Step) => {
    setPast([...past, { brand, base, knobs }]);
    setFuture([]);
    show(next);
  };
  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setPast(past.slice(0, -1));
    setFuture([{ brand, base, knobs }, ...future]);
    show(previous);
  };
  const redo = () => {
    const [next, ...rest] = future;
    if (!next) return;
    setFuture(rest);
    setPast([...past, { brand, base, knobs }]);
    show(next);
  };
  const pickBrand = (next: BrandTheme) =>
    runThemeTransition(() => {
      applyBrandTheme(next);
      change({ brand: next, base: brandThemeOf(next), knobs: {} });
    });
  const copyLink = async () => {
    // The brand rides in the link only: the address keeps the knobs, the brand lives in storage.
    const link = new URL(window.location.href);
    link.searchParams.set("brand", brand.id);
    try {
      await navigator.clipboard.writeText(link.href);
      toast.success(t(K.page.link_copied));
    } catch {
      // No clipboard (an insecure origin, a refused permission): the link itself, to copy by hand.
      toast(link.href);
    }
  };
  const openExport = () => {
    setInspector((current) => (current === "closed" ? "open" : current));
    requestAnimationFrame(() =>
      document.getElementById("studio-export")?.scrollIntoView({ behavior: "smooth" }),
    );
  };
  const exit = () => {
    const kept = new URLSearchParams();
    for (const name of ["scheme", "locale"]) {
      const value = params.get(name);
      if (value) kept.set(name, value);
    }
    void navigate({ pathname: "/components", search: kept.toString() });
  };
  const setDirection = (next: "ltr" | "rtl") =>
    setParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous);
        if (next === "rtl") nextParams.set("locale", "ar");
        else nextParams.delete("locale");
        return nextParams;
      },
      { replace: true },
    );

  return (
    // The inspector is a SidePanel column of the page itself, full height and split from the work area: opening it
    // pushes the top bar and the content over, its border resizes it, and its header expands it over the whole studio.
    <SidePanel
      label={t(K.page.inspector)}
      state={inspector}
      onStateChange={setInspector}
      variant="split"
      className="fixed inset-0 z-30 text-foreground"
    >
      <SidePanel.Inset className="grid grid-rows-[auto_minmax(0,1fr)]">
        <title>{t(K.page.document_title)}</title>
        {/* The studio draws the whole window, outside the shell, so it mounts its own toasts (copy link). */}
        <ToastProvider dismissLabel={t(K.page.dismiss)} position="bottom" />
        <StudioTopBar
          brand={brand}
          view={view}
          onViewChange={(next) => {
            // Two devices need the width: going side by side folds the inspector away (it can still be opened, and
            // then pushes as usual), and coming back restores whatever the reader had.
            if (next.isSideBySide !== view.isSideBySide) {
              if (next.isSideBySide) {
                inspectorBeforeSplit.current = inspector;
                setInspector("closed");
              } else setInspector(inspectorBeforeSplit.current);
            }
            setView(next);
          }}
          schemeChoice={schemeChoice}
          onSchemeChange={setSchemeChoice}
          direction={direction}
          onDirectionChange={setDirection}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onReset={() => change({ brand, base: brandThemeOf(brand), knobs: {} })}
          onCopyLink={() => void copyLink()}
          isInspectorOpen={isInspectorOpen}
          onInspectorToggle={() => setInspector(isInspectorOpen ? "closed" : "open")}
          onExport={openExport}
          onExit={exit}
        />
        <div className="grid min-h-0 grid-cols-[18rem_minmax(0,1fr)]">
          {/* Each rail paints the page's background itself, so a row cut by the window's edge is measured against its
            own scroller (which spans its whole content) rather than the window-sized studio behind it. */}
          <nav
            aria-label={t(K.rail.label)}
            className="grid min-h-0 content-start gap-3 overflow-y-auto overscroll-contain border-e border-separator bg-background p-3"
          >
            {isBrandBase ? null : (
              <p role="status" className="text-sm text-muted">
                <bdi>{t(K.page.imported)}</bdi>
              </p>
            )}
            {derived.problems ? (
              <div role="alert" className="grid gap-1 text-sm text-danger">
                <p className="font-medium">{t(K.page.invalid)}</p>
                <ul className="list-disc ps-5">
                  {derived.problems.slice(0, 6).map((problem) => (
                    <li key={problem}>
                      <bdi>{problem}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {/* The accordion's titles are h3: the rail is the h2 they sit under. */}
            <Heading level={2} className="sr-only">
              {t(K.rail.label)}
            </Heading>
            <Accordion
              canExpandMultiple
              defaultExpandedKeys={["brand", "colours"]}
              items={SECTIONS.map(({ id, icon }) => ({
                id,
                title: (
                  <span className="flex items-center gap-2">
                    <Icon name={icon} size="sm" />
                    {t(K.rail[id])}
                  </span>
                ),
                content: (
                  <div className="grid gap-4 pb-2">
                    {id === "brand" ? <StudioBrands value={brand} onChange={pickBrand} /> : null}
                    <StudioControls
                      section={id}
                      knobs={knobs}
                      base={base}
                      baseLabel={
                        isBrandBase ? brand.name[direction === "rtl" ? "ar" : "en"] : base.name
                      }
                      fonts={fonts}
                      scheme={scheme}
                      onChange={(next) => change({ brand, base, knobs: next })}
                    />
                  </div>
                ),
              }))}
            />
          </nav>
          <StudioPreview theme={derived.theme} scheme={scheme} view={view} fonts={fonts} />
        </div>
      </SidePanel.Inset>
      <SidePanel.Panel>
        <SidePanel.Handle />
        <SidePanel.Header>
          <Heading level={2} className="truncate text-sm font-semibold">
            {t(K.page.inspector)}
          </Heading>
        </SidePanel.Header>
        <SidePanel.Body className="grid content-start gap-6">
          <StudioContrast theme={derived.theme} scheme={scheme} />
          <Separator />
          <StudioExport
            base={STACKRA_THEME}
            theme={derived.theme}
            onImport={(theme) => change({ brand, base: theme, knobs: {} })}
          />
        </SidePanel.Body>
      </SidePanel.Panel>
    </SidePanel>
  );
}
