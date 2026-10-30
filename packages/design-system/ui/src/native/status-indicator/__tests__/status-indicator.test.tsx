/**
 * Stackra file contract:
 * Purpose: proves the native StatusIndicator draws a distinct Lucide shape per tone in the tone's theme colour, hides
 *          the shape from screen readers, pulses forever only while `isAttention` is set and motion is not reduced,
 *          takes an icon in place of the shape and draws the state's name.
 * Boundary: React Native, Reanimated and HeroUI Native do not run in vitest, so they are recording stand-ins; what
 *          reaches them is checked, not the device's drawing.
 * Runtime: node
 * Governing contract: gap inventory row 30 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { Enum, Tone } from "@stackra/contracts";
import { render, screen } from "@testing-library/react";

import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { StatusIndicator } from "#native/status-indicator/status-indicator";

const state = vi.hoisted(() => ({
  reduced: false,
  sets: [] as unknown[],
  shapes: [] as Record<string, unknown>[],
  hidden: [] as Record<string, unknown>[],
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.hidden.push(props);
        return createElement("div", null, props["children"] as never);
      },
    },
    useSharedValue: (initial: unknown) => {
      const ref = useRef<{ get: () => unknown; set: (next: unknown) => void } | null>(null);
      if (!ref.current) {
        let value = initial;
        ref.current = {
          get: () => (typeof value === "number" ? value : 0),
          set: (next) => {
            value = next;
            state.sets.push(next);
          },
        };
      }
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
    withSequence: (...steps: unknown[]) => ({ sequence: steps }),
    withRepeat: (animation: unknown, count: number) => ({ repeat: animation, count }),
    cancelAnimation: () => undefined,
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": props["testID"] }, props["children"] as never),
  };
});

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));

vi.mock("@stackra/icons/native/lucide-icons", async () => {
  const { createElement } = await import("react");
  const shape = (name: string) => (props: Record<string, unknown>) => {
    state.shapes.push({ name, ...props });
    return createElement("i", { "data-shape": name });
  };
  return {
    CircleCheck: shape("circle-check"),
    CircleDashed: shape("circle-dashed"),
    OctagonX: shape("octagon-x"),
    SquareDot: shape("square-dot"),
    TriangleAlert: shape("triangle-alert"),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});

vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: ({ icon }: { icon: unknown }) => icon }));

describe("StatusIndicator (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.sets = [];
    state.shapes = [];
    state.hidden = [];
  });

  it("draws a distinct shape per tone, in the tone's colour, hidden from screen readers", () => {
    for (const tone of Enum.values(Tone)) render(<StatusIndicator tone={tone}>Late</StatusIndicator>);
    expect(new Set(state.shapes.map((shape) => shape["name"])).size).toBe(Enum.values(Tone).length);
    expect(state.shapes.map((shape) => shape["color"])).toEqual(
      Enum.values(Tone).map((tone) => `color:${STATUS_DOT_ROLE[tone]}`),
    );
    expect(state.hidden[0]).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
    expect(screen.getAllByText("Late")).toHaveLength(Enum.values(Tone).length);
  });

  it("pulses forever only while it needs attention and motion is not reduced", () => {
    const { rerender } = render(<StatusIndicator isAttention>Late</StatusIndicator>);
    expect(state.sets).toContainEqual(expect.objectContaining({ count: -1 }));
    state.sets = [];
    rerender(<StatusIndicator>Late</StatusIndicator>);
    expect(state.sets).toEqual([0]);
    state.sets = [];
    state.reduced = true;
    render(<StatusIndicator isAttention>Late</StatusIndicator>);
    expect(state.sets).not.toContainEqual(expect.objectContaining({ count: -1 }));
  });

  it("takes an icon in place of the shape", () => {
    render(<StatusIndicator icon={<b data-testid="mine" />}>Ready</StatusIndicator>);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(state.shapes).toEqual([]);
  });
});
