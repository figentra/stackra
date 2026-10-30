/**
 * Stackra file contract:
 * Purpose: proves the native PressFeedback: a button named by `label` on HeroUI Native's PressableFeedback that
 *          scales by default, draws the highlight or ripple layer when asked, plays a light haptic before `onPress`,
 *          and when disabled says so and turns every animation off.
 * Boundary: heroui-native does not render in vitest, so it is a recording stand-in that renders plain DOM; the haptic
 *           engine is a recorder.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PressFeedback } from "#native/press-feedback/press-feedback";

const state = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  layers: [] as string[],
  played: [] as string[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    PressableFeedback: Object.assign(
      (props: Record<string, unknown>) => {
        state.props = props;
        return createElement(
          "button",
          { type: "button", onClick: props["onPress"] as () => void },
          props["children"] as ReactNode,
        );
      },
      {
        Highlight: () => {
          state.layers.push("highlight");
          return null;
        },
        Ripple: () => {
          state.layers.push("ripple");
          return null;
        },
      },
    ),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

beforeEach(() => {
  state.props = {};
  state.layers.length = 0;
  state.played.length = 0;
});

describe("PressFeedback (native)", () => {
  it("is a named button that scales and plays a light haptic before onPress", () => {
    const onPress = vi.fn(() => state.played.push("press"));
    render(
      <PressFeedback label="Open" onPress={onPress} testID="card">
        <span>Card</span>
      </PressFeedback>,
    );
    expect(state.props).toMatchObject({
      accessibilityRole: "button",
      accessibilityLabel: "Open",
      accessibilityState: { disabled: false },
      isDisabled: false,
      animation: true,
      testID: "card",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(state.played).toEqual(["light", "press"]);
    expect(state.layers).toEqual([]);
  });

  it("draws the highlight or ripple layer instead of scaling", () => {
    render(<PressFeedback feedback="highlight">x</PressFeedback>);
    expect(state.props["animation"]).toBe(false);
    expect(state.props).not.toHaveProperty("onPress");
    expect(state.props).not.toHaveProperty("accessibilityLabel");
    render(<PressFeedback feedback="ripple">x</PressFeedback>);
    expect(state.layers).toEqual(["highlight", "ripple"]);
  });

  it("turns every animation off and says so when disabled", () => {
    render(<PressFeedback isDisabled>x</PressFeedback>);
    expect(state.props).toMatchObject({
      isDisabled: true,
      animation: "disable-all",
      accessibilityState: { disabled: true },
    });
  });
});
