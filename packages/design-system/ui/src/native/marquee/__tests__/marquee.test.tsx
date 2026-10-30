/**
 * Stackra file contract:
 * Purpose: proves the native Marquee runs its frame loop with a hidden second copy, stops and resumes with the pause
 *          button, and under Reduce Motion shows one still copy, never running the loop.
 * Boundary: React Native, Reanimated, the direction hook and the IconButton are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 2.2.2; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { Marquee } from "#native/marquee/marquee";

const state = vi.hoisted(() => ({
  isReduced: false,
  active: [] as boolean[],
  hidden: 0,
  buttons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: ({ children, importantForAccessibility }: Record<string, unknown>) => {
      if (importantForAccessibility === "no-hide-descendants") state.hidden += 1;
      return createElement("div", null, children as never);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: ({ children }: Record<string, unknown>) =>
        createElement("div", null, children as never),
    },
    useReducedMotion: () => state.isReduced,
    useSharedValue: (value: number) => ({ get: () => value, set: () => undefined }),
    useAnimatedStyle: () => ({}),
    useFrameCallback: () => ({ setActive: (isActive: boolean) => state.active.push(isActive) }),
  };
});
vi.mock("#native/bidi/use-direction", () => ({ useDirection: () => "ltr" }));
vi.mock("@stackra/icons/native/lucide-icons", () => ({ Pause: () => null, Play: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

describe("Marquee (native)", () => {
  beforeEach(() => {
    state.isReduced = false;
    state.active = [];
    state.hidden = 0;
    state.buttons = [];
  });

  it("loops two copies and pauses", () => {
    render(
      <Marquee label="Brands we carry">
        <span>Dukkan</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Dukkan")).toHaveLength(2);
    expect(state.hidden).toBe(1);
    expect(state.active.at(-1)).toBe(true);
    expect(state.buttons.at(-1)?.["label"]).toBe("Pause scrolling");
    act(() => (state.buttons.at(-1)?.["onPress"] as () => void)?.());
    expect(state.active.at(-1)).toBe(false);
    expect(state.buttons.at(-1)?.["label"]).toBe("Resume scrolling");
  });

  it("stands still under Reduce Motion", () => {
    state.isReduced = true;
    render(
      <Marquee label="Brands we carry">
        <span>Dukkan</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Dukkan")).toHaveLength(1);
    expect(state.buttons).toHaveLength(0);
    expect(state.active.every((isActive) => !isActive)).toBe(true);
  });
});
