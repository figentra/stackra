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
import { deriveTheme, InvalidThemeError, STACKRA_THEME } from "@stackra/tokens";
import { Uniwind } from "uniwind";
import type { ThemeStep } from "./theme-step.type";
import type { ThemeSettings } from "./theme-settings.type";
import type { ThemeSettingsChange } from "./theme-settings-change.type";
import { uniwindVariables } from "./uniwind-variables.function";

const STACKRA_STEP: ThemeStep = { base: STACKRA_THEME, knobs: {} };

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
        present: change.type === "reset" ? STACKRA_STEP : change.step,
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
