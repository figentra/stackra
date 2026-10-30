/**
 * Stackra file contract:
 * Purpose: `createThemeSettingsStore`, a theme settings store: knobs with undo, redo, reset and slider drafts, every
 *          change derived by @stackra/tokens, a theme that fails to derive keeping the last good one on screen with
 *          its problems, and every new theme pushed into Uniwind's light and dark themes.
 * Boundary: state and Uniwind's runtime variables only. shortcut: the knobs live in memory and reset on launch,
 *           because the app has no storage dependency yet; persist them through `@stackra/storage` once the app takes
 *           it (ADR 0256).
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import { deriveTheme, InvalidThemeError } from "@stackra/tokens";
import { Uniwind } from "uniwind";
import { SHOWCASE_THEME } from "../constants/showcase-theme.constant";
import type { ThemeStep } from "./theme-step.type";
import type { ThemeSettings } from "./theme-settings.type";
import type { ThemeSettingsChange } from "./theme-settings-change.type";
import { uniwindVariables } from "./uniwind-variables.function";

const SHOWCASE_STEP: ThemeStep = { base: SHOWCASE_THEME, knobs: {} };

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
    case "reset": {
      return settle(state, {
        past: [...past, present],
        present: change.type === "reset" ? SHOWCASE_STEP : change.step,
        draft: undefined,
        future: [],
      });
    }
    case "draft": {
      return settle(state, { past, present, draft: change.step, future });
    }
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

/** The showcase theme (Figentra over Stackra) with no history; the store paints it when it is made. */
const INITIAL_THEME_SETTINGS: ThemeSettings = {
  past: [],
  present: SHOWCASE_STEP,
  draft: undefined,
  future: [],
  theme: SHOWCASE_THEME,
  problems: [],
};

/** Pushes `theme` into Uniwind's light and dark themes. */
function paint(theme: ThemeSettings["theme"]) {
  const variables = uniwindVariables(theme);
  Uniwind.updateCSSVariables("light", variables.light);
  Uniwind.updateCSSVariables("dark", variables.dark);
}

/** How often a moving slider's draft repaints the app, in milliseconds. */
const DRAFT_INTERVAL = 120;

/**
 * Runs `run` after the draft interval. A repaint restyles every mounted view, so once a frame starved the slider's
 * gesture on device; a few repaints a second still read as live.
 */
const nextDraft = (run: () => void) => void setTimeout(run, DRAFT_INTERVAL);

/**
 * A settings store that pushes every new theme into Uniwind's light and dark themes, starting with its own: the built
 * stylesheet is the brand-neutral Stackra base, so the showcase layer is painted over it once. A moving slider's
 * drafts land at most once a draft interval, the last one winning, so the thumb is not held back by a derive and push per step.
 */
export function createThemeSettingsStore(schedule: (run: () => void) => void = nextDraft) {
  let state = INITIAL_THEME_SETTINGS;
  paint(state.theme);
  const listeners = new Set<() => void>();
  let pendingDraft: ThemeSettingsChange | undefined;
  const apply = (change: ThemeSettingsChange) => {
    const next = reduceThemeSettings(state, change);
    if (next === state) return;
    if (next.theme !== state.theme) paint(next.theme);
    state = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    dispatch(change: ThemeSettingsChange) {
      if (change.type !== "draft") {
        pendingDraft = undefined; // A commit, undo or reset drops a draft still waiting for its turn.
        apply(change);
        return;
      }
      const isScheduled = pendingDraft !== undefined;
      pendingDraft = change;
      if (isScheduled) return;
      schedule(() => {
        const draft = pendingDraft;
        pendingDraft = undefined;
        if (draft) apply(draft);
      });
    },
  };
}
