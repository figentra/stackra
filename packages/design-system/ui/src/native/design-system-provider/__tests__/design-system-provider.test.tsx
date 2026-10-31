/**
 * Stackra file contract:
 * Purpose: proves the native DesignSystemProvider hands the colour scheme to Uniwind and to React Native's
 *          Appearance (restored on unmount), lays the subtree out in the direction through a Yoga `direction` View,
 *          Uniwind's LayoutDirection and HeroUI Native's `isRTL`, scales text with the device's text size under an
 *          optional cap, reads the resolved scheme back from Uniwind, gives Lucide icons the md size and the theme's
 *          foreground colour, draws the scheme transition on a change after mount, and turns the haptics switch with
 *          its prop.
 * Boundary: React Native does not render in vitest, so react-native, heroui-native, uniwind and lucide-react-native
 *          are replaced by recording stand-ins and the tree renders to the jsdom DOM; what reaches the real libraries
 *          is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-009 sta-350:FR-015 sta-350:FR-095 sta-350:P-006 sta-350:P-014
import { act, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";

import { DesignSystemProvider } from "#native/design-system-provider/design-system-provider";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";

const uniwind = vi.hoisted(() => ({ theme: "light", setTheme: vi.fn() }));
const appearance = vi.hoisted(() => ({ setColorScheme: vi.fn() }));

vi.mock("react-native", () => ({
  Appearance: { setColorScheme: appearance.setColorScheme },
  View: ({
    style,
    children,
  }: {
    style?: { flex?: number; direction?: string };
    children?: ReactNode;
  }) => (
    <div
      data-testid="direction"
      data-flex={String(style?.flex)}
      data-direction={String(style?.direction)}
    >
      {children}
    </div>
  ),
}));

vi.mock("uniwind", () => ({
  Uniwind: { setTheme: uniwind.setTheme },
  useUniwind: () => ({ theme: uniwind.theme, hasAdaptiveThemes: false }),
  LayoutDirection: ({ rtl, children }: { rtl?: boolean; children?: ReactNode }) => (
    <div data-testid="layout" data-rtl={String(rtl)}>
      {children}
    </div>
  ),
}));

const reanimated = vi.hoisted(() => ({ isReduced: false }));

vi.mock("react-native-reanimated", () => ({
  useReducedMotion: () => reanimated.isReduced,
  ReduceMotion: { System: "system", Always: "always" },
  ReducedMotionConfig: ({ mode }: { mode: string }) => <i data-testid="reduce" data-mode={mode} />,
}));

vi.mock("heroui-native", () => ({
  HeroUINativeProvider: ({
    config,
    children,
  }: {
    config?: {
      isRTL?: boolean;
      animation?: string;
      textProps?: { allowFontScaling?: boolean; maxFontSizeMultiplier?: number };
      textInputProps?: { allowFontScaling?: boolean; maxFontSizeMultiplier?: number };
    };
    children?: ReactNode;
  }) => (
    <div
      data-testid="heroui"
      data-rtl={String(config?.isRTL)}
      data-animation={String(config?.animation)}
      data-text={JSON.stringify(config?.textProps)}
      data-text-input={JSON.stringify(config?.textInputProps)}
    >
      {children}
    </div>
  ),
  useThemeColor: () => "#0b0d0f",
}));

vi.mock("lucide-react-native", () => ({
  LucideProvider: ({
    size,
    color,
    children,
  }: {
    size?: number;
    color?: string;
    children?: ReactNode;
  }) => (
    <div data-testid="lucide" data-size={String(size)} data-color={String(color)}>
      {children}
    </div>
  ),
}));

function Probe() {
  const state = useDesignSystem();
  return (
    <>
      <output data-testid="state">
        {[state.colorScheme, state.resolvedColorScheme, state.locale, state.direction].join(" ")}
      </output>
      <button type="button" onClick={() => state.setColorScheme("dark")}>
        dark
      </button>
      <button type="button" onClick={() => state.setLocale("he")}>
        he
      </button>
    </>
  );
}

function Pickers() {
  const { brand, transition, motion, setBrand, setTransition, setMotion } = useDesignSystem();
  return (
    <>
      <output data-testid="picked">{`${String(brand)} ${transition} ${motion}`}</output>
      <button type="button" onClick={() => setBrand("ocean")}>
        brand
      </button>
      <button type="button" onClick={() => setTransition("fade")}>
        transition
      </button>
      <button type="button" onClick={() => setMotion("none")}>
        motion
      </button>
    </>
  );
}

function MotionProbe() {
  const { motion, resolvedMotion } = useDesignSystem();
  return <output data-testid="motion">{`${motion} ${resolvedMotion}`}</output>;
}

describe("DesignSystemProvider (native)", () => {
  beforeEach(() => {
    uniwind.theme = "light";
    uniwind.setTheme.mockClear();
    appearance.setColorScheme.mockClear();
  });

  it("hands the system scheme to Uniwind and lays out left to right by default", () => {
    render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(uniwind.setTheme).toHaveBeenLastCalledWith("system");
    expect(screen.getByTestId("layout").dataset["rtl"]).toBe("false");
    expect(screen.getByTestId("heroui").dataset["rtl"]).toBe("false");
    expect(screen.getByTestId("state").textContent).toBe("system light en ltr");
  });

  it("scales text with the device's text size, capped only when the app sets a cap", () => {
    const { rerender } = render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    const uncapped = JSON.stringify({ allowFontScaling: true, maxFontSizeMultiplier: 0 });
    expect(screen.getByTestId("heroui").dataset["text"]).toBe(uncapped);
    expect(screen.getByTestId("heroui").dataset["textInput"]).toBe(uncapped);
    rerender(
      <DesignSystemProvider maxFontScale={1.3}>
        <Probe />
      </DesignSystemProvider>,
    );
    const capped = JSON.stringify({ allowFontScaling: true, maxFontSizeMultiplier: 1.3 });
    expect(screen.getByTestId("heroui").dataset["text"]).toBe(capped);
    expect(screen.getByTestId("heroui").dataset["textInput"]).toBe(capped);
  });

  it("lays the subtree out in the locale's direction through a filling Yoga View", () => {
    const { rerender } = render(
      <DesignSystemProvider locale="en">
        <Probe />
      </DesignSystemProvider>,
    );
    const view = screen.getByTestId("direction");
    expect(view.dataset["direction"]).toBe("ltr");
    expect(view.dataset["flex"]).toBe("1");
    expect(view.contains(screen.getByTestId("layout"))).toBe(true);
    rerender(
      <DesignSystemProvider locale="ar">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("direction").dataset["direction"]).toBe("rtl");
    rerender(
      <DesignSystemProvider locale="ar" direction="ltr">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("direction").dataset["direction"]).toBe("ltr");
  });

  it("sets the native interface style to the scheme and gives it back to the device on unmount", () => {
    const { rerender, unmount } = render(
      <DesignSystemProvider colorScheme="dark">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(appearance.setColorScheme).toHaveBeenLastCalledWith("dark");
    rerender(
      <DesignSystemProvider colorScheme="light">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(appearance.setColorScheme).toHaveBeenLastCalledWith("light");
    rerender(
      <DesignSystemProvider colorScheme="system">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(appearance.setColorScheme).toHaveBeenLastCalledWith("unspecified");
    // A scheme change goes straight to the next scheme, never through the device's.
    expect(appearance.setColorScheme.mock.calls).toEqual([["dark"], ["light"], ["unspecified"]]);
    rerender(
      <DesignSystemProvider colorScheme="dark">
        <Probe />
      </DesignSystemProvider>,
    );
    appearance.setColorScheme.mockClear();
    unmount();
    expect(appearance.setColorScheme.mock.calls).toEqual([["unspecified"]]);
  });

  it("draws the scheme transition on a change after mount, never on the first paint", () => {
    const transition = { preset: 12, origin: { x: 1, y: 2 } };
    render(
      <DesignSystemProvider schemeTransition={() => transition}>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(uniwind.setTheme.mock.calls).toEqual([["system"]]);
    act(() => screen.getByRole("button", { name: "dark" }).click());
    expect(uniwind.setTheme).toHaveBeenLastCalledWith("dark", transition);
  });

  it("hands Uniwind the scheme before any child's effect runs, so the first paint is in it", () => {
    const seenByChild: unknown[][] = [];
    function Child() {
      useEffect(() => {
        seenByChild.push(...uniwind.setTheme.mock.calls);
      }, []);
      return null;
    }
    render(
      <DesignSystemProvider colorScheme="dark">
        <Child />
      </DesignSystemProvider>,
    );
    expect(seenByChild).toEqual([["dark"]]);
  });

  it("reads the resolved scheme from Uniwind and derives right to left from the locale", () => {
    uniwind.theme = "dark";
    render(
      <DesignSystemProvider colorScheme="dark" locale="ar">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(uniwind.setTheme).toHaveBeenLastCalledWith("dark");
    expect(screen.getByTestId("layout").dataset["rtl"]).toBe("true");
    expect(screen.getByTestId("heroui").dataset["rtl"]).toBe("true");
    expect(screen.getByTestId("state").textContent).toBe("dark dark ar rtl");
  });

  it("sets the scheme and locale through the hook", () => {
    render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    act(() => screen.getByRole("button", { name: "dark" }).click());
    act(() => screen.getByRole("button", { name: "he" }).click());
    expect(uniwind.setTheme).toHaveBeenLastCalledWith("dark");
    expect(screen.getByTestId("heroui").dataset["rtl"]).toBe("true");
  });

  it("gives Lucide icons the md size and the theme foreground", () => {
    render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    const lucide = screen.getByTestId("lucide");
    expect(lucide.dataset["size"]).toBe("20");
    expect(lucide.dataset["color"]).toBe("#0b0d0f");
    expect(lucide.contains(screen.getByTestId("state"))).toBe(true);
  });

  it("turns the app-wide haptics switch with its haptics prop and leaves it alone without one", async () => {
    const { haptics } = await import("#native/haptics/haptics");
    const { rerender } = render(
      <DesignSystemProvider haptics={false}>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(haptics.isEnabled()).toBe(false);
    rerender(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(haptics.isEnabled()).toBe(false);
    rerender(
      <DesignSystemProvider haptics>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(haptics.isEnabled()).toBe(true);
  });

  it("refuses useDesignSystem outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow("needs a DesignSystemProvider");
  });
  it("holds the motion level, lowers full under the system setting and turns animations off at none", () => {
    reanimated.isReduced = true;
    const { rerender } = render(
      <DesignSystemProvider>
        <MotionProbe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("motion").textContent).toBe("full reduced");
    expect(screen.getByTestId("reduce").dataset["mode"]).toBe("always");
    reanimated.isReduced = false;
    rerender(
      <DesignSystemProvider motion="none">
        <MotionProbe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("motion").textContent).toBe("none none");
    expect(screen.getByTestId("heroui").dataset["animation"]).toBe("disable-all");
  });

  it("holds the picked brand, transition and motion and reports each change", () => {
    const onBrandChange = vi.fn();
    const onTransitionChange = vi.fn();
    const onMotionChange = vi.fn();
    render(
      <DesignSystemProvider
        onBrandChange={onBrandChange}
        onTransitionChange={onTransitionChange}
        onMotionChange={onMotionChange}
      >
        <Pickers />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("picked").textContent).toBe("undefined circle-origin full");
    act(() => screen.getByRole("button", { name: "brand" }).click());
    act(() => screen.getByRole("button", { name: "transition" }).click());
    act(() => screen.getByRole("button", { name: "motion" }).click());
    expect(onBrandChange).toHaveBeenCalledWith("ocean");
    expect(onTransitionChange).toHaveBeenCalledWith("fade");
    expect(onMotionChange).toHaveBeenCalledWith("none");
    expect(screen.getByTestId("picked").textContent).toBe("ocean fade none");
  });
});
