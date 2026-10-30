/**
 * Stackra file contract:
 * Purpose: proves the native SettingRow hands the house Switch its title, description, value and disabled state,
 *          opens the detail only while on, and draws the title, description and action when there is no switch.
 * Boundary: React Native, react-native-reanimated and the house children do not run in vitest, so they are replaced by
 *          recording stand-ins that render plain DOM; the Switch's own haptic is proved in its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { SettingRow } from "#native/setting-row/setting-row";

/** What the stand-ins were handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  reduced: false,
  announced: [] as string[],
  played: [] as string[],
  sets: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "data-role": props["role"], "aria-label": props["accessibilityLabel"] },
        props["children"] as never,
      ),
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const builder: unknown = new Proxy({}, { get: () => () => builder });
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", { "data-animated": "true" }, props["children"] as never),
    },
    ReduceMotion: { System: "system" },
    FadeIn: builder,
    FadeOut: builder,
    ZoomIn: builder,
    ZoomOut: builder,
    SlideInDown: builder,
    SlideOutDown: builder,
    useReducedMotion: () => state.reduced,
    useSharedValue: (value: unknown) => ({
      get: () => value,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (to: number) => ({ timing: to }),
    withSequence: (...steps: unknown[]) => ({ sequence: steps }),
  };
});

vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => createElement("span", {}, props["children"] as never),
  };
});

const received = vi.hoisted(() => ({ switch: {} as Record<string, unknown> }));

vi.mock("#native/switch/switch", async () => {
  const { createElement } = await import("react");
  return {
    Switch: (props: Record<string, unknown>) => {
      received.switch = props;
      return createElement("input", {
        type: "checkbox",
        role: "switch",
        "aria-label": props["label"] as string,
        checked: props["value"] as boolean,
        readOnly: true,
        onClick: () => (props["onChange"] as (next: boolean) => void)(!(props["value"] as boolean)),
      });
    },
  };
});

vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));

describe("SettingRow (native)", () => {
  it("hands the switch its words and state, and opens the detail while on", () => {
    const onChange = vi.fn();
    render(
      <SettingRow
        title="Print receipts"
        description="After every sale"
        isDisabled={false}
        onChange={onChange}
        detail={<span>Printer settings</span>}
      />,
    );
    expect(received.switch).toMatchObject({
      label: "Print receipts",
      description: "After every sale",
      value: false,
      isDisabled: false,
    });
    expect(screen.queryByText("Printer settings")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Print receipts" }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Printer settings")).toBeTruthy();
  });

  it("draws the words and the action when there is no switch", () => {
    render(
      <SettingRow
        title="Taxes"
        description="VAT 15%"
        action={<button type="button">Manage</button>}
      />,
    );
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByText("Taxes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });
});
