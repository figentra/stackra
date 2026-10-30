/**
 * Stackra file contract:
 * Purpose: proves the theme settings turn a theme into Uniwind's runtime variables (colours as given, lengths as px
 *          numbers, no shadows and no `var()`), push a changed theme into both of Uniwind's themes, keep a slider's
 *          draft out of the history until it is let go and land drafts once a draft interval, undo and redo, keep the last
 *          good theme on invalid knobs, and measure the contrast of the main pairs.
 * Boundary: the store alone; Uniwind is a spy, so no native module loads.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SHOWCASE_THEME } from "../../constants/showcase-theme.constant";
import { THEME_PRESETS } from "../theme-presets.constant";
import { uniwindVariables } from "../uniwind-variables.function";
import { contrastReport } from "../contrast-report.function";
import { createThemeSettingsStore } from "../create-theme-settings-store.function";

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
    // The accent's palette steps travel too, so soft and secondary controls follow a new accent.
    expect(light["--accent-soft"]).toBe(STACKRA_THEME.palette["accent-soft"]?.light);
    expect(dark["--accent-soft-foreground"]).toBe(
      STACKRA_THEME.palette["accent-soft-foreground"]?.dark,
    );
    expect(Object.values(light).some((value) => String(value).includes("var("))).toBe(false);
  });
});

describe("createThemeSettingsStore", () => {
  beforeEach(() => updateCSSVariables.mockClear());

  it("paints the showcase theme over the built stylesheet when it is made", () => {
    createThemeSettingsStore();
    expect(updateCSSVariables).toHaveBeenCalledWith(
      "light",
      expect.objectContaining({ "--accent": SHOWCASE_THEME.colors.accent.light }),
    );
  });

  it("pushes a changed theme into Uniwind's light and dark themes", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: steel } });
    const { theme } = store.getSnapshot();
    expect(theme.colors.accent).not.toEqual(STACKRA_THEME.colors.accent);
    expect(updateCSSVariables).toHaveBeenCalledWith(
      "light",
      expect.objectContaining({
        "--accent": theme.colors.accent.light,
        "--accent-soft": theme.palette["accent-soft"]?.light,
      }),
    );
    expect(updateCSSVariables).toHaveBeenCalledWith(
      "dark",
      expect.objectContaining({ "--accent": theme.colors.accent.dark }),
    );
  });

  it("previews a draft without history and commits it as one step", () => {
    const store = createThemeSettingsStore((run) => run());
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 6 } } });
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    expect(store.getSnapshot().past).toHaveLength(0);
    expect(store.getSnapshot().theme.radius.base).toBe("9px");
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    expect(store.getSnapshot().past).toEqual([{ base: SHOWCASE_THEME, knobs: {} }]);
    expect(store.getSnapshot().draft).toBeUndefined();
  });

  it("lands a moving slider's drafts once a draft interval, the last one winning", () => {
    const frames: (() => void)[] = [];
    const store = createThemeSettingsStore((run) => frames.push(run));
    updateCSSVariables.mockClear();
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 6 } } });
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    expect(frames).toHaveLength(1);
    expect(store.getSnapshot().draft).toBeUndefined();
    frames[0]?.();
    expect(store.getSnapshot().theme.radius.base).toBe("9px");
    expect(updateCSSVariables).toHaveBeenCalledTimes(2); // light and dark, once
    store.dispatch({ type: "draft", step: { base: STACKRA_THEME, knobs: { radius: 3 } } });
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 9 } } });
    frames[1]?.();
    expect(store.getSnapshot().draft).toBeUndefined();
  });

  it("undoes, redoes and resets", () => {
    const store = createThemeSettingsStore();
    store.dispatch({ type: "change", step: { base: STACKRA_THEME, knobs: { radius: 8 } } });
    store.dispatch({ type: "undo" });
    expect(store.getSnapshot().present.knobs).toEqual({});
    expect(store.getSnapshot().theme.radius.base).toBe(SHOWCASE_THEME.radius.base);
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

  it("measures dark mode, whose translucent colours are composited, without throwing", () => {
    expect(contrastReport(STACKRA_THEME, "dark")).toHaveLength(9);
  });
});
