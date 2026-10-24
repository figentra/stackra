/**
 * Stackra file contract:
 * Purpose: proves the theme settings turn a theme into Uniwind's runtime variables (colours as given, lengths as px
 *          numbers, no shadows and no `var()`), push a changed theme into both of Uniwind's themes, keep a slider's
 *          draft out of the history until it is let go, undo and redo, keep the last good theme on invalid knobs,
 *          and measure the contrast of the main pairs.
 * Boundary: the store alone; Uniwind is a spy, so no native module loads.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  contrastReport,
  createThemeSettingsStore,
  THEME_PRESETS,
  uniwindVariables,
} from "../theme-settings.store";

const { updateCSSVariables } = vi.hoisted(() => ({ updateCSSVariables: vi.fn() }));
vi.mock("uniwind", () => ({ Uniwind: { updateCSSVariables } }));

const steel = THEME_PRESETS.find(({ id }) => id === "steel")?.knobs ?? {};

describe("uniwindVariables", () => {
  it("passes colours, turns lengths into px and leaves out shadows and var() references", () => {
    const { light, dark } = uniwindVariables(STACKRA_THEME);
    expect(light["--accent"]).toBe(STACKRA_THEME.colors.accent.light);
    expect(dark["--accent"]).toBe(STACKRA_THEME.colors.accent.dark);
    expect(light["--radius"]).toBe(4); // 0.25rem
    expect(dark["--radius"]).toBe(4);
    expect(light).not.toHaveProperty("--field-radius");
    expect(light).not.toHaveProperty("--surface-shadow");
  });
});

describe("createThemeSettingsStore", () => {
  beforeEach(() => updateCSSVariables.mockClear());

  it("pushes a changed theme into Uniwind's light and dark themes", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: steel } });
    const { theme } = store.getSnapshot();
    expect(theme.colors.accent).not.toEqual(STACKRA_THEME.colors.accent);
    expect(updateCSSVariables).toHaveBeenCalledWith(
      "light",
      expect.objectContaining({ "--accent": theme.colors.accent.light }),
    );
    expect(updateCSSVariables).toHaveBeenCalledWith(
      "dark",
      expect.objectContaining({ "--accent": theme.colors.accent.dark }),
    );
  });

  it("previews a draft without history and commits it as one step", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 6 } } });
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    expect(store.getSnapshot().past).toHaveLength(0);
    expect(store.getSnapshot().theme.radius.base).toBe("9px");
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    expect(store.getSnapshot().past).toEqual([{ base: STACKRA_THEME, knobs: {} }]);
    expect(store.getSnapshot().draft).toBeUndefined();
  });

  it("undoes, redoes and resets", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 8 } } });
    store.dispatch({ type: "undo" });
    expect(store.getSnapshot().present.knobs).toEqual({});
    expect(store.getSnapshot().theme.radius.base).toBe(STACKRA_THEME.radius.base);
    store.dispatch({ type: "redo" });
    expect(store.getSnapshot().present.knobs).toEqual({ radius: 8 });
    store.dispatch({ type: "reset" });
    expect(store.getSnapshot().present.knobs).toEqual({});
    expect(store.getSnapshot().past).toHaveLength(2);
  });

  it("does nothing on undo or redo with no history", () => {
    const store = createThemeSettingsStore();
    const before = store.getSnapshot();
    store.dispatch({ type: "undo" });
    store.dispatch({ type: "redo" });
    expect(store.getSnapshot()).toBe(before);
  });

  it("keeps the last good theme and reports the problems of invalid knobs", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 8 } } });
    const good = store.getSnapshot().theme;
    updateCSSVariables.mockClear();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { name: "Not Kebab" } } });
    expect(store.getSnapshot().theme).toBe(good);
    expect(store.getSnapshot().problems.length).toBeGreaterThan(0);
    expect(updateCSSVariables).not.toHaveBeenCalled();
  });
});

describe("contrastReport", () => {
  it("measures the main pairs against AA", () => {
    const report = contrastReport(STACKRA_THEME, "light");
    expect(report).toHaveLength(9);
    const text = report.find(({ name }) => name === "Text on background");
    expect(text?.isPassing).toBe(true);
    expect(text?.needs).toBe(4.5);
  });
});
