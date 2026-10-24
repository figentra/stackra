/**
 * Stackra file contract:
 * Purpose: proves `useGlassMaterial` answers `liquid` only where Liquid Glass and its API both run and the settings
 *          allow it, `solid` before the settings have answered and while reduced transparency or darker system
 *          colours is on, `solid` wherever Liquid Glass is missing (Android, earlier iOS), switches every mounted
 *          control together when a setting changes, and listens once for all of them until the last unmounts.
 * Boundary: React Native does not run in vitest, so react-native's AccessibilityInfo and expo-glass-effect's checks are
 *           stand-ins each test sets. The hook keeps its settings at module level, so every test imports a fresh copy.
 * Runtime: node
 * Governing contract: ADR 0319 (decision 3); ADR 0320 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

type Setting = "reduceTransparency" | "darkerColors";

const device = vi.hoisted(() => ({
  settings: { reduceTransparency: false, darkerColors: false } as Record<string, boolean>,
  handlers: new Map<string, () => void>(),
  liquid: true,
  api: true,
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceTransparencyEnabled: () => Promise.resolve(device.settings["reduceTransparency"]),
    isDarkerSystemColorsEnabled: () => Promise.resolve(device.settings["darkerColors"]),
    addEventListener: (event: string, handler: () => void) => {
      device.handlers.set(event, handler);
      return { remove: () => device.handlers.delete(event) };
    },
  },
}));

vi.mock("expo-glass-effect", () => ({
  isLiquidGlassAvailable: () => device.liquid,
  isGlassEffectAPIAvailable: () => device.api,
}));

/** A fresh copy of the hook, so no test starts from another's settings. */
const freshHook = async () => (await import("#native/glass/use-glass-material")).useGlassMaterial;

/** Lets the settings queries resolve and the listeners run. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("useGlassMaterial", () => {
  beforeEach(() => {
    vi.resetModules();
    device.settings = { reduceTransparency: false, darkerColors: false };
    device.handlers.clear();
    device.liquid = true;
    device.api = true;
  });

  it("is solid until the settings answer, then Liquid Glass", async () => {
    const useGlassMaterial = await freshHook();
    const { result } = renderHook(() => useGlassMaterial());
    expect(result.current).toBe("solid");
    await settle();
    expect(result.current).toBe("liquid");
  });

  it.each([
    [false, true],
    [true, false],
    [false, false],
  ])("is solid when Liquid Glass is %s and its API %s", async (liquid, api) => {
    device.liquid = liquid;
    device.api = api;
    const useGlassMaterial = await freshHook();
    const { result } = renderHook(() => useGlassMaterial());
    await settle();
    expect(result.current).toBe("solid");
  });

  it.each<Setting>(["reduceTransparency", "darkerColors"])(
    "stays solid while %s is on",
    async (setting) => {
      device.settings[setting] = true;
      const useGlassMaterial = await freshHook();
      const { result } = renderHook(() => useGlassMaterial());
      await settle();
      expect(result.current).toBe("solid");
    },
  );

  it("switches every mounted control together when a setting changes, and back", async () => {
    const useGlassMaterial = await freshHook();
    const first = renderHook(() => useGlassMaterial());
    const second = renderHook(() => useGlassMaterial());
    await settle();
    device.settings["reduceTransparency"] = true;
    device.handlers.get("reduceTransparencyChanged")?.();
    await settle();
    expect([first.result.current, second.result.current]).toEqual(["solid", "solid"]);
    device.settings["reduceTransparency"] = false;
    device.handlers.get("reduceTransparencyChanged")?.();
    await settle();
    expect([first.result.current, second.result.current]).toEqual(["liquid", "liquid"]);
  });

  it("listens once for every control and stops when the last one unmounts", async () => {
    const useGlassMaterial = await freshHook();
    const first = renderHook(() => useGlassMaterial());
    const second = renderHook(() => useGlassMaterial());
    await settle();
    expect([...device.handlers.keys()]).toEqual([
      "reduceTransparencyChanged",
      "darkerSystemColorsChanged",
    ]);
    first.unmount();
    expect(device.handlers.size).toBe(2);
    second.unmount();
    expect(device.handlers.size).toBe(0);
  });

  it("starts a later control in the last known state", async () => {
    device.settings["darkerColors"] = true;
    const useGlassMaterial = await freshHook();
    renderHook(() => useGlassMaterial()).unmount();
    await settle();
    device.settings["darkerColors"] = false;
    const { result } = renderHook(() => useGlassMaterial());
    // The last answer was solid, so the first frame is solid until the new answer lands.
    expect(result.current).toBe("solid");
    await settle();
    expect(result.current).toBe("liquid");
  });
});
