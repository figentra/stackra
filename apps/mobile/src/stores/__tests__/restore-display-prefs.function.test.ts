/**
 * Stackra file contract:
 * Purpose: proves `restoreDisplayPrefs` puts the remembered brand, transition and haptics switch back, leaves the
 *          default brand alone, and remembers later transition and haptics changes.
 * Boundary: the function alone; the stores and @stackra/ui's haptics switch are recording stand-ins, and
 *           react-native-mmkv is absent, so `displayPrefs` keeps values in memory.
 * Runtime: node
 * Governing contract: ADR 0256 (client storage); ADR 0022 (test placement).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => {
  const listeners = { haptics: new Set<() => void>(), transition: new Set<() => void>() };
  const state = { haptics: true, preset: 12 };
  return {
    state,
    dispatch: vi.fn(),
    haptics: {
      isEnabled: () => state.haptics,
      setEnabled: (next: boolean) => {
        state.haptics = next;
        for (const listener of listeners.haptics) listener();
      },
      subscribe: (listener: () => void) => {
        listeners.haptics.add(listener);
        return () => void listeners.haptics.delete(listener);
      },
    },
    themeTransition: {
      getSnapshot: () => state.preset,
      setPreset: (next: number) => {
        state.preset = next;
        for (const listener of listeners.transition) listener();
      },
      subscribe: (listener: () => void) => {
        listeners.transition.add(listener);
        return () => void listeners.transition.delete(listener);
      },
    },
  };
});

vi.mock("@stackra/ui/native", () => ({ haptics: fakes.haptics }));
vi.mock("../theme-settings.store", () => ({ themeSettings: { dispatch: fakes.dispatch } }));
vi.mock("../theme-transition.store", () => ({ themeTransition: fakes.themeTransition }));
vi.mock("#src/constants/brand-themes.constant", () => ({
  BRAND_THEMES: [
    { id: "figentra", theme: "figentra-theme" },
    { id: "organza", theme: "organza-theme" },
  ],
}));

const { displayPrefs } = await import("../display-prefs.store");
const { restoreDisplayPrefs } = await import("../restore-display-prefs.function");

describe("restoreDisplayPrefs", () => {
  beforeEach(() => {
    fakes.dispatch.mockClear();
  });

  it("starts on the defaults when nothing is remembered", () => {
    const stop = restoreDisplayPrefs();
    expect(fakes.dispatch).not.toHaveBeenCalled();
    expect(fakes.state).toEqual({ haptics: true, preset: 12 });
    stop();
  });

  it("restores the remembered brand, transition and haptics, then remembers changes", () => {
    displayPrefs.set("brand", "organza");
    displayPrefs.set("transition", "1");
    displayPrefs.set("haptics", "off");
    const stop = restoreDisplayPrefs();
    expect(fakes.dispatch).toHaveBeenCalledWith({
      type: "change",
      step: { base: "organza-theme", knobs: {} },
    });
    expect(fakes.state).toEqual({ haptics: false, preset: 1 });
    fakes.haptics.setEnabled(true);
    fakes.themeTransition.setPreset(0);
    expect(displayPrefs.get("haptics")).toBe("on");
    expect(displayPrefs.get("transition")).toBe("0");
    stop();
  });
});
