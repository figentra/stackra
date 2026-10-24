/**
 * Stackra file contract:
 * Purpose: the app's theme settings, the native twin of the playground's Theme Studio state:
 *          - Knobs: a base theme and the knobs on it (`deriveTheme`), with undo, redo and reset.
 *          - Live: every change derives the theme and pushes its HeroUI variables into Uniwind's light and dark
 *            themes, so the whole app restyles at once. Knobs that make an invalid theme keep the last good one on
 *            screen and report the problems.
 *          - Drafts: a moving slider previews its value and becomes one history step when it is let go.
 *          - Contrast: the theme's main pairs measured against WCAG 2.2 AA.
 * Boundary: state and Uniwind's runtime variables only; the theme is derived, checked and measured by @stackra/tokens.
 *           shortcut: the knobs live in memory and reset on launch, because the app has no storage dependency yet;
 *           persist them through `@stackra/storage` once the app takes it (ADR 0256).
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); WCAG 2.2 SC 1.4.3, 1.4.11.
 */
import {
  contrastRatio,
  deriveTheme,
  InvalidThemeError,
  STACKRA_THEME,
  themeVariables,
} from "@stackra/tokens";
import type { ColorRole, Theme, ThemeKnobs } from "@stackra/tokens/contracts";
import { useSyncExternalStore } from "react";
import { Uniwind } from "uniwind";

/** The presets: the same names and knobs as the playground's Theme Studio. */
export const THEME_PRESETS: readonly { id: string; label: string; knobs: ThemeKnobs }[] = [
  { id: "stackra", label: "Stackra", knobs: {} },
  {
    id: "steel",
    label: "Steel",
    knobs: { accent: { hue: 248, chroma: 0.09 }, neutralHue: 248, neutralChroma: 0.012 },
  },
  {
    id: "ember",
    label: "Ember",
    knobs: { accent: { hue: 40, chroma: 0.16 }, neutralHue: 60, neutralChroma: 0.008, radius: 8 },
  },
  {
    id: "moss",
    label: "Moss",
    knobs: { accent: { hue: 150, chroma: 0.12 }, neutralHue: 140, neutralChroma: 0.008, radius: 6 },
  },
  {
    id: "violet",
    label: "Violet",
    knobs: { accent: { hue: 295, chroma: 0.15 }, neutralHue: 290, neutralChroma: 0.01, radius: 12 },
  },
];

/**
 * The faces on offer: the theme's own stack (no knob), or a platform face every device has. The app bundles no font
 * file, so a face changes the exported theme; native components draw in the system face either way.
 */
export const THEME_FACES: Readonly<
  Record<"latin" | "arabic", readonly { id: string; label: string; stack: string | undefined }[]>
> = {
  latin: [
    { id: "theme", label: "Theme", stack: undefined },
    { id: "system", label: "System", stack: "system-ui, sans-serif" },
    { id: "serif", label: "Serif", stack: "ui-serif, Georgia, serif" },
    { id: "mono", label: "Mono", stack: "ui-monospace, Menlo, monospace" },
  ],
  arabic: [
    { id: "theme", label: "Theme", stack: undefined },
    { id: "system", label: "System", stack: "system-ui, sans-serif" },
  ],
};

/** The pairs the contrast readout measures, as the web studio does, and the ratio each needs. */
const CONTRAST_PAIRS: readonly { name: string; fg: ColorRole; bg: ColorRole; needs: number }[] = [
  { name: "Text on background", fg: "foreground", bg: "background", needs: 4.5 },
  { name: "Muted text on background", fg: "muted", bg: "background", needs: 4.5 },
  { name: "Text on surface", fg: "surface-foreground", bg: "surface", needs: 4.5 },
  { name: "Accent label", fg: "accent-foreground", bg: "accent", needs: 4.5 },
  { name: "Link on background", fg: "link", bg: "background", needs: 4.5 },
  { name: "Field text", fg: "field-foreground", bg: "field-background", needs: 4.5 },
  { name: "Danger label", fg: "danger-foreground", bg: "danger", needs: 4.5 },
  { name: "Field edge", fg: "field-border", bg: "field-background", needs: 3 },
  { name: "Focus ring", fg: "focus", bg: "background", needs: 3 },
];

/** One step of the history: the base theme and the knobs on it. */
interface ThemeStep {
  /** The theme the knobs derive from: the stackra theme, or an imported one. */
  readonly base: Theme;
  /** The knobs on the base. */
  readonly knobs: ThemeKnobs;
}

/** What the settings hold at one moment. */
export interface ThemeSettings {
  /** Steps that undo walks back to, oldest first. */
  readonly past: readonly ThemeStep[];
  /** The committed step. */
  readonly present: ThemeStep;
  /** The step a moving slider shows before it is let go. */
  readonly draft: ThemeStep | undefined;
  /** Steps that redo walks forward to, nearest first. */
  readonly future: readonly ThemeStep[];
  /** The theme on screen: the derived one, or the last good one when the knobs make an invalid theme. */
  readonly theme: Theme;
  /** Why the knobs make no usable theme; empty when they do. */
  readonly problems: readonly string[];
}

/** A change to the settings. */
export type ThemeSettingsChange =
  | { readonly type: "change"; readonly step: ThemeStep }
  | { readonly type: "draft"; readonly step: ThemeStep }
  | { readonly type: "undo" }
  | { readonly type: "redo" }
  | { readonly type: "reset" };

/** The variables pushed into each of Uniwind's themes. */
export type UniwindVariables = Record<"light" | "dark", Record<string, string | number>>;

const STACKRA_STEP: ThemeStep = { base: STACKRA_THEME, knobs: {} };

const LENGTH = /^(-?[\d.]+)(px|rem)$/;

/** A web variable's value as Uniwind's runtime takes it, or `undefined` for one it cannot read. */
function nativeValue(name: string, value: string): string | number | undefined {
  // Shadows hold oklch inside a list, which only Uniwind's build converts; a `var()` is resolved by the built styles.
  if (name.endsWith("-shadow") || value.startsWith("var(")) return undefined;
  const length = LENGTH.exec(value);
  // Uniwind's build turns lengths into px numbers, and its runtime takes values as given.
  if (length) return Number(length[1]) * (length[2] === "rem" ? 16 : 1);
  return value; // A colour: Uniwind's runtime parses oklch.
}

/** `variables` with each value as Uniwind's runtime takes it, leaving out those it cannot read. */
const native = (variables: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(variables).flatMap(([name, value]) => {
      const converted = nativeValue(name, value);
      return converted === undefined ? [] : [[name, converted] as const];
    }),
  );

/** The HeroUI variables of `theme` for each of Uniwind's themes: the mode-independent ones and the mode's. */
export function uniwindVariables(theme: Theme): UniwindVariables {
  const { heroui } = themeVariables(theme);
  return {
    light: native({ ...heroui.root, ...heroui.light }),
    dark: native({ ...heroui.root, ...heroui.dark }),
  };
}

/** The contrast of the theme's main pairs in `scheme`, each against the ratio it needs. */
export function contrastReport(theme: Theme, scheme: "light" | "dark") {
  const hex = scheme === "dark" ? "hexDark" : "hexLight";
  return CONTRAST_PAIRS.map(({ name, fg, bg, needs }) => {
    const ratio = contrastRatio(theme.colors[fg][hex], theme.colors[bg][hex]);
    return { name, ratio, needs, isPassing: ratio >= needs };
  });
}

/** The settings with `next`'s steps and the theme derived from the step on screen. */
function settle(
  state: ThemeSettings,
  next: Pick<ThemeSettings, "past" | "present" | "draft" | "future">,
): ThemeSettings {
  const shown = next.draft ?? next.present;
  try {
    return { ...next, theme: deriveTheme(shown.base, shown.knobs), problems: [] };
  } catch (error) {
    if (!(error instanceof InvalidThemeError)) throw error;
    return { ...next, theme: state.theme, problems: error.problems };
  }
}

/** The settings after `change`; the same object when nothing changes. */
function reduceThemeSettings(state: ThemeSettings, change: ThemeSettingsChange): ThemeSettings {
  const { past, present, future } = state;
  switch (change.type) {
    case "change":
    case "reset":
      return settle(state, {
        past: [...past, present],
        present: change.type === "reset" ? STACKRA_STEP : change.step,
        draft: undefined,
        future: [],
      });
    case "draft":
      return settle(state, { past, present, draft: change.step, future });
    case "undo": {
      const previous = past.at(-1);
      if (!previous) return state;
      return settle(state, {
        past: past.slice(0, -1),
        present: previous,
        draft: undefined,
        future: [present, ...future],
      });
    }
    case "redo": {
      const [next, ...rest] = future;
      if (!next) return state;
      return settle(state, {
        past: [...past, present],
        present: next,
        draft: undefined,
        future: rest,
      });
    }
  }
}

/** The stackra theme with no history: what the app's stylesheet already shows. */
const INITIAL_THEME_SETTINGS: ThemeSettings = {
  past: [],
  present: STACKRA_STEP,
  draft: undefined,
  future: [],
  theme: STACKRA_THEME,
  problems: [],
};

/** A settings store that pushes every new theme into Uniwind's light and dark themes. */
export function createThemeSettingsStore() {
  let state = INITIAL_THEME_SETTINGS;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    dispatch(change: ThemeSettingsChange) {
      const next = reduceThemeSettings(state, change);
      if (next === state) return;
      if (next.theme !== state.theme) {
        const variables = uniwindVariables(next.theme);
        Uniwind.updateCSSVariables("light", variables.light);
        Uniwind.updateCSSVariables("dark", variables.dark);
      }
      state = next;
      for (const listener of listeners) listener();
    },
  };
}

/** The app's one theme settings store. */
export const themeSettings = createThemeSettingsStore();

/** The app's theme settings, re-rendering on every change. */
export function useThemeSettings(): ThemeSettings {
  return useSyncExternalStore(themeSettings.subscribe, themeSettings.getSnapshot);
}
