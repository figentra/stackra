/**
 * Stackra file contract:
 * Purpose: proves the native DesignSystemProvider hands the colour scheme to Uniwind and to React Native's
 *          Appearance (restored on unmount), lays the subtree out in the direction through a Yoga `direction` View,
 *          Uniwind's LayoutDirection and HeroUI Native's `isRTL`, reads the resolved scheme back from Uniwind, and
 *          gives Lucide icons the md size and the theme's foreground colour.
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

vi.mock("heroui-native", () => ({
  HeroUINativeProvider: ({
    config,
    children,
  }: {
    config?: { isRTL?: boolean };
    children?: ReactNode;
  }) => (
    <div data-testid="heroui" data-rtl={String(config?.isRTL)}>
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

  it("refuses useDesignSystem outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow("needs a DesignSystemProvider");
  });
});
