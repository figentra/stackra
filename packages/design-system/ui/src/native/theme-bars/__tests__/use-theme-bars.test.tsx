/**
 * Stackra file contract:
 * Purpose: proves `useThemeBars` and `ThemeStatusBar` follow the theme's background lightness, not the scheme's name
 *          (a light-yellow and a dark-pink background), tint the glass at `BAR_SHARE`, go solid under Reduce
 *          Transparency, and let a screen's `over` colour win while it is active.
 * Boundary: React Native and HeroUI Native do not run in vitest, so the theme colours, AccessibilityInfo and StatusBar
 *           are stand-ins each test sets.
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (the bars follow the theme); ADR 0022.
 */
// @vitest-environment jsdom
import { act, render, renderHook } from "@testing-library/react";

const device = vi.hoisted(() => ({
  colours: ["#F9F7EE", "#1F111B"] as [string, string],
  reduceTransparency: false,
  handler: undefined as ((on: boolean) => void) | undefined,
  barStyles: [] as string[],
}));

vi.mock("heroui-native", () => ({ useThemeColor: () => device.colours }));

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceTransparencyEnabled: () => Promise.resolve(device.reduceTransparency),
    addEventListener: (_: string, handler: (on: boolean) => void) => {
      device.handler = handler;
      return { remove: () => (device.handler = undefined) };
    },
  },
  StatusBar: ({ barStyle }: { barStyle: string }) => {
    device.barStyles.push(barStyle);
    return null;
  },
}));

const { useThemeBars } = await import("#native/theme-bars/use-theme-bars");
const { ThemeStatusBar } = await import("#native/theme-bars/theme-status-bar");

const settle = () =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });

describe("useThemeBars", () => {
  beforeEach(() => {
    device.reduceTransparency = false;
    device.barStyles = [];
  });

  it.each([
    ["#FFF6B0", "dark"],
    ["#5A1035", "light"],
    ["#0B0D0F", "light"],
  ] as const)("reads a %s background with %s content", async (background, content) => {
    device.colours = [background, "#000000"];
    const { result } = renderHook(() => useThemeBars());
    await settle();
    expect(result.current.content).toBe(content);
    expect(result.current.tint).toBe(`${background}E0`);
  });

  it("goes solid under Reduce Transparency", async () => {
    device.colours = ["#F9F7EE", "#1F111B"];
    device.reduceTransparency = true;
    const { result } = renderHook(() => useThemeBars());
    await settle();
    expect(result.current).toMatchObject({ isSolid: true, tint: "#F9F7EEFF" });
    act(() => device.handler?.(false));
    expect(result.current).toMatchObject({ isSolid: false, tint: "#F9F7EEE0" });
  });
});

describe("ThemeStatusBar", () => {
  it("draws the theme's tone, a screen's over colour's tone, and nothing while inactive", async () => {
    device.colours = ["#F9F7EE", "#1F111B"];
    device.barStyles = [];
    render(
      <>
        <ThemeStatusBar />
        <ThemeStatusBar over="#101418" />
        <ThemeStatusBar over="#101418" isActive={false} />
      </>,
    );
    await settle();
    expect(device.barStyles.slice(0, 2)).toEqual(["dark-content", "light-content"]);
  });
});
