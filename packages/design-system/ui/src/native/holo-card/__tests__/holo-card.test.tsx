/**
 * Stackra file contract:
 * Purpose: proves the native HoloCard: live, it tilts toward the touch within `maxTilt`, moves its glare to the finger
 *          (hidden from the reader) and springs back level on release or cancel; still, or under reduced motion, it is
 *          a plain card with no touch handlers, tilt or glare.
 * Boundary: React Native and Reanimated do not run in vitest, so they are recording stand-ins that render plain DOM;
 *           the shared values hold what is set and the animated styles run on each render.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { HoloCard } from "#native/holo-card/holo-card";
import type { HoloCardProps } from "#native/holo-card/holo-card.props";

const state = vi.hoisted(() => ({
  reduced: false,
  card: {} as Record<string, unknown>,
  glare: undefined as Record<string, unknown> | undefined,
  cover: undefined as Record<string, unknown> | undefined,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.cover = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        if (props["onLayout"]) state.card = props;
        else state.glare = props;
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    useSharedValue: (initial: number) => {
      const ref = useRef({
        value: initial,
        set(next: number | { spring: number }) {
          this.value = typeof next === "number" ? next : next.spring;
        },
      });
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withSpring: (to: number) => ({ spring: to }),
  };
});

const draw = (props: Partial<HoloCardProps> = {}) => {
  const result = render(
    <HoloCard maxTilt={10} className="card" {...props}>
      <span>Face</span>
    </HoloCard>,
  );
  act(() =>
    (state.card["onLayout"] as (event: unknown) => void)?.({
      nativeEvent: { layout: { width: 200, height: 100 } },
    }),
  );
  return result;
};
/** Fires a touch handler, then lays the card out again so the stand-in styles re-run with the new values. */
const touch = (name: string, locationX = 0, locationY = 0, width = 200, height = 100) =>
  act(() => {
    (state.card[name] as (event: unknown) => void)({ nativeEvent: { locationX, locationY } });
    (state.card["onLayout"] as (event: unknown) => void)({
      nativeEvent: { layout: { width, height } },
    });
  });

beforeEach(() => {
  state.reduced = false;
  state.card = {};
  state.glare = undefined;
  state.cover = undefined;
});

describe("HoloCard (native)", () => {
  it("rests level with a hidden glare", () => {
    draw();
    expect(state.card["className"]).toBe(
      "overflow-hidden rounded-[var(--radius-container)] bg-surface shadow-lg card",
    );
    expect(state.card["style"]).toEqual({
      transform: [{ perspective: 900 }, { rotateX: "0deg" }, { rotateY: "0deg" }],
    });
    expect(state.cover).toMatchObject({ importantForAccessibility: "no-hide-descendants" });
    expect((state.glare?.["style"] as unknown[] | undefined)?.[1]).toMatchObject({ opacity: 0 });
  });

  it("tilts toward the touch, clamped to the card, and moves the glare to the finger", () => {
    draw();
    touch("onTouchStart", 400, -50);
    touch("onTouchMove", 200, 0);
    expect(state.card["style"]).toEqual({
      transform: [{ perspective: 900 }, { rotateX: "10deg" }, { rotateY: "10deg" }],
    });
    expect((state.glare?.["style"] as unknown[] | undefined)?.[1]).toEqual({
      opacity: 0.35,
      transform: [{ translateX: 90 }, { translateY: -110 }],
    });
  });

  it("springs back level on release and on cancel", () => {
    draw();
    touch("onTouchStart", 0, 100);
    touch("onTouchEnd");
    expect(state.card["style"]).toEqual({
      transform: [{ perspective: 900 }, { rotateX: "0deg" }, { rotateY: "0deg" }],
    });
    touch("onTouchMove", 0, 100);
    touch("onTouchCancel");
    expect((state.glare?.["style"] as unknown[] | undefined)?.[1]).toMatchObject({ opacity: 0 });
  });

  it("is a plain card without touch, tilt or glare when still or under reduced motion", () => {
    draw({ isStill: true, className: undefined });
    expect(state.card).not.toHaveProperty("onTouchStart");
    expect(state.card["style"]).toBeUndefined();
    expect(state.glare).toBeUndefined();
    expect(state.card["className"]).toBe(
      "overflow-hidden rounded-[var(--radius-container)] bg-surface shadow-lg",
    );
    state.reduced = true;
    draw();
    expect(state.card).not.toHaveProperty("onTouchMove");
  });

  it("treats a zero-size layout as one point", () => {
    render(<HoloCard>x</HoloCard>);
    act(() =>
      (state.card["onLayout"] as (event: unknown) => void)({
        nativeEvent: { layout: { width: 0, height: 0 } },
      }),
    );
    touch("onTouchStart", 1, 1, 0, 0);
    expect((state.glare?.["style"] as unknown[] | undefined)?.[1]).toMatchObject({
      transform: [{ translateX: -109 }, { translateY: -109 }],
    });
  });
});
