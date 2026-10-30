/**
 * Stackra file contract:
 * Purpose: proves the native FlipCard: a button hinted by `flipLabel` that says expanded when turned, shows the front
 *          and hides the back from the reader, turns over on press (timed, or at once under reduced motion) and
 *          reports the new side, can be controlled, turns on the X axis when vertical, mirrors the turn right to left,
 *          and is a plain view that does not turn when disabled.
 * Boundary: React Native, heroui-native and Reanimated do not run in vitest, so they are recording stand-ins that
 *           render plain DOM; the animated styles run once against the shared value.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right to left); WCAG 2.2 SC 2.3.3 and 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { FlipCard } from "#native/flip-card/flip-card";
import type { FlipCardProps } from "#native/flip-card/flip-card.props";

const state = vi.hoisted(() => ({
  reduced: false,
  sets: [] as unknown[],
  faces: [] as Record<string, unknown>[],
  root: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (tag: string) => (props: Record<string, unknown>) => {
    state.root = { ...props, tag };
    return createElement(
      tag === "pressable" ? "button" : "div",
      { onClick: props["onPress"] as () => void },
      props["children"] as ReactNode,
    );
  };
  return { I18nManager: { isRTL: false }, View: box("view"), Pressable: box("pressable") };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.faces.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
  };
});
vi.mock("heroui-native", () => ({ cn: (...names: unknown[]) => names.filter(Boolean).join(" ") }));

const draw = (props: Partial<FlipCardProps> = {}, direction: "ltr" | "rtl" = "ltr") =>
  render(
    <DesignSystemContext value={{ direction } as DesignSystemState}>
      <FlipCard
        front={<span>Front</span>}
        back={<span>Back</span>}
        flipLabel="Turn over"
        {...props}
      />
    </DesignSystemContext>,
  );
const [front, back] = [() => state.faces.at(-2) ?? {}, () => state.faces.at(-1) ?? {}];
const styleOf = (face: Record<string, unknown>) => (face["style"] as unknown[])[1];

beforeEach(() => {
  state.reduced = false;
  state.sets.length = 0;
  state.faces.length = 0;
  state.root = {};
});

describe("FlipCard (native)", () => {
  it("is a button that shows the front and hides the back from the reader", () => {
    draw({ className: "card" });
    expect(state.root).toMatchObject({
      tag: "pressable",
      accessibilityRole: "button",
      accessibilityHint: "Turn over",
      accessibilityState: { expanded: false },
      className: "relative card",
    });
    expect(front()).not.toHaveProperty("accessibilityElementsHidden");
    expect(back()).toMatchObject({ accessibilityElementsHidden: true });
    expect(styleOf(front())).toEqual({
      opacity: 1,
      transform: [{ perspective: 1000 }, { rotateY: "0deg" }],
    });
    expect(styleOf(back())).toMatchObject({ opacity: 0 });
    expect(state.sets).toEqual([{ timing: 0 }]);
  });

  it("turns over on press and reports the new side", () => {
    const onFlipChange = vi.fn();
    draw({ onFlipChange });
    act(() => screen.getByRole("button").click());
    expect(onFlipChange).toHaveBeenCalledWith(true);
    expect(state.root["accessibilityState"]).toEqual({ expanded: true });
    expect(front()).toMatchObject({ accessibilityElementsHidden: true });
    expect(back()).not.toHaveProperty("accessibilityElementsHidden");
    expect(state.sets.at(-1)).toEqual({ timing: 180 });
  });

  it("starts turned, shows the back on the X axis when vertical and mirrors right to left", () => {
    state.reduced = true;
    draw({ defaultFlipped: true, axis: "vertical" }, "rtl");
    expect(styleOf(back())).toEqual({
      opacity: 1,
      transform: [{ perspective: 1000 }, { rotateX: "0deg" }],
    });
    expect(styleOf(front())).toEqual({
      opacity: 0,
      transform: [{ perspective: 1000 }, { rotateX: "-180deg" }],
    });
    expect(state.sets).toEqual([180]);
  });

  it("is controlled by isFlipped", () => {
    const onFlipChange = vi.fn();
    draw({ isFlipped: false, onFlipChange });
    act(() => screen.getByRole("button").click());
    expect(onFlipChange).toHaveBeenCalledWith(true);
    expect(state.root["accessibilityState"]).toEqual({ expanded: false });
  });

  it("is a plain view that does not turn while disabled", () => {
    draw({ isDisabled: true });
    expect(state.root["tag"]).toBe("view");
    expect(state.root).not.toHaveProperty("accessibilityRole");
  });
});
