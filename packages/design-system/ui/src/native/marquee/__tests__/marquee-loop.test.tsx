/**
 * Stackra file contract:
 * Purpose: proves the native Marquee's loop: it waits for the first copy's measured width, then moves `speed`
 *          points a second, wraps seamlessly at one copy's width, and moves leftward in English and rightward in
 *          Arabic; the strip carries its label and the caller's class.
 * Boundary: React Native, Reanimated, the direction hook and the IconButton are recording stand-ins; the frame
 *           callback and the animated style are captured and run by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.2.2; ADR 0022 (test placement);
 *          STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { Marquee } from "#native/marquee/marquee";

type Frame = (info: { timeSincePreviousFrame: number | null }) => void;

const state = vi.hoisted(() => ({
  direction: "ltr",
  views: [] as Record<string, unknown>[],
  frame: undefined as ((info: { timeSincePreviousFrame: number | null }) => void) | undefined,
  style: undefined as (() => { transform: { translateX: number }[] }) | undefined,
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
      View: ({ children }: Record<string, unknown>) =>
        createElement("div", null, children as never),
    },
    useReducedMotion: () => false,
    useSharedValue: (initial: number) => {
      const ref = useRef({ value: initial });
      return {
        get: () => ref.current.value,
        set: (next: number) => {
          ref.current.value = next;
        },
      };
    },
    useAnimatedStyle: (style: () => { transform: { translateX: number }[] }) => {
      state.style = style;
      return {};
    },
    useFrameCallback: (frame: Frame) => {
      state.frame = frame;
      return { setActive: () => undefined };
    },
  };
});
vi.mock("#native/bidi/use-direction", () => ({ useDirection: () => state.direction }));
vi.mock("@stackra/icons/native/lucide-icons", () => ({ Pause: () => null, Play: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({ IconButton: () => null }));

/** Measures the first copy at `width` points. */
const measure = (width: number): void => {
  const copy = state.views.find((view) => typeof view["onLayout"] === "function") ?? {};
  (copy["onLayout"] as (event: unknown) => void)({ nativeEvent: { layout: { width } } });
};

/** The strip's current horizontal shift. */
const shift = (): number | undefined => state.style?.().transform[0]?.translateX;

describe("Marquee loop (native)", () => {
  beforeEach(() => {
    state.direction = "ltr";
    state.views = [];
  });

  it("labels the strip and keeps the caller's class", () => {
    render(
      <Marquee label="Brands we carry" className="my-4">
        <span>Dukkan</span>
      </Marquee>,
    );
    expect(state.views[0]).toMatchObject({ accessibilityLabel: "Brands we carry" });
    expect(String(state.views[0]?.["className"])).toContain("my-4");
  });

  it("waits for a width, then moves leftward at its speed and wraps", () => {
    render(
      <Marquee label="Brands" speed={40}>
        <span>Dukkan</span>
      </Marquee>,
    );
    state.frame?.({ timeSincePreviousFrame: 500 });
    expect(shift()).toBe(-0);
    measure(100);
    state.frame?.({ timeSincePreviousFrame: 500 });
    expect(shift()).toBe(-20);
    state.frame?.({ timeSincePreviousFrame: null });
    expect(shift()).toBe(-20);
    state.frame?.({ timeSincePreviousFrame: 2500 });
    expect(shift()).toBe(-20);
  });

  it("moves rightward in Arabic", () => {
    state.direction = "rtl";
    render(
      <Marquee label="Brands">
        <span>دكان</span>
      </Marquee>,
    );
    measure(200);
    state.frame?.({ timeSincePreviousFrame: 1000 });
    expect(shift()).toBe(40);
  });
});
