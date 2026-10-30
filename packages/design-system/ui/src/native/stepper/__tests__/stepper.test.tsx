/**
 * Stackra file contract:
 * Purpose: proves the native Stepper: a named list of steps whose status comes from the current step (complete,
 *          current, upcoming) or the step's own status (error, optional), said in each step's label; a done step
 *          shows a check, an icon marker its icon, the rest their number; only pressable steps are buttons (done ones
 *          when linear, any but the current when not) and report their id; the compact variant says "step n of m".
 * Boundary: React Native does not render in vitest, so it and the house Text, Icon and SlotIcon are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { StepperStep } from "#contracts/types/stepper-step.type";

import { Stepper } from "#native/stepper/stepper";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.buttons.push(props);
      return createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": `icon:${String(props["name"])}` }),
  };
});
vi.mock("#native/slot-icon/slot-icon", async () => {
  const { createElement } = await import("react");
  return { SlotIcon: () => createElement("i", { "data-testid": "slot-icon" }) };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const STEPS: readonly StepperStep[] = [
  { id: "a", label: "Cart" },
  { id: "b", label: "Address", description: "Where to" },
  { id: "c", label: "Pay", icon: "credit-card" },
  { id: "d", label: "Gift", status: "optional" },
  { id: "e", label: "Review", status: "error" },
];
const labelled = () =>
  state.views
    .filter((view) => view["accessible"] && view["accessibilityState"])
    .map((view) => [view["accessibilityLabel"], view["accessibilityState"]]);

beforeEach(() => {
  state.views.length = 0;
  state.buttons.length = 0;
});

describe("Stepper (native)", () => {
  it("is a named list whose steps say their status, with a check on the done ones", () => {
    render(<Stepper steps={STEPS} currentStep="b" />);
    expect(state.views.find((view) => view["accessibilityRole"] === "list")).toMatchObject({
      accessibilityLabel: "ui::stepper.label",
    });
    expect(labelled()).toEqual([
      ["Cart, ui::stepper.complete", { selected: false }],
      ["Address", { selected: true }],
      ["Pay", { selected: false }],
      ["Gift, ui::stepper.optional", { selected: false }],
      ["Review, ui::stepper.error", { selected: false }],
    ]);
    expect(screen.getAllByTestId("icon:check")).toHaveLength(1);
    expect(screen.getByText("Where to")).toBeTruthy();
    expect(screen.getAllByText("ui::stepper.optional")).toHaveLength(1);
    expect(screen.getByText("3")).toBeTruthy();
    expect(state.buttons).toHaveLength(0);
  });

  it("lets a linear stepper go back to done steps only, reporting the id", () => {
    const onStepPress = vi.fn();
    render(<Stepper steps={STEPS} currentStep="c" onStepPress={onStepPress} label="Checkout" />);
    expect(state.buttons.map((button) => button["accessibilityLabel"])).toEqual([
      "Cart, ui::stepper.complete",
      "Address, ui::stepper.complete",
    ]);
    fireEvent.click(screen.getByLabelText("Address, ui::stepper.complete"));
    expect(onStepPress).toHaveBeenCalledWith("b");
  });

  it("lets a free stepper go to any step but the current, drawn vertically with icon markers", () => {
    render(
      <Stepper
        steps={STEPS}
        currentStep="a"
        onStepPress={() => undefined}
        isLinear={false}
        orientation="vertical"
        marker="icon"
      />,
    );
    expect(state.buttons).toHaveLength(4);
    expect(screen.getByTestId("slot-icon")).toBeTruthy();
    expect(state.views.some((view) => String(view["className"]).includes("pb-6"))).toBe(true);
  });

  it("says the position in the compact variant", () => {
    render(<Stepper steps={STEPS} currentStep="b" variant="compact" label="Checkout" />);
    expect(state.views[0]).toMatchObject({
      accessible: true,
      accessibilityLabel: 'Checkout, ui::stepper.step_of {"step":"2","total":"5"}, Address',
    });
    expect(state.views.filter((view) => String(view["className"]).startsWith("h-2"))).toHaveLength(
      5,
    );
  });

  it("falls back to the first step when no step is current in the compact variant", () => {
    render(
      <Stepper
        steps={[{ id: "a", label: "Only", status: "error" }]}
        currentStep="z"
        variant="compact"
      />,
    );
    expect(String(state.views[0]?.["accessibilityLabel"])).toContain("Only");
  });
});
