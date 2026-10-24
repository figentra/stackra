/**
 * Stackra file contract:
 * Purpose: proves the native ProgressBar is one accessible progressbar (named, with its range, value and text, and
 *          busy only while indeterminate), draws a track and a fill in the theme's colours at the three sizes, fills to
 *          its value and eases there, sweeps a segment while indeterminate from the inline start in either direction,
 *          stands still under reduced motion, shows its label and value text only when asked, and passes the view's own
 *          props through.
 * Boundary: React Native, react-native-reanimated and heroui-native do not run in vitest, so they are replaced by
 *          recording stand-ins that render plain DOM (a shared value is a recorded box, a worklet runs once per render);
 *          what the bar hands them is checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.3.3 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-119
import { act, render } from "@testing-library/react";

import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { ProgressBar, type ProgressBarProps } from "#native/progress-bar/progress-bar";

/** What the stand-ins were last handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  reduced: false,
  direction: "ltr",
  views: [] as Record<string, unknown>[],
  fills: [] as Record<string, unknown>[],
  shared: [] as { value: unknown; sets: unknown[] }[],
  cancelled: 0,
}));

vi.mock("heroui-native", () => ({
  useThemeColor: (names: string | string[]) =>
    Array.isArray(names) ? names.map((name) => `color:${name}`) : `color:${names}`,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.fills.push(props);
        return createElement("div", null);
      },
    },
    useSharedValue: (initial: unknown) => {
      const ref = useRef<{ get: () => unknown; set: (next: unknown) => void } | null>(null);
      if (!ref.current) {
        const box = { value: initial, sets: [] as unknown[] };
        state.shared.push(box);
        ref.current = {
          get: () => box.value,
          set: (next) => {
            // An animation has not run yet, so the value a worklet reads stays where it was until a number is set.
            if (typeof next === "number") box.value = next;
            box.sets.push(next);
          },
        };
      }
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number, config: unknown) => ({ timing: to, config }),
    withRepeat: (animation: unknown, count: number, reverse: boolean) => ({
      repeat: animation,
      count,
      reverse,
    }),
    cancelAnimation: () => {
      state.cancelled += 1;
    },
    // The bar only ever interpolates from 0 to 1, so a straight line between the two outputs is enough.
    interpolate: (x: number, _input: number[], [low = 0, high = 0]: number[] = []) =>
      low + x * (high - low),
    Easing: { bezier: () => "bezier" },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: state.direction }),
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as never),
  };
});

/** The last props handed to the view that matches. */
const lastView = (matches: (props: Record<string, unknown>) => boolean) =>
  state.views.filter(matches).at(-1) ?? {};
const rootProps = () => lastView((props) => props["accessibilityRole"] === "progressbar");
const trackProps = () => lastView((props) => typeof props["onLayout"] === "function");
const styleOf = (props: Record<string, unknown>) => props["style"] as Record<string, unknown>;
const fillStyle = () => {
  const [base, animated] = (state.fills.at(-1)?.["style"] ?? []) as Record<string, unknown>[];
  return { ...base, ...animated };
};
const textsOf = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="text"]')].map((node) => node.textContent);

describe("ProgressBar (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.direction = "ltr";
    state.views = [];
    state.fills = [];
    state.shared = [];
    state.cancelled = 0;
  });

  it("is one named, busy, indeterminate progressbar with only a label", () => {
    render(<ProgressBar label="Uploading" />);
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Uploading",
      accessibilityState: { busy: true },
    });
    expect(rootProps()).not.toHaveProperty("accessibilityValue");
  });

  it("is determinate with a value: the range, the value and its text, and not busy", () => {
    render(<ProgressBar label="Uploading" value={40} />);
    expect(rootProps()).toMatchObject({
      accessibilityState: { busy: false },
      accessibilityValue: { min: 0, max: 100, now: 40, text: "40%" },
    });
    expect(fillStyle()).toMatchObject({ width: "40%" });
  });

  it("holds a value to its range and speaks the caller's text", () => {
    render(<ProgressBar label="Uploading" value={99} maxValue={12} valueLabel="12 of 12" />);
    expect(rootProps()).toMatchObject({
      accessibilityValue: { min: 0, max: 12, now: 12, text: "12 of 12" },
    });
    expect(fillStyle()).toMatchObject({ width: "100%" });
  });

  it.each(Size)("draws a track of size %s in the theme's track colour", (size) => {
    render(<ProgressBar label="Uploading" size={size} value={10} />);
    const expected = { sm: [4, 2], md: [8, 4], lg: [12, 6] }[size];
    expect(styleOf(trackProps())).toMatchObject({
      height: expected[0],
      borderRadius: expected[1],
      backgroundColor: "color:default",
      overflow: "hidden",
    });
  });

  it("is a medium accent bar by default", () => {
    render(<ProgressBar label="Uploading" value={10} />);
    expect(styleOf(trackProps())).toMatchObject({ height: 8 });
    expect(fillStyle()).toMatchObject({ backgroundColor: "color:accent" });
  });

  it.each(Tone)("fills tone %s in its role", (tone) => {
    render(<ProgressBar label="Uploading" tone={tone} value={10} />);
    expect(fillStyle()).toMatchObject({ backgroundColor: `color:${PROGRESS_FILL_ROLE[tone]}` });
  });

  it("eases to a new value", () => {
    const { rerender } = render(<ProgressBar label="Uploading" value={10} />);
    rerender(<ProgressBar label="Uploading" value={60} />);
    expect(state.shared[0]?.sets.at(-1)).toMatchObject({ timing: 60, config: { duration: 300 } });
  });

  it("jumps to a new value under reduced motion", () => {
    state.reduced = true;
    const { rerender } = render(<ProgressBar label="Uploading" value={10} />);
    rerender(<ProgressBar label="Uploading" value={60} />);
    expect(state.shared[0]?.sets.at(-1)).toBe(60);
  });

  it("sweeps a 40 per cent segment from the inline start while indeterminate", () => {
    render(<ProgressBar label="Uploading" />);
    expect(state.shared[1]?.sets.at(-1)).toMatchObject({ repeat: { timing: 1 }, count: -1 });
    act(() => {
      (trackProps()["onLayout"] as (event: unknown) => void)({
        nativeEvent: { layout: { width: 200 } },
      });
    });
    expect(fillStyle()).toMatchObject({
      width: 80,
      transform: [{ translateX: -80 }],
    });
  });

  it("sweeps the other way in a right-to-left layout", () => {
    state.direction = "rtl";
    render(<ProgressBar label="Uploading" />);
    act(() => {
      (trackProps()["onLayout"] as (event: unknown) => void)({
        nativeEvent: { layout: { width: 200 } },
      });
    });
    expect(fillStyle()).toMatchObject({ transform: [{ translateX: 80 }] });
  });

  it("rests as a still segment at the start under reduced motion", () => {
    state.reduced = true;
    render(<ProgressBar label="Uploading" />);
    expect(state.shared[1]?.sets).toEqual([]);
    act(() => {
      (trackProps()["onLayout"] as (event: unknown) => void)({
        nativeEvent: { layout: { width: 200 } },
      });
    });
    expect(fillStyle()).toMatchObject({ width: 80, transform: [{ translateX: 0 }] });
  });

  it("stops the sweep when it unmounts or gets a value", () => {
    const { rerender, unmount } = render(<ProgressBar label="Uploading" />);
    rerender(<ProgressBar label="Uploading" value={50} />);
    expect(state.cancelled).toBe(1);
    unmount();
  });

  it("draws no text unless asked", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    expect(textsOf(container)).toEqual([]);
  });

  it("draws the label and the value text when asked", () => {
    const { container } = render(
      <ProgressBar label="Storage used" value={40} isLabelVisible isValueVisible />,
    );
    expect(textsOf(container)).toEqual(["Storage used", "40%"]);
  });

  it("draws the caller's value text, and none while indeterminate", () => {
    const { container, rerender } = render(
      <ProgressBar label="Uploading" value={3} valueLabel="3 of 12" isValueVisible />,
    );
    expect(textsOf(container)).toEqual(["3 of 12"]);
    rerender(<ProgressBar label="Uploading" isValueVisible />);
    expect(textsOf(container)).toEqual([]);
  });

  it("passes the view's own props through to the root", () => {
    render(<ProgressBar label="Uploading" testID="bar" style={{ opacity: 0.5 }} />);
    expect(rootProps()).toMatchObject({ testID: "bar", style: { opacity: 0.5 } });
  });

  it("types: extends the contract, needs a label and refuses `color`-like and accessibility props", () => {
    expectTypeOf<ProgressBarProps>().toExtend<ProgressBarContractProps>();
    // @ts-expect-error a progress bar must be named
    render(<ProgressBar />);
    // @ts-expect-error the name is `label`
    render(<ProgressBar label="x" accessibilityLabel="x" />);
    // @ts-expect-error the value is `value`, and the component sets the accessibility value
    render(<ProgressBar label="x" accessibilityValue={{ now: 1 }} />);
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressBar label="x">child</ProgressBar>);
  });
});
