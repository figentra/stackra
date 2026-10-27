/**
 * Stackra file contract:
 * Purpose: proves the native ProgressCircle is one accessible progressbar (named, with its range, value and text, and
 *          busy only while indeterminate), draws a track circle and a fill arc in the theme's colours at the three sizes
 *          in HeroUI's geometry, fills the arc to its value and eases there, spins a quarter arc while indeterminate,
 *          stands still under reduced motion, draws no text, and passes the view's own props through.
 * Boundary: React Native, react-native-svg, react-native-reanimated and heroui-native do not run in vitest, so they are
 *          replaced by recording stand-ins that render plain DOM (a shared value is a recorded box, a worklet runs once
 *          per render); what the ring hands them is checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.3.3 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-119
import { Enum, Tone } from "@stackra/contracts";
import { render } from "@testing-library/react";

import { Size } from "#contracts/enums/size.enum";
import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { ProgressCircle } from "#native/progress-circle/progress-circle";
import type { ProgressCircleProps } from "#native/progress-circle/progress-circle.props";

/** The circumference of the ring: radius 16 in a 36-unit box. */
const CIRCUMFERENCE = 2 * Math.PI * 16;

/** What the stand-ins were last handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  reduced: false,
  views: [] as Record<string, unknown>[],
  spinners: [] as Record<string, unknown>[],
  svgs: [] as Record<string, unknown>[],
  circles: [] as Record<string, unknown>[],
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

vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      state.svgs.push(props);
      return createElement("div", null, props["children"] as never);
    },
    Circle: (props: Record<string, unknown>) => {
      state.circles.push(props);
      return createElement("i", null);
    },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.spinners.push(props);
        return createElement("div", null, props["children"] as never);
      },
    },
    createAnimatedComponent: (component: unknown) => component,
    useSharedValue: (initial: unknown) => {
      const ref = useRef<{ get: () => unknown; set: (next: unknown) => void } | null>(null);
      if (!ref.current) {
        const box = { value: initial, sets: [] as unknown[] };
        state.shared.push(box);
        ref.current = {
          get: () => box.value,
          set: (next) => {
            box.value = next;
            box.sets.push(next);
          },
        };
      }
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useAnimatedProps: (worklet: () => unknown) => worklet(),
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
    Easing: { linear: "linear" },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

const rootProps = () =>
  state.views.filter((props) => props["accessibilityRole"] === "progressbar").at(-1) ?? {};
const styleOf = (props: Record<string, unknown> = {}) =>
  props["style"] as Record<string, unknown>[] | Record<string, unknown>;
/** The track circle has a colour and no animated props; the fill arc has both. */
const trackCircle = () => state.circles.filter((props) => !("animatedProps" in props)).at(-1);
const fillCircle = () => state.circles.filter((props) => "animatedProps" in props).at(-1);
const dashOffset = () =>
  ((fillCircle() ?? {})["animatedProps"] as { strokeDashoffset: number }).strokeDashoffset;

describe("ProgressCircle (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.views = [];
    state.spinners = [];
    state.svgs = [];
    state.circles = [];
    state.shared = [];
    state.cancelled = 0;
  });

  it("is one named, busy, indeterminate progressbar with only a label", () => {
    render(<ProgressCircle label="Syncing" />);
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Syncing",
      accessibilityState: { busy: true },
    });
    expect(rootProps()).not.toHaveProperty("accessibilityValue");
  });

  it("is determinate with a value: the range, the value and its text, and not busy", () => {
    render(<ProgressCircle label="Syncing" value={25} />);
    expect(rootProps()).toMatchObject({
      accessibilityState: { busy: false },
      accessibilityValue: { min: 0, max: 100, now: 25, text: "25%" },
    });
  });

  it("holds a value to its range and speaks the caller's text", () => {
    render(<ProgressCircle label="Syncing" value={99} maxValue={12} valueLabel="12 of 12" />);
    expect(rootProps()).toMatchObject({
      accessibilityValue: { min: 0, max: 12, now: 12, text: "12 of 12" },
    });
    expect(dashOffset()).toBeCloseTo(0, 6);
  });

  it.each(Size)("draws size %s in HeroUI's 36-unit geometry", (size) => {
    render(<ProgressCircle label="Syncing" size={size} value={50} />);
    const diameter = { sm: 20, md: 28, lg: 36 }[size];
    expect(state.svgs.at(-1)).toMatchObject({
      width: diameter,
      height: diameter,
      viewBox: "0 0 36 36",
    });
    expect(trackCircle()).toMatchObject({ cx: 18, cy: 18, r: 16, strokeWidth: 4 });
    expect(styleOf(rootProps())).toEqual([{ width: diameter, height: diameter }, undefined]);
  });

  it("is a medium accent ring on the theme's track colour by default", () => {
    render(<ProgressCircle label="Syncing" value={50} />);
    expect(trackCircle()).toMatchObject({ stroke: "color:default" });
    expect(fillCircle()).toMatchObject({ stroke: "color:accent", strokeLinecap: "round" });
  });

  it.each(Enum.values(Tone))("fills tone %s in its role", (tone) => {
    render(<ProgressCircle label="Syncing" tone={tone} value={50} />);
    expect(fillCircle()).toMatchObject({ stroke: `color:${PROGRESS_FILL_ROLE[tone]}` });
  });

  it("leaves a share of the ring unfilled that matches the value", () => {
    render(<ProgressCircle label="Syncing" value={25} />);
    expect(fillCircle()).toMatchObject({ strokeDasharray: CIRCUMFERENCE });
    expect(dashOffset()).toBeCloseTo(CIRCUMFERENCE * 0.75, 6);
  });

  it("eases to a new value, or jumps under reduced motion", () => {
    const { rerender } = render(<ProgressCircle label="Syncing" value={10} />);
    rerender(<ProgressCircle label="Syncing" value={60} />);
    expect(state.shared[0]?.sets.at(-1)).toMatchObject({ timing: 60, config: { duration: 300 } });
    state.reduced = true;
    rerender(<ProgressCircle label="Syncing" value={80} />);
    expect(state.shared[0]?.sets.at(-1)).toBe(80);
  });

  it("spins a quarter arc once a second while indeterminate", () => {
    render(<ProgressCircle label="Syncing" />);
    expect(dashOffset()).toBeCloseTo(CIRCUMFERENCE * 0.75, 6);
    expect(state.shared[1]?.sets.at(-1)).toMatchObject({
      repeat: { timing: 1, config: { duration: 1000, easing: "linear" } },
      count: -1,
    });
    expect(styleOf(state.spinners.at(-1))).toEqual([
      { width: 28, height: 28 },
      { transform: [{ rotate: "0deg" }] },
    ]);
  });

  it("rests as a still arc under reduced motion", () => {
    state.reduced = true;
    render(<ProgressCircle label="Syncing" />);
    expect(state.shared[1]?.sets).toEqual([]);
    expect(styleOf(state.spinners.at(-1))).toEqual([
      { width: 28, height: 28 },
      { transform: [{ rotate: "0deg" }] },
    ]);
  });

  it("stops the spin when it gets a value", () => {
    const { rerender } = render(<ProgressCircle label="Syncing" />);
    rerender(<ProgressCircle label="Syncing" value={50} />);
    expect(state.cancelled).toBe(1);
  });

  it("draws no text", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={50} />);
    expect(container.textContent).toBe("");
  });

  it("passes the view's own props through to the root", () => {
    render(<ProgressCircle label="Syncing" testID="ring" style={{ opacity: 0.5 }} />);
    expect(rootProps()).toMatchObject({ testID: "ring" });
    expect(styleOf(rootProps())).toEqual([{ width: 28, height: 28 }, { opacity: 0.5 }]);
  });

  it("types: extends the contract, needs a label and refuses the accessibility props", () => {
    expectTypeOf<ProgressCircleProps>().toExtend<ProgressCircleContractProps>();
    // @ts-expect-error a progress circle must be named
    render(<ProgressCircle />);
    // @ts-expect-error the name is `label`
    render(<ProgressCircle label="x" accessibilityLabel="x" />);
    // @ts-expect-error the value is `value`, and the component sets the accessibility value
    render(<ProgressCircle label="x" accessibilityValue={{ now: 1 }} />);
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressCircle label="x">child</ProgressCircle>);
  });
});
