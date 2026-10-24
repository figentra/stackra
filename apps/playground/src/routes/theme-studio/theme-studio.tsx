/**
 * Stackra file contract:
 * Purpose: the Theme Studio page. A few knobs (name, preset, accent, neutrals, radius, faces) derive a full theme
 *          from the stackra theme, or from an imported one.
 *          - Preview: shown live in the scheme on screen, with its contrast checked against AA.
 *          - Export: as web CSS, native CSS, the full JSON, a changes-only JSON or DTCG tokens.
 *          - State: the knobs live in the address, so a link opens the same theme. Every change can be undone and
 *            redone, and reset returns to the stackra theme.
 * Boundary: page state only; the theme is derived, checked, diffed and serialised by @stackra/tokens. An imported
 *          theme becomes the base and is not in the address.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (decision 5).
 */
import { deriveTheme, InvalidThemeError, STACKRA_THEME } from "@stackra/tokens";
import type { Theme, ThemeKnobs } from "@stackra/tokens/contracts";
import * as Ui from "@stackra/ui/react";
import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { STUDIO_FACES, StudioControls } from "#src/components/studio-controls";
import { StudioExport } from "#src/components/studio-export";
import { StudioPreview } from "#src/components/studio-preview";
import { ThemeStudioRoute } from "#src/routes/theme-studio/theme-studio.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::studio.*` keys.
const STRINGS = {
  documentTitle: `${ThemeStudioRoute.title} · Stackra Playground`,
  intro:
    "Start from the stackra theme, move a few controls, and take the result away as CSS, JSON or design tokens. Every value is checked, and the contrast of the main pairs is measured as you go.",
  history: "History",
  undo: "Undo",
  redo: "Redo",
  reset: "Reset",
  link: "Copy link",
  linkCopied: "Link copied.",
  imported: "Imported theme: not kept in the address.",
  invalid: "These controls make a theme that cannot be used; the last good one is shown:",
} as const;

/** The search params the knobs live in; the scheme, locale and material params are the shell's. */
const PARAMS = ["name", "accent", "hue", "tint", "radius", "font", "arabic"] as const;

const numberIn = (value: string | null, min: number, max: number) => {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : undefined;
};

/** The knobs a set of search params holds; anything unreadable is left out. */
function knobsFrom(params: URLSearchParams): ThemeKnobs {
  const [hue, chroma] = (params.get("accent") ?? "").split(",");
  const accentHue = numberIn(hue ?? null, 0, 360);
  const accentChroma = numberIn(chroma ?? null, 0, 0.37);
  const font = STUDIO_FACES.latin.find(({ id }) => id === params.get("font"));
  const arabic = STUDIO_FACES.arabic.find(({ id }) => id === params.get("arabic"));
  return {
    ...(params.get("name") ? { name: params.get("name") ?? undefined } : {}),
    ...(accentHue === undefined || accentChroma === undefined
      ? {}
      : { accent: { hue: accentHue, chroma: accentChroma } }),
    ...(numberIn(params.get("hue"), 0, 360) === undefined
      ? {}
      : { neutralHue: numberIn(params.get("hue"), 0, 360) }),
    ...(numberIn(params.get("tint"), 0, 0.03) === undefined
      ? {}
      : { neutralChroma: numberIn(params.get("tint"), 0, 0.03) }),
    ...(numberIn(params.get("radius"), 0, 48) === undefined
      ? {}
      : { radius: numberIn(params.get("radius"), 0, 48) }),
    ...(font ? { fontSans: font.stack } : {}),
    ...(arabic ? { fontArabic: arabic.stack } : {}),
  };
}

/** `params` with the knobs written in and the shell's params kept. */
function paramsWith(params: URLSearchParams, knobs: ThemeKnobs): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of PARAMS) next.delete(name);
  const put = (name: (typeof PARAMS)[number], value: string | number | undefined) => {
    if (value !== undefined) next.set(name, String(value));
  };
  put("name", knobs.name);
  put("accent", knobs.accent ? `${knobs.accent.hue},${knobs.accent.chroma}` : undefined);
  put("hue", knobs.neutralHue);
  put("tint", knobs.neutralChroma);
  put("radius", knobs.radius);
  put("font", STUDIO_FACES.latin.find(({ stack }) => stack === knobs.fontSans)?.id);
  put("arabic", STUDIO_FACES.arabic.find(({ stack }) => stack === knobs.fontArabic)?.id);
  return next;
}

/** One step of the history: the base and the knobs on it. */
interface Step {
  readonly base: Theme;
  readonly knobs: ThemeKnobs;
}

/** The Theme Studio. */
export function ThemeStudio() {
  const [params, setParams] = useSearchParams();
  const { resolvedColorScheme } = Ui.useDesignSystem();
  const [base, setBase] = useState<Theme>(STACKRA_THEME);
  const [past, setPast] = useState<readonly Step[]>([]);
  const [future, setFuture] = useState<readonly Step[]>([]);
  const [status, setStatus] = useState("");
  const knobs = knobsFrom(params);

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

  const show = (step: Step) => {
    setBase(step.base);
    setParams((previous) => paramsWith(previous, step.knobs), { replace: true });
  };
  const change = (next: Step) => {
    setPast([...past, { base, knobs }]);
    setFuture([]);
    show(next);
  };
  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setPast(past.slice(0, -1));
    setFuture([{ base, knobs }, ...future]);
    show(previous);
  };
  const redo = () => {
    const [next, ...rest] = future;
    if (!next) return;
    setFuture(rest);
    setPast([...past, { base, knobs }]);
    show(next);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus(STRINGS.linkCopied);
    } catch {
      setStatus(window.location.href);
    }
  };

  return (
    <article className="grid gap-6 pt-4">
      <title>{STRINGS.documentTitle}</title>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid max-w-2xl gap-2">
          <Ui.Heading level={1}>{ThemeStudioRoute.title}</Ui.Heading>
          <Ui.Text tone="muted">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </div>
        <Ui.Toolbar aria-label={STRINGS.history} className="flex flex-wrap items-center gap-2">
          <Ui.Button
            size="sm"
            variant="secondary"
            startIcon={<Ui.Icon name="undo-2" isMirroredInRtl />}
            isDisabled={past.length === 0}
            onPress={undo}
          >
            {STRINGS.undo}
          </Ui.Button>
          <Ui.Button
            size="sm"
            variant="secondary"
            startIcon={<Ui.Icon name="redo-2" isMirroredInRtl />}
            isDisabled={future.length === 0}
            onPress={redo}
          >
            {STRINGS.redo}
          </Ui.Button>
          <Ui.Button
            size="sm"
            variant="secondary"
            startIcon="rotate-ccw"
            onPress={() => change({ base: STACKRA_THEME, knobs: {} })}
          >
            {STRINGS.reset}
          </Ui.Button>
          <Ui.Button
            size="sm"
            variant="secondary"
            startIcon="link-2"
            onPress={() => void copyLink()}
          >
            {STRINGS.link}
          </Ui.Button>
        </Ui.Toolbar>
      </header>
      <p role="status" className="min-h-5 text-sm text-muted">
        {status ? <bdi>{status}</bdi> : null}
        {base === STACKRA_THEME ? null : <bdi> {STRINGS.imported}</bdi>}
      </p>
      {derived.problems ? (
        <div role="alert" className="material grid gap-1 rounded-2xl p-4 text-sm text-danger">
          <p className="font-medium">{STRINGS.invalid}</p>
          <ul className="list-disc ps-5">
            {derived.problems.slice(0, 6).map((problem) => (
              <li key={problem}>
                <bdi>{problem}</bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {/* A builder's layout: the controls and the export stay in reach at the sides while the canvas scrolls. */}
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)_26rem]">
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-3xl">
          <StudioControls knobs={knobs} onChange={(next) => change({ base, knobs: next })} />
        </div>
        <StudioPreview theme={derived.theme} scheme={resolvedColorScheme} />
        <div className="lg:col-span-2 2xl:sticky 2xl:top-24 2xl:col-span-1 2xl:max-h-[calc(100dvh-7rem)] 2xl:overflow-y-auto 2xl:overscroll-contain 2xl:rounded-3xl">
          <StudioExport
            base={STACKRA_THEME}
            theme={derived.theme}
            onImport={(theme) => change({ base: theme, knobs: {} })}
          />
        </div>
      </div>
    </article>
  );
}
