/**
 * Stackra file contract:
 * Purpose: proves the native Reveal gives Reanimated the theme's reveal step (400ms, its cubic-bezier) with an 8pt rise
 *          from below, waits one stagger step (40ms) per `index`, follows the system's reduce-motion setting, takes no
 *          entrance with `isAnimated` off, renders its children and passes other props through.
 * Boundary: React Native and Reanimated do not run in vitest, so Reanimated is replaced by a recording stand-in: the
 *          builder calls and the view's props are checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-430:FR-003 sta-430:FR-004 sta-430:P-001 sta-430:P-003
import { render, screen } from "@testing-library/react";

import { Reveal } from "#native/reveal/reveal";

const state = vi.hoisted(() => ({
  calls: [] as unknown[][],
  props: {} as Record<string, unknown>,
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  // A builder that records each call and returns itself, as Reanimated's layout animation builders chain.
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  for (const name of ["duration", "delay", "withInitialValues", "reduceMotion", "easing"])
    builder[name] = (...args: unknown[]) => {
      state.calls.push([name, ...args]);
      return builder;
    };
  return {
    default: {
      View: ({ entering, children, ...rest }: Record<string, unknown>) => {
        state.props = { entering };
        return createElement("div", rest, children as never);
      },
    },
    FadeInDown: builder,
    Easing: { bezier: (...points: number[]) => ["bezier", ...points] },
    ReduceMotion: { System: "system" },
  };
});

describe("Reveal (native)", () => {
  beforeEach(() => {
    state.calls = [];
    state.props = {};
  });

  it("enters with the theme's reveal step, an 8pt rise and the system's reduce-motion setting", () => {
    render(<Reveal testID="r">Hello</Reveal>);
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(state.props["entering"]).toBeDefined();
    expect(state.calls).toEqual([
      ["duration", 400],
      ["delay", 0],
      ["withInitialValues", { opacity: 0, transform: [{ translateY: 8 }] }],
      ["reduceMotion", "system"],
      ["easing", ["bezier", 0.22, 1, 0.36, 1]],
    ]);
  });

  it("waits one stagger step per place in the row", () => {
    render(<Reveal index={2}>Second</Reveal>);
    expect(state.calls).toContainEqual(["delay", 80]);
  });

  it("takes no entrance with isAnimated off", () => {
    render(<Reveal isAnimated={false}>Off</Reveal>);
    expect(state.props["entering"]).toBeUndefined();
    expect(state.calls).toEqual([]);
  });
});
